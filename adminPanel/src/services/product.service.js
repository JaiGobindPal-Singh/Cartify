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
    if (!name || !category || !pricing.length) {
        throw new Error("Product name, category, and pricing are required");
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

export const updateProduct = async (productId, productData) => {
    if (!productId) {
        throw new Error("Product ID is required");
    }
    if (!productData || typeof productData !== "object") {
        throw new Error("Product data is required");
    }
    //validate pricing based on available currencies
    const storeConfig = await fetchStoreConfig();
    const supportedCurrencies = storeConfig.supportedCurrencies;
    if (!supportedCurrencies || !supportedCurrencies.length) {
        throw new Error("no currency defined define is setting then add product");
    }
    //verifying pricing is entered for all currencies
    if (productData.pricing) {
        const inputCurrencies = productData.pricing.map((price) => price.currency);
        if (!arraysMatch(inputCurrencies, supportedCurrencies)) throw new Error("all currencies prices are required");

        //verify purchase options
        if (productData.purchaseOptions?.length) {
            productData.purchaseOptions.forEach(option => {
                option.optionValues.forEach(ov => {
                    if (ov.pricingChange.length !== supportedCurrencies.length) {
                        throw new Error("inconsistent options pricing change");
                    }
                })
            });
        }
    }
    try{
        console.log(productData)
        const response = await api.put(`/products/${productId}`, productData);
        clearProductStore();
        return response.data;
    }catch(e){
        console.log("000",e?.response.data);
    }
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
        clearProductStore();
        return response.data;
    } catch (e) {
        const err = new Error("Unable to delete image at a moment. Try again later");
        err.cause = e;
        throw err;
    }
}

export const addImages = async (productId, images) => {
    if (!productId || !Array.isArray(images) || images.length === 0) {
        throw new Error("Product ID and at least one image are required");
    }
    const product = await fetchProductById(productId);
    const currentImageCount = Array.isArray(product?.imageUrls)
        ? product.imageUrls.length
        : 0;
    if (currentImageCount + images.length > 5) {
        throw new Error("Maximum 5 images are allowed");
    }

    try {
        const formData = new FormData();
        images.forEach((image) => formData.append("images", image));
        const response = await api.post(`/products/images/${productId}`, formData);
        clearProductStore();
        return response.data.imageUrls;
    } catch (e) {
        const err = new Error("Unable to add images to product");
        err.cause = e;
        throw err;
    }
}

export const clearProductStore = () => {
    useProductStore.getState().resetProducts();
};