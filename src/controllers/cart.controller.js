import Cart from "../models/cart.model.js";
import ProductVariant from "../models/productVariant.model.js"
import { validateMongoId } from "../utils/mongo.utils.js";
import { cleanMongoObject } from "../utils/mongo.utils.js";

//compare 2 arrays with objects {optionName, optionValue}
function areOptionsArrEqual(arr1, arr2) {
    //both array are empty
    if (arr1.length === 0 && arr2.length === 0) return true;

    // If lengths don't match, they aren't equal
    if (arr1.length !== arr2.length) return false;

    // Check if every item in arr1 has a matching counterpart in arr2
    return arr1.every(obj1 =>
        arr2.some(obj2 =>
            obj1.optionName === obj2.optionName &&
            obj1.optionValue === obj2.optionValue
        )
    );
}
//function that will check if cart new product already in cart with same purchase options
const checkOverlappingProductInCart = (cart, productId, purchaseOptions) => {
    // Find the item that matches BOTH the product ID AND has identical options
    const existingItem = cart.items.find(item =>
        item.product.toString() === productId &&
        areOptionsArrEqual(item.purchaseOptions, purchaseOptions)
    );

    if (!existingItem) {
        return [false, undefined];
    }

    return [true, existingItem];
}

export const addToCart = async (req, res) => {
    const { 
        productId,
        purchaseOptions = [],
        quantity = 1,
        currency
    } = req.body;
    const userId = req.user.id;

    //mongo id and quantity verification
    if (!validateMongoId(productId)) {
        return res.status(400).json({ error: "invalid product" });
    }
    if(!currency){
        return res.status(400).json({ error: "currency is required" });
    }
    if (quantity < 1) {
        return res.status(400).json({ error: "quantity is required" });
    }

    // Check product exists
    const product = await ProductVariant.findById(productId).lean();
    if (!product) {
        return res.status(404).json({
            error: "Product not found"
        });
    }
    if(product.isDeleted || !product.availableStock){
        return res.status(404).json({
            error: "Product not found"
        });
    }
    //check if product is available based on currency
    let isCurrencyAvailable = false;
    product.pricing.forEach(pri => {
        if (pri.currency === currency.trim().toUpperCase()) {
            isCurrencyAvailable = true;
            return;
        }
    });
    if (!isCurrencyAvailable) {
        return res.status(400).json({ error: "product not available in current currency" })
    }

    // Find user's cart
    let cart = await Cart.findOne({ user: userId });

    // Create cart if it doesn't exist
    if (!cart) {
        cart = new Cart({
            user: userId,
            items: [{
                product: productId,
                quantity,
                purchaseOptions
            }]
        });
        await cart.save();
        //converting cart to object and _id to id and return
        const cartF = cleanMongoObject(cart);
        return res.status(200).json({ success: true, cart: cartF });
    }

    //checking overlapping products 
    const [isOverlapping, existingItem] = checkOverlappingProductInCart(cart, productId, purchaseOptions);

    //increase product quantity if product already in cart else add it in cart
    if (isOverlapping) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            product: productId,
            quantity,
            purchaseOptions
        });
    }
    cart.markModified('items');     //!DON'T Remove 
    await cart.save();

    return res.status(200).json({ success: true});
};

export const addMultipleProductsToCart = async (req, res) => {
    const products = req.body.products;
    const userId = req.user.id;

    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "products are required" });
    }

    // Normalize and validate every entry before changing the cart.  Entries
    // with different purchase options are separate cart lines.
    const itemsToAdd = products.map((p) => ({
        product: p?.id,
        quantity: p?.quantity === undefined ? 1 : p.quantity,
        purchaseOptions: p?.purchaseOptions || []
    }));

    //validating products 
    for (const item of itemsToAdd) {
        if (!validateMongoId(item.product)) {
            return res.status(400).json({ error: "invalid product", prod: item });
        }
        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
            return res.status(400).json({ error: "quantity must be at least 1" });
        }
        if (!Array.isArray(item.purchaseOptions)) {
            return res.status(400).json({ error: "purchaseOptions must be an array" });
        }
    }


    // Find user's cart
    let cart = await Cart.findOne({ user: userId });

    //cart not found create one
    if (!cart) {
        cart = new Cart({
            user: userId,
            items: []
        });
    }

    for (const item of itemsToAdd) {
        const [isOverlapping, existingItem] = checkOverlappingProductInCart(
            cart,
            item.product,
            item.purchaseOptions
        );

        if (isOverlapping) {
            existingItem.quantity += item.quantity;
        } else {
            cart.items.push(item);
        }
    }

    cart.markModified("items");
    await cart.save();
    return res.status(200).json({ success: true });

};

export const removeFromCart = async (req, res) => {

    const { itemId } = req.params;
    const userId = req.user.id;

    //validating inputs
    if (!itemId || !userId) {
        return res.status(400).json({
            error: "product id and userId is required"
        });
    }
    //mongo id verification
    if (!validateMongoId(itemId)) {
        return res.status(400).json({ error: "invalid product" });
    }
    //accessing cart and validating
    const cart = await Cart.findOneAndUpdate(
        { user: userId },
        {
            $pull: {
                items: { _id: itemId }
            }
        },
        { returnDocument: "after", runValidators: true }
    );
    //error if cart does not exist
    if (!cart) {
        return res.status(404).json({
            error: "Cart not found"
        });
    }
    

    return res.status(200).json({ success: true });

};

export const clearCart = async (req, res) => {
    const userId = req.user.id
    const cart = await Cart.findOneAndUpdate(
        { user: userId },
        {
            $set: {
                items: []
            }
        },
        { returnDocument: "after", runValidators: true }
    )
    if (!cart) {
        return res.status(400).json({ error: "cart does not exist" });
    }
    //converting cart to object and _id to id
    const cartF = cleanMongoObject(cart);
    res.status(200).json({ success: true, cart: cartF });


}

export const updateQuantity = async (req, res) => {
    const { itemId } = req.params;
    const {quantity} = req.query;
    const userId = req.user.id;
    //validating req parameters
    if (!itemId || !quantity) {
        return res.status(400).json({
            error: "quantity and product id is required"
        });
    }

    //mongo id verification
    if (!validateMongoId(itemId)) {
        return res.status(400).json({ error: "invalid product" });
    }
    //validating quantity
    if (quantity < 1) {
        return res.status(400).json({
            error: "Quantity must be at least 1"
        });
    }

    const cart = await Cart.findOneAndUpdate(
        {
            user: userId,
            "items._id": itemId
        },
        {
            $set: { "items.$.quantity": quantity }
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    );

    if (!cart) {
        return res.status(404).json({
            error: "Cart or product not found "
        });
    }
    
    return res.status(200).json({ success: true });

}

export const getCart = async (req, res) => {
    const userId = req.user.id;
    
    const currency = String(req.query?.currency || "").trim().toUpperCase();
    if(!currency){
        req.status(400).json({error:"currency is required"});
    }
    const cart = await Cart.findOne({ user: userId })
        .populate("items.product", "name pricing imageUrls pricingTiers purchaseOptions")
        .lean();

    if (!cart) {
        return res.status(200).json({
            cart: { id: null, user: userId, currency, totals: { cartTotalMRP: 0, cartTotal: 0 }, items: [] }
        });
    }

    const findOption = (productOptions, selectedOption, currency) => {
        
        const returnOption = {};
        if(!productOptions.length || !selectedOption || !currency){
            return {};
        }
        // console.log(selectedOption);
        const viableOption = productOptions.find(option => selectedOption.optionName.trim().toLowerCase() === option.optionName.trim().toLowerCase());

        // console.log(viableOption);
        if(!viableOption) return {};   //no option found

        const applicableOption = viableOption.optionValues.find(op => op.option.trim().toLowerCase() ===selectedOption.optionValue.trim().toLowerCase());
        if(!applicableOption ) return {};    //no option found

        //finding applicable pricing
        const applicablePrice = applicableOption.pricingChange.find(pc => pc.currency.trim().toUpperCase() === currency.trim().toUpperCase());
        
        returnOption.optionName = viableOption.optionName;
        returnOption.optionValue = applicableOption.option;
        returnOption.price = applicablePrice.priceChange || 0

        return returnOption;
    };

    let cartTotal = 0;
    let cartTotalMRP = 0;
    const items = cart.items.map(item => {
        const product = item.product || {};
        const selectedOptions = item.purchaseOptions || [];
        
        const basePricing = (product.pricing || []).find(price =>
            String(price.currency || "").toUpperCase() === currency
        ) || {};
        
        const optionPrices = selectedOptions.map(option => findOption(product.purchaseOptions || [], option, currency) || {});
        
        const unitPrice = Number(basePricing.price ?? basePricing.unitPrice ?? 0) +
            optionPrices.reduce((sum, option) => sum + Number(option.price ?? 0), 0);
        const comparePrice = Number(basePricing.comparePrice ?? basePricing.price ?? 0) +
            optionPrices.reduce((sum, option) => sum + Number(option.price?? 0), 0);
        const lineTotal = unitPrice * item.quantity;
        cartTotal += lineTotal;
        cartTotalMRP += comparePrice * item.quantity;

        return {
            id: item._id,
            productId: product._id,
            name: product.name,
            imageUrl: product.imageUrls?.[0],
            quantity: item.quantity,
            selectedOptions,
            pricing: { unitPrice, comparePrice, lineTotal }
        };
    });

    return res.status(200).json({
        cart: { id: cart._id, user: cart.user, currency, totals: { cartTotalMRP, cartTotal }, items }
    });
}

//method to create the new cart if user register or login during checkout
export const createCart = async (req, res) => {
        const userId = req.user.id;
        let cart;
        cart = await Cart.findById({user: userId})
        if (!cart) {
            cart = new Cart({
                user: userId,
            })
            await cart.save();
        }
        //converting cart to object and _id to id
        const cartF = cleanMongoObject(cart);

        res.status(200).json({ success: true, cart: cartF });
    
}