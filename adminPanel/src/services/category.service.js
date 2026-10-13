import api from "../configs/axios.config.js"
import useCategoryStore from "../store/category.store.js"

export const fetchCategories = async (pageNo, pageSize, isFeatured) => {
    try {
        const { categories } = useCategoryStore.getState();
        if (!isFeatured && categories && categories[pageNo]) {
            return { ...categories[pageNo] };
        }
        //call api only if categories are not stored
        const response = await api.get("categories", {
            params: { pn: pageNo, ps: pageSize || 10, isFeatured },
        });
        const payload = response?.data ?? {};

        //don't stored featured categories can make data inconsistent
        if (!isFeatured) {
            useCategoryStore.getState().setCategories({
                categories: payload?.categories ?? [],
                currentPage: payload?.currentPage ?? 1,
                hasNextPage: payload?.hasNextPage ?? false,
                hasPrevPage: payload?.hasPrevPage ?? pageNo > 1
            })
        }
        return {
            categories: payload?.categories ?? [],
            hasNextPage: payload?.hasNextPage ?? false,
            hasPrevPage: payload?.hasPrevPage ?? pageNo > 1,
            currentPage:payload?.currentPage ?? pageNo
        };
    } catch (e) {
        const error = new Error("error fetching categories");
        error.cause = e;
        throw error;
    }
}

export const createCategory = async (catName, isFeatured = false, image) => {

    if (!catName) {
        throw new Error("Category Name is required");
    }
    const formData = new FormData();
    formData.append("name", catName);
    formData.append("isFeatured", isFeatured);
    formData.append("icon", image);

    try{
        const newCat = await api.post("/categories", formData);
        return newCat.data;
    }catch(e){
        const error = new Error("error creating category");
        error.cause = e;
        throw error;
    }

}

export const updateCategory = async (categoryId, catName, isFeatured, ) => {
    if (!categoryId) {
        throw new Error("Category ID is required");
    }

    //formatting data
    const categoryData = {};
    if(isFeatured !== undefined && isFeatured !== null && typeof isFeatured === "boolean"){
        categoryData.isFeatured = isFeatured;
    }
    if(catName && String(catName).length){
        categoryData.name = catName;
    }
    //making api request
    try {
        const response = await api.put(`/categories/${categoryId}`, categoryData);
        return response.data;
    } catch (e) {
        const error = new Error("error updating category");
        error.cause = e;
        throw error;
    }
}

export const deleteCategory = async (categoryId) => {
    if (!categoryId) {
        throw new Error("Category ID is required");
    }
    try {
        const response = await api.delete(`/categories/${categoryId}`);
        
        useCategoryStore.getState().resetCategories();
        return response.data;
    } catch (e) {
        // Wrap the delete failure in a category-specific error so the UI can show a clear message.
        const error = new Error("error deleting category");
        error.cause = e;
        throw error;
    }
}  
export const fetchCategoryById = async (catId) => {
    try {
        const response = await api.get(`categories/${catId}`);
        const payload = response?.data ?? {};

        if(!payload){
            throw new Error("category not found");
        }
        return payload
    } catch (e) {
        const error = new Error("error fetching category");
        error.cause = e;
        throw error;
    }
}