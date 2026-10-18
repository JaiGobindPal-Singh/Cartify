import Cart from "../../models/cart.model.js";
import Order from "../../models/order.model.js";
import ProductVariant from "../../models/productVariant.model.js";
import Transaction from "../../models/transaction.model.js";
import DeliveryOption from "../../models/deliveryOption.model.js";
import { validateDiscount } from "../discount/discount.operation.js";
import { getApplicableCharges } from "../charge/charge.operation.js";
import { createOrder as createRazorpayOrder } from "../../modules/payments/razorpay/razorpay.service.js";
import { createOrder as createPaypalOrder } from "../../modules/payments/paypal/paypal.service.js";

// A small helper to clean money values.
// JavaScript can have floating point issues, so we round to 2 decimal places.
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// Find the extra price added by a product option like size/color.
// Example: T-shirt price is 100, extra XL charge is 20, so final product unit price = 120.
const findOptionPrice = (product, selectedOption, currency) => {
    const option = (product.purchaseOptions || []).find((item) =>
        item.optionName?.trim().toLowerCase() === selectedOption.optionName?.trim().toLowerCase()
    );
    const value = option?.optionValues?.find((item) =>
        item.option?.trim().toLowerCase() === selectedOption.optionValue?.trim().toLowerCase()
    );
    return Number(value?.pricingChange?.find((item) =>
        item.currency?.trim().toUpperCase() === currency
    )?.priceChange || 0);
};

// Build a snapshot of the cart for checkout.
// This is a temporary order summary before payment is created.
// It calculates product price + selected option price + quantity and adds them to subtotal.
const buildCartSnapshot = (cart, currency) => {
    let subtotal = 0;
    const items = cart.items.map((item) => {
        const product = item.product;
        const basePrice = product.pricing.find((price) => price.currency === currency);
        if (!basePrice) throw new Error(`Product ${product.name} is unavailable in ${currency}`);

        const optionPrice = (item.purchaseOptions || [])
            .reduce((total, option) => total + findOptionPrice(product, option, currency), 0);
        const unitPrice = Number(basePrice.price) + optionPrice;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        return {
            product: product._id,
            purchasePrice: { amount: roundMoney(unitPrice) },
            purchaseOptions: item.purchaseOptions || [],
            quantity: item.quantity,
            lineTotal: roundMoney(lineTotal),
        };
    });

    return { items, subtotal: roundMoney(subtotal) };
};

// Before payment is confirmed, we reserve stock so the same product is not sold to two customers.
// If anything fails, the stock is released again.
const reserveInventory = async (items) => {
    const reserved = [];
    try {
        for (const item of items) {
            const product = await ProductVariant.findOneAndUpdate(
                { _id: item.product, availableStock: { $gte: item.quantity }, isDeleted: false },
                { $inc: { availableStock: -item.quantity, reservedStock: item.quantity } },
                { returnDocument: "after" }
            );
            if (!product) throw new Error("One or more products are out of stock");
            reserved.push({ product: item.product, quantity: item.quantity });
        }
        return reserved;
    } catch (error) {
        await releaseInventory(reserved);
        throw error;
    }
};
//release inventory in case order failed
export const releaseInventory = async (items) => {
    await Promise.all(items.map((item) => ProductVariant.updateOne(
        { _id: item.product, reservedStock: { $gte: item.quantity } },
        { $inc: { availableStock: item.quantity, reservedStock: -item.quantity } }
    )));
};

//update reserved inventory after order is processed
export const commitInventory = async (items) => {
    await Promise.all(items.map((item) => ProductVariant.updateOne(
        { _id: item.product, reservedStock: { $gte: item.quantity } },
        { $inc: { reservedStock: -item.quantity } }
    )));
};

// Main checkout flow.
// This is the place where a cart becomes an order.
// Steps:
// 1) Read user checkout details
// 2) Validate delivery option and cart
// 3) Calculate subtotal, charges, and discounts
// 4) Reserve inventory
// 5) Create order record
// 6) Create payment request with Razorpay or PayPal
// 7) Create transaction record
// 8) Return the order and payment details
export const createOrder = async ({ userId, orderData }) => {
    const {
        deliveryAddress,
        deliveryType,
        paymentOption = "ONLINE",
        currency,
        discountCode,
    } = orderData;
    const normalizedCurrency = currency?.trim().toUpperCase();
    if (!normalizedCurrency) throw new Error("Currency is required");

    const deliveryOption = await DeliveryOption.findOne({ _id: deliveryType, isActive: true }).lean();
    if (!deliveryOption) throw new Error("Invalid delivery option");

    // Get the logged-in user's cart with product details needed for checkout.
    const cart = await Cart.findOne({ user: userId })
        .populate("items.product", "name pricing purchaseOptions isDeleted availableStock")
        .lean();
    if (!cart?.items?.length) throw new Error("Cart is empty");

    // Convert cart items into a clean snapshot for payment calculation.
    const snapshot = buildCartSnapshot(cart, normalizedCurrency);

    // Add delivery and payment charges based on customer location and payment method.
    const charges = await getApplicableCharges({
        country: deliveryAddress.country,
        postalCode: deliveryAddress.postalCode,
        currency: normalizedCurrency,
        deliveryType: deliveryOption.optionName,
        paymentOption,
        cartValue: snapshot.subtotal,
    });

    //validating discount code
    let discount = 0;
    let discountResult = null;
    if (discountCode) {
        discountResult = await validateDiscount({
            code: discountCode,
            cartTotal: snapshot.subtotal,
            currency: normalizedCurrency,
            userId,
        });
        if (discountResult.error) throw new Error(discountResult.error);
        discount = discountResult.discountAmount;
    }

    // Final amount user must pay after discount and charges.
    const totalCharges = charges.reduce((total, charge) => total + Number(charge.chargeAmount || 0), 0);
    const totalBill = roundMoney(Math.max(0, snapshot.subtotal - discount + totalCharges));

    // Remove the temporary lineTotal field before saving the order.
    const items = snapshot.items.map(({ lineTotal, ...item }) => item);

    // Reserve stock before creating the order, so the stock is not oversold.
    const reserved = await reserveInventory(items);

    let order;
    let transaction;
    try {
        // Save order with initial payment-pending state.
        order = await Order.create({
            user: userId,
            status: "PAYMENT_PENDING",
            statusHistory: [{ status: "PAYMENT_PENDING" }],
            items,
            billing: {
                paymentMode: paymentOption,
                currency: normalizedCurrency,
                subtotal: snapshot.subtotal,
                discount,
                charges,
                totalBill,
                billingAddress: deliveryAddress,
            },
            deliveryDetails: { deliveryAddress, deliveryType },
        });

        // Create payment request with the selected provider.
        // Razorpay is used for INR and PayPal for other currencies.
        const payment = normalizedCurrency === "INR"
            ? await createRazorpayOrder({
                amount: totalBill,
                currency: normalizedCurrency,
                receipt: order._id.toString(),
            })
            : await createPaypalOrder({
                amount: totalBill,
                currency: normalizedCurrency,
                referenceId: order._id.toString(),
            });

        // Save the payment transaction reference to track success/failure later.
        const transactionOrderId = normalizedCurrency === "INR" ? payment.id : payment.id;
        transaction = await Transaction.create({
            user: userId,
            order: order._id,
            paymentGateway: normalizedCurrency === "INR" ? "RAZORPAY" : "PAYPAL",
            transactionOrderId,
            paymentMethod: paymentOption,
            currency: normalizedCurrency,
            amount: totalBill,
            status: "PENDING",
        });

        order.transaction = transaction._id;
        await order.save();
        return { order, payment, discount: discountResult };
    } catch (error) {
        //error occurred revert changes
        if (transaction?._id) await Transaction.deleteOne({ _id: transaction._id });
        if (order?._id) await Order.deleteOne({ _id: order._id });
        await releaseInventory(reserved);
        throw error;
    }
};

export const updateOrderStatusByAdmin = async (orderId, status, reason) => {
    const order = await Order.findById(orderId);
    if (!order) return null;
    order.status = status;
    order.statusHistory.push({ status });
    if (status === "CANCELLED" && reason) order.cancellationReason = reason;
    await order.save();
    return order;
};

// set order status to failed and release inventory incase order is failed
const failOrderPayment = async (order, transaction) => {
    const inventory = order.items.map((item) => ({ product: item.product, quantity: item.quantity }));
    await releaseInventory(inventory);

    if (transaction && transaction.status !== "FAILED") {
        transaction.status = "FAILED";
        await transaction.save();
    }

    order.status = "PAYMENT_FAILED";
    order.statusHistory.push({ status: order.status });
    await order.save();
    return order;
};

//abort order in case payment portal closed
export const abortOrderOnDismiss = async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order || order.status !== "PAYMENT_PENDING") return order;

    const transaction = await Transaction.findOne({ order: order._id });
    if (transaction && transaction.status !== "PENDING") return order;

    return failOrderPayment(order, transaction);
};

//update delivery details of order like tracking id
export const updateOrderDeliveryDetailsByAdmin = async (orderId, deliveryPartner, trackingId) => {
  const order = await Order.findById(orderId);
  //validating order
  if (!order) throw new Error("Order not found");
  if (order.status === "PAYMENT_PENDING" || order.status === "PAYMENT_FAILED") throw new Error("Cannot update delivery details for this order");

  //update
  order.deliveryDetails.deliveryPartner = deliveryPartner;
  order.deliveryDetails.trackingId = trackingId;
  await order.save();
  return order;


}


// This function is called after the payment gateway redirects back.
// It checks whether the payment was successful and updates the order status.
export const handlePaymentResult = async (payment) => {
    //fetching transaction
    const transaction = await Transaction.findOne({ transactionOrderId: payment.transactionOrderId });
    if (!transaction) throw new Error("Payment transaction not found");

    //transaction status is already updated
    if (transaction.status !== "PENDING") return Order.findById(transaction.order);
    transaction.transactionId = payment.transactionId;
    transaction.paymentMethod = payment.paymentMethod || transaction.paymentMethod;

    //updating transaction
    transaction.status = payment.status;
    await transaction.save();

    //updating order
    const order = await Order.findById(transaction.order);
    if (!order) throw new Error("Order not found for payment transaction");
    const inventory = order.items.map((item) => ({ product: item.product, quantity: item.quantity }));

    //updating inventory based on order status
    if (payment.status === "SUCCESS") {
        await commitInventory(inventory);
        order.status = "ORDER_PLACED";
    } else if (payment.status === "FAILED") {
        await releaseInventory(inventory);
        order.status = "PAYMENT_FAILED";
    } else {
        return order;
    }
    order.statusHistory.push({ status: order.status });
    await order.save();
    return order;
};

export const getUserOrders = async (userId, { pageNumber = 1, pageSize = 10 } = {}) => {
    const normalizedPageNumber = Math.max(parseInt(pageNumber, 10) || 1, 1);
    const normalizedPageSize = Math.max(parseInt(pageSize, 10) || 10, 1);
    const filter = { user: userId };

    const [orders, totalOrders] = await Promise.all([
        Order.find(filter)
            .select("status deliveryDetails.deliveryType billing.totalBill billing.currency createdAt")
            .populate("deliveryDetails.deliveryType", "optionName")
            .sort({ createdAt: -1 })
            .skip((normalizedPageNumber - 1) * normalizedPageSize)
            .limit(normalizedPageSize)
            .lean(),
        Order.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalOrders / normalizedPageSize);
    return {
        orders,
        totalOrders,
        totalPages,
        currentPage: normalizedPageNumber,
        hasNextPage: normalizedPageNumber < totalPages,
        hasPrevPage: normalizedPageNumber > 1,
    };
};

export const getOrderDetails = async (orderId, userId, role) => {
    const filter = { _id: orderId };
  if (userId && role.toUpperCase() !== "ADMIN") filter.user = userId;  //allow admin to access all orders
  if (role === "ADMIN") {
    //aggregation pipeline to only update if order is order_placed
    const update = [
      {
        $set: {
          // 1. Update status only if it is "ORDER_PLACED"
          status: {
            $cond: {
              if: { $eq: ["$status", "ORDER_PLACED"] },
              then: "PROCESSING",
              else: "$status"
            }
          },
          // 2. Push to statusHistory ONLY if the condition matches
          statusHistory: {
            $cond: {
              if: { $eq: ["$status", "ORDER_PLACED"] },
              then: {
                $concatArrays: [
                  { $ifNull: ["$statusHistory", []] }, // Handles null/undefined safely
                  [
                    {
                      status: "PROCESSING",
                      updatedAt: new Date()
                    }
                  ]
                ]
              },
              else: { $ifNull: ["$statusHistory", []] } // Leaves history unchanged if not updated
            }
          }
        }
      }
    ];
    return Order.findOneAndUpdate(filter, update, { returnDocument: "after", updatePipeline: true }) //auto update order  if opened by admin
      .populate("items.product", "name imageUrls")
      .populate("deliveryDetails.deliveryType", "optionName")
      .populate("transaction")
      .populate("user", "name email uid -_id")
      .lean();
  }
  return Order.findOne(filter) //just fetch order and return
    .populate("items.product", "name imageUrls")
    .populate("deliveryDetails.deliveryType", "optionName")
    .populate("transaction")
    .lean();
};

export const getAllOrdersByAdmin = async (status, { pageNumber = 1, pageSize = 10 } = {}) => {
    const normalizedPageNumber = Math.max(parseInt(pageNumber, 10) || 1, 1);
    const normalizedPageSize = Math.max(parseInt(pageSize, 10) || 10, 1);
    const filter = status ? { status: status.toUpperCase() } : {};

    const [orders, totalOrders] = await Promise.all([
        Order.find(filter)
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip((normalizedPageNumber - 1) * normalizedPageSize)
            .limit(normalizedPageSize)
            .select("status deliveryDetails.deliveryType billing.totalBill billing.currency createdAt")
            .lean(),
        Order.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalOrders / normalizedPageSize);
    return {
        orders,
        totalOrders,
        totalPages,
        currentPage: normalizedPageNumber,
        hasNextPage: normalizedPageNumber < totalPages,
        hasPrevPage: normalizedPageNumber > 1,
    };
};
