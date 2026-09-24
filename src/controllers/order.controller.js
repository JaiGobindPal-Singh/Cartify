import { validateMongoId, cleanMongoObject } from "../utils/mongo.utils.js";
import {
    createOrder,
    updateOrderStatusByAdmin,
    handlePaymentResult,
    getUserOrders,
    getOrderDetails,
    getAllOrdersByAdmin,
} from "../operations/order/order.operation.js";
import { statusEnum } from "../constants/orderStatuses.js";

const handleError = (error, res) => {
    if (error?.name === "ValidationError" || error?.name === "CastError") {
        return res.status(400).json({ error: "Invalid order data" });
    }
    console.error("Order error:", error);
    return res.status(500).json({ error: error.message || "Something went wrong on the server" });
};

export const createOrderController = async (req, res) => {
    try {
        const result = await createOrder({ userId: req.user.id, orderData: req.body || {} });
        return res.status(201).json({
            success: true,
            order: cleanMongoObject(result.order),
            payment: result.payment,
            discount: result.discount,
        });
    } catch (error) {
        return handleError(error, res);
    }
};

export const updateOrderStatusByAdminController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, reason } = req.body || {};
        const normalizedStatus = String(status || "").toUpperCase();
        if (!validateMongoId(orderId) || !statusEnum.includes(normalizedStatus)) {
            return res.status(400).json({ error: "Invalid order id or status" });
        }
        const order = await updateOrderStatusByAdmin(orderId, normalizedStatus, reason);
        if (!order) return res.status(404).json({ error: "Order not found" });
        return res.status(200).json({ success: true, order: cleanMongoObject(order) });
    } catch (error) {
        return handleError(error, res);
    }
};

export const paymentResultController = async (req, res, next) => {
    try {
        const order = await handlePaymentResult(req.payment);
        return res.status(200).json({ success: true, order });
    } catch (error) {
        return handleError(error, res);
    }
};

export const getUserOrdersController = async (req, res) => {
    try {
        const pageNumber = req.query.pn
            ? Math.max(parseInt(req.query.pn, 10), 1) || 1
            : 1;
        const pageSize = req.query.ps
            ? Math.max(parseInt(req.query.ps, 10), 1) || 10
            : 10;

        const result = await getUserOrders(req.user.id, { pageNumber, pageSize });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return handleError(error, res);
    }
};

export const getOrderDetailsController = async (req, res) => {
    try {
        if (!validateMongoId(req.params.orderId)) return res.status(400).json({ error: "Invalid order id" });
        const order = await getOrderDetails(req.params.orderId, req.user.id);
        if (!order) return res.status(404).json({ error: "Order not found" });
        return res.status(200).json({ success: true, order });
    } catch (error) {
        return handleError(error, res);
    }
};

export const getAllOrdersByAdminController = async (req, res) => {
    try {
        const status = req.query.status?.toUpperCase();
        if (status && !statusEnum.includes(status)) return res.status(400).json({ error: "Invalid order status" });

        const pageNumber = req.query.pn
            ? Math.max(parseInt(req.query.pn, 10), 1) || 1
            : 1;
        const pageSize = req.query.ps
            ? Math.max(parseInt(req.query.ps, 10), 1) || 10
            : 10;

        const result = await getAllOrdersByAdmin(status, { pageNumber, pageSize });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return handleError(error, res);
    }
};