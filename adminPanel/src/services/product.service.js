import useProductStore from "../store/product.store";
import api from "../configs/axios.config";
import { fetchStoreConfig } from "./storeConfig.service";
import { arraysMatch } from "../utils/extra.utils";
export const fetchProducts = async (pageNo, isFeatured, isUpcoming) => {
    try {
        const { products } = useProductStore.getState();

        //return cached products in store
        if (!isFeatured && !isUpcoming && products && products[pageNo]) {
            return { ...products[pageNo], currentPage: pageNo };
        }

        //fetching from api if products not cached
        const response = await api.get("products", {
            params: { ps: 10, pn: pageNo, isFeatured, isUpcoming },
        });
        const payload = response?.data ?? {};

        //storing in store if products are not featured or not upcoming
        if (!isFeatured && !isUpcoming) {
            useProductStore.getState().setProducts({
                currentPage: payload?.currentPage ?? pageNo,
                hasNextPage: payload?.hasNextPage ?? false,
                hasPrevPage: payload?.hasPrevPage ?? pageNo > 1,
                products: payload?.products ?? [],
            });
        }
        //return standard response
        return {
            currentPage: payload?.currentPage ?? pageNo,
            hasNextPage: payload?.hasNextPage ?? false,
            hasPrevPage: payload?.hasPrevPage ?? pageNo > 1,
            items: payload?.products ?? [],
        }

    } catch (e) {
        const er = new Error("error fetching products");
        er.code = 404;
        er.cause = e;
        throw er;
    }
};

//todo later backend need to be updated to support low stock products fetching
export const fetchLowStockProducts = async (pageNo, isFeatured, isUpcoming) => {
    return fetchProducts(pageNo, isFeatured, isUpcoming);
};

export const fetchProductById = async (productId) => {
    try {
        const response = await api.get(`products/${productId}`);
        const payload = response?.data ?? {};
        return payload?.product ?? {};
    } catch (e) {
        const er = new Error("error fetching products");
        er.code = 404;
        er.cause = e;
        throw er;
    }
}
export const fetchProductsByKeyword = async (page, key) => {
    try {
        //if key not passed or key is short
        if (!key || key.trim().length < 3) {
            return;
        }

        // Always fetch for keyword searches to avoid stale/partial results
        const response = await api.get("products/keyword", {
            params: { searchKey: key, pn: page, ps: 10 },
        });
        const payload = response?.data ?? {};

        //dont store the products searched by keyword

        return {
            currentPage: payload?.currentPage ?? page,
            hasNextPage: payload?.hasNextPage ?? false,
            hasPrevPage: payload?.hasPrevPage ?? page > 1,
            products: payload?.products ?? [],
        }

    } catch (e) {
        const er = new Error("error fetching products");
        er.code = 404;
        er.cause = e;
        throw er;
    }
}
export const fetchProductsByCategory = async (page, category) => {
    try {
        if (!category) {
            throw new Error("Category is required");
        }

        const response = await api.get("products/category", {
            params: { category, pn: page, ps: 10 },
        });
        const payload = response?.data ?? {};

        //dont store the products searched by keyword

        return {
            currentPage: payload?.currentPage ?? page,
            hasNextPage: payload?.hasNextPage ?? false,
            hasPrevPage: payload?.hasPrevPage ?? page > 1,
            items: payload?.products ?? [],
        }

    } catch (e) {
        const er = new Error("error fetching products");
        er.code = 404;
        er.cause = e;
        throw er;
    }
}
export const createProduct = async (name, category, keywords = [], description = "", sections = [], pricing = [], purchaseOptions = [], isFeatured = false, availableStock = 0, images, isUpcoming = false) => {
    if (!name || !pricing.length) {
        throw new Error("Product name and pricing is required");
    }

    //validate pricing based on available currencies
    const storeConfig = await fetchStoreConfig();
    const supportedCurrencies = storeConfig.supportedCurrencies;
    if (!supportedCurrencies || !supportedCurrencies.length) {
        throw new Error("no currency defined define is setting then add product");
    }
    //verifying pricing is entered for all currencies
    const inputCurrencies = pricing?.map(pp => {
        return pp.currency
    });
    if (!arraysMatch(inputCurrencies, supportedCurrencies)) throw new Error("all currencies prices are required");

    //verify purchase options
    if (purchaseOptions && purchaseOptions.length) {
        purchaseOptions.forEach(option => {
            option.optionValues.forEach(ov => {
                if (ov.pricingChange.length !== supportedCurrencies.length) {
                    throw new Error("inconsistent options pricing change");
                }
            })
        });
    }
    //create request object 
    const reqData = {
        name,
        category,
        keywords,
        description,
        sections,
        pricing,
        purchaseOptions,
        isFeatured,
        isUpcoming,
        availableStock
    }
    const formData = new FormData();
    formData.append("data", JSON.stringify(reqData));

    images?.forEach(img => {
        formData.append("images", img)
    });

    const response = await api.post("/products", formData);
    return response.data;
}

export const updateProduct = async (productId, name, category = "", keywords = [], description = "", sections = [], pricing = [], purchaseOptions = [], isFeatured, availableStock, reservedStock) => {

    //validate pricing based on available currencies
    const storeConfig = await fetchStoreConfig();
    const supportedCurrencies = storeConfig.supportedCurrencies;
    if (!supportedCurrencies || !supportedCurrencies.length) {
        throw new Error("no currency defined define is setting then add product");
    }
    //verifying pricing is entered for all currencies
    if (pricing && pricing.length) {
        const inputCurrencies = pricing?.map(pp => {
            return pp.currency
        });
        if (!arraysMatch(inputCurrencies, supportedCurrencies)) throw new Error("all currencies prices are required");

        //verify purchase options
        if (purchaseOptions && purchaseOptions.length) {
            purchaseOptions.forEach(option => {
                option.optionValues.forEach(ov => {
                    if (ov.pricingChange.length !== supportedCurrencies.length) {
                        throw new Error("inconsistent options pricing change");
                    }
                })
            });
        }
    }
    //create request object
    const reqData = {};
    if (name) reqData.name = name;
    if (category) reqData.category = category;
    if (keywords?.length) reqData.keywords = keywords;
    if (description) reqData.description = description;
    if (sections?.length) reqData.sections = sections;
    if (pricing?.length) reqData.pricing = pricing;
    if (purchaseOptions?.length) reqData.purchaseOptions = purchaseOptions;
    if (typeof isFeatured === "boolean") reqData.isFeatured = isFeatured;
    if (typeof availableStock === "number") reqData.availableStock = availableStock;
    if (typeof reservedStock === "number") reqData.reservedStock = reservedStock;

    const response = await api.put(`/products/${productId}`, reqData);
    return response.data;
}

export const deleteProduct = async (productId) => {
    if (!productId) {
        throw new Error("Product ID is required");
    }

    try {
        const response = await api.delete(`/products/${productId}`);
        if (response?.data?.success === false) {
            throw new Error("unable to delete product try again later");
        }
        clearProductStore();
        return response?.data;
    } catch (e) {
        const err = new Error("Unable to delete product. Try again later");
        err.cause = e;
        throw err;
    }
}

export const deleteImage = async (productId, imageUrl) => {
    try {
        const response = await api.delete(`/products/images/${productId}`, {
            data: { imageUrl },
        });
        return response.data;
    } catch (e) {
        const err = new Error("Unable to delete image at a moment. Try again later");
        err.cause = e;
        throw err;
    }
}

export const addImages = async (productId, images) => {
    let product = null;
    try{
        //getting product by id
        product = (await fetchProductById(productId)).data.product;
    }catch(e){
        const err = new Error("product dont exist or is deleted");
        err.cause = e;
        throw err;
    }
    if(product.imageUrls.length + images.length >= 5){
        throw new Error("maximum 5 images are allowed");
    }

    try{
        const formData = new FormData();
        images.forEach(element => {
            formData.append("images", element);
        });
        const response =await api.post(`/products/images${productId}`, formData);
        return response.data.imageUrls
    }catch(e){
        const err = new Error("unable to add image to product");
        err.cause = e;
        throw err;
    }
}

export const clearProductStore = () => {
    useProductStore.getState().resetProducts();
};