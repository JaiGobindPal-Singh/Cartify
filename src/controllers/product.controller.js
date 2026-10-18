import ProductVariant from "../models/productVariant.model.js";
import { processImages, deleteImage } from "../utils/imageHandler.utils.js"
import { validateMongoId } from "../utils/mongo.utils.js"
import Category from "../models/category.model.js"
//only admin access
export const createProduct = async (req, res) => {

    const reqBody = JSON.parse(req.body.data);
    if (!reqBody) {
        return res.status(400).json({ error: "invalid body" });
    }
    const {
        name,
        description,
        sections,
        //images in req.file
        pricing,
        pricingTiers = [],
        purchaseOptions,
        isFeatured = false,
        isUpcoming = false,
        availableStock,   //inventory
        category,
        keywords,
        parent = null
    } = reqBody;

    //validation
    if (!name) {
        return res
            .status(400)
            .json({ error: "product name is required" });
    }

    if (!category) {
        return res.status(400).json({ error: "product category is required" });
    }

    if (!pricing || !Array.isArray(pricing) || pricing.length < 1) {
        return res
            .status(400)
            .json({ error: "product pricing is required" });
    }

    //upload product images and get the URL
    const productImageUrls = await processImages(req);

    //saving the product to the database
    const product = new ProductVariant({
        name,
        // product: parentProduct._Id, later
        category,
        keywords,
        description,
        sections,
        imageUrls: Array.from(productImageUrls),
        ranking: 0,
        pricing,
        pricingTiers,
        purchaseOptions,
        isFeatured,
        isUpcoming,
        availableStock,
        reservedStock: 0
    });
    await product.save();


    //creating response
    const { _id, ...FProduct } = product.toObject();
    const response = {
        id: _id,
        ...FProduct,
    }

    //returning the response
    return res
        .status(201)
        .json({
            success: true,
            ...response
        });

};
export const deleteProduct = async (req, res) => {

    const { productId } = req.params;
    const deletedProduct = await ProductVariant.findByIdAndUpdate(productId,
        {
            $set: { isDeleted: true }
        }
    )

    //if product dont exist
    if (!deletedProduct) {
        return res.status(404).json({ error: "Product not found" });
    }

    //dont delete the product images from storage 
    // await Promise.all(
    //     (deletedProduct.imageUrls ?? []).map((img) => deleteImage(img))
    // );

    return res.status(200).json({ success: true });

};
export const updateProduct = async (req, res) => {

    const { productId } = req.params;
    if (!req.body) {

        return res.status(400).json({ error: "invalid request body", body: req.body });
    }
    const reqBody = req.body;

    //validating the data
    const {
        name,
        description,
        category,
        keywords,
        sections,
        pricing,
        pricingTiers,
        purchaseOptions,
        isFeatured,
        isUpcoming,
        availableStock,
        reservedStock
    } = reqBody;

    //validation
    if (!validateMongoId(productId)) {
        return res.status(400).json({ error: "Product ID is required" });
    }
    //check if product exists
    const product = await ProductVariant.findById(productId);
    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    //update the product details
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (typeof isFeatured === 'boolean') product.isFeatured = isFeatured;
    if (typeof isUpcoming === 'boolean') product.isUpcoming = isUpcoming;
    if (Array.isArray(keywords) && keywords.length) product.keywords = keywords;
    if (pricingTiers && Array.isArray(pricingTiers) && pricingTiers.length) product.pricingTiers = pricingTiers;
    if (pricing && Array.isArray(pricing) && pricing.length) product.pricing = pricing;
    if (purchaseOptions && Array.isArray(purchaseOptions) && purchaseOptions.length) product.purchaseOptions = purchaseOptions;
    if (sections && Array.isArray(sections) && sections.length) product.sections = sections;
    if (availableStock !== null && !isNaN(Number(availableStock))) product.availableStock = availableStock;
    if (reservedStock !== null && !isNaN(Number(reservedStock))) product.reservedStock = reservedStock;
    await product.save();

    const productF = product.toObject();
    productF.id = product._id;
    delete productF._id;
    delete productF.__v;
    delete productF.createdAt;
    delete productF.updatedAt;


    return res
        .status(200)
        .json({ success: true, product: productF });

};
export const getAllProducts = async (req, res) => {

    //fetching pageNumber and pageSize from query example:- https://a.com/hello?pn=2&ps=10
    const pageNumber = req.query.pn
        ? Math.max(parseInt(req.query.pn, 10), 1) || 1
        : 1;
    const pageSize = req.query.ps
        ? Math.max(parseInt(req.query.ps, 10), 1) || 10
        : 10; //default 10

    const {
        sortBy = null,
        isFeatured,
        isUpcoming
    } = req.query;

    //getting filters from query
    const filter = {}
    filter.isDeleted = false;
    if(isFeatured !== undefined && isFeatured !== null ) filter.isFeatured = isFeatured;
    if(isUpcoming !== undefined && isUpcoming !== null ) filter.isUpcoming = isUpcoming;


    //todo implement sorting 
    //fetching the products pageByPage
    const [allProducts, productCount] = await Promise.all([
        ProductVariant.find(filter)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .select("name pricing availableStock imageUrls")
            .lean(),

        ProductVariant.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(productCount / pageSize);
    return res.status(200).json({
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
        products: allProducts.map(({ _id, __v, ...product }) => ({
            ...product,
            id: _id,
        })),
    });

};
export const getProductsByCategory = async (req, res) => {

    const pageNumber = req.query.pn
        ? Math.max(parseInt(req.query.pn, 10), 1) || 1
        : 1;
    const pageSize = req.query.ps
        ? Math.max(parseInt(req.query.ps, 10), 1) || 10
        : 10;
    const category = req.query.category;
    
    //no category exist check
    const catid = await Category.findOne({ _id: category }).select("_id").lean();
    if (!catid || !catid?._id) {
        return res.status(200).json({
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
            products: []
        });
    }
    // dynamic MongoDB filter object
    const filter = {};
    filter.category = catid._id;

    //getting products
    const [allProducts, totalProducts] = await Promise.all([
        ProductVariant.find(filter)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .select("name pricing availableStock imageUrls")
            .lean(),

        // Count matches the exact same filter
        ProductVariant.countDocuments(filter),
    ]);


    const totalPages = Math.ceil(totalProducts / pageSize);

    return res.status(200).json({
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
        products: allProducts.map(({ _id, __v, ...product }) => ({
            ...product,
            id: _id,
        })),
    });

};
export const getProductsByKeyword = async (req, res) => {
    // Helper function to escape special regex characters
    function escapeRegex(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }

    const pageNumber = req.query.pn
        ? Math.max(parseInt(req.query.pn, 10), 1) || 1
        : 1;
    const pageSize = req.query.ps
        ? Math.max(parseInt(req.query.ps, 10), 1) || 10
        : 10;
    const keyword = req.query.searchKey;

    //validating keyword
    if (!keyword || keyword.length < 3) {
        return res.status(400).json({
            success: false,
            error: "invalid keyword"
        });
    }
    //sanitize the query
    const safeKeyword = escapeRegex(keyword.trim());

    //creating filter
    const filter = {
        isDeleted: false,
        $or: [
            { name: { $regex: safeKeyword, $options: "i" } },
            { keywords: { $regex: safeKeyword, $options: "i" } },
        ],
    };
    //search products in db and find total documents
    const [allProducts, totalProducts] = await Promise.all([
        ProductVariant.find(filter)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .select("name imageUrls pricing availableStock")
            .lean(),

        // Count matches the exact same filter
        ProductVariant.countDocuments(filter),
    ]);


    const totalPages = Math.ceil(totalProducts / pageSize);

    return res.status(200).json({
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
        products: allProducts.map(({ _id, __v, ...product }) => ({
            ...product,
            id: _id,
        })),
    });

};
export const getProductById = async (req, res) => {

    const { id } = req.params;

    if (!validateMongoId(id)) {
        return res.status(400).json({
            success: false,
            error: "Invalid product"
        })
    }
    //extract procut
    const product = await ProductVariant.findById(id).lean();

    if (!product) {
        return res.status(404).json({ error: "product not found" });
    }
    product.id = product._id;
    delete product._id;
    delete product.__v;
    delete product.createdAt;
    delete product.updatedAt;
    return res.status(200).json({
        success: true,
        product
    });

};
export const deleteProductImage = async (req, res) => {

    if (!req?.body) {
        return res.status(400).json({ error: "invalid request body" });
    }
    const { productId } = req.params;
    const { imageUrl } = req.body;

    if (!productId || !imageUrl) {
        return res.status(400).json({ success: false, error: "invalid productId or image source" });
    }
    //fetching product
    const product = await ProductVariant.findById(productId).select("imageUrls");
    if (!product) {
        return res.status(400).json({ success: false, error: "invalid product id" });
    }

    //check image belong the product
    const targetUrl = imageUrl.trim();
    if (!product.imageUrls?.includes(targetUrl)) {
        return res.status(400).json({ success: false, error: "image does not belong to product" });
    }
    
    // delete image from storage for free up
    try {
        const suc = await deleteImage(imageUrl.trim());
        if (!suc) {
            return res.status(400).json({ success: false, error: "invalid image URL" });
        }
    } catch (e) {
        return res.status(400).json({ success: false, error: "invalid image URL" });
    }

    //updating product
    product.imageUrls = product.imageUrls.filter(img => img !== targetUrl);
    await product.save();
    return res.status(200).json({ success: true, message: "image deleted success" });

}
export const addProductImages = async (req, res) => {

    const { productId } = req.params;

    if (!productId) {
        return res.status(400).json({ success: false, error: "invalid product id" });
    }

    const product = await ProductVariant.findById(productId).select("imageUrls");
    if (!product) {
        return res.status(404).json({ success: false, error: "product not found" });
    }

    const existingImages = product.imageUrls ?? [];
    if (existingImages.length >= 5) {
        return res.status(400).json({
            success: false,
            error: "product cannot have more than 5 images"
        });
    }

    const newImageUrls = Array.from(await processImages(req));
    if (existingImages.length + newImageUrls.length > 5) {
        return res.status(400).json({
            success: false,
            error: `product can have a maximum of 5 images; only ${5 - existingImages.length} image(s) can be added`
        });
    }

    product.imageUrls = [...existingImages, ...newImageUrls];
    await product.save();

    return res.status(200).json({
        success: true,
        message: "image added successfully",
        imageUrls: product.imageUrls
    });

};
