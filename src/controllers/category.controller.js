import {
    processSingleImage
} from "../utils/imageHandler.utils.js";
import Category from "../models/category.model.js";

export const createCategory = async (req, res) => {

    const {
        name,
        parent,
        isFeatured = false
    } = req.body;
    if (!name) {
        return res
            .status(400)
            .json({ error: "Category name is required" });
    }
    const iconUrl = await processSingleImage(req);
    const category = new Category({
        name,
        iconUrl,
        parent: parent ? parent : null,
        isFeatured: isFeatured.trim().toLowerCase() === "true"
    });
    await category.save();
    return res.status(201).json({
        category: {
            id: category._id,
            name: category.name,
            iconUrl: category.iconUrl,
            isFeatured: category.isFeatured
        },
    });

};

export const deleteCategory = async (req, res) => {

    const { categoryId } = req.params;
    const deletedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { $set: { isDeleted: true } }
    ).lean();
    if (!deletedCategory) {
        return res.status(404).json({ error: "Category not found" });
    }
    //dont delete the category image from storage
    // await deleteImage(deletedCategory.iconUrl);

    return res.status(200).json({ success: true });

};

export const updateCategory = async (req, res) => {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);

    if (!category || category.isDeleted) {
        return res.status(404).json({ error: "Category not found" });
    }

    const { name, isFeatured } = req.body;
    const updates = {};

    if (name !== undefined) {
        if (!name.trim()) {
            updates.name = category.name;
        }
        updates.name = name;
    }

    if (isFeatured !== undefined) {
        updates.isFeatured = typeof isFeatured === "string"
            ? isFeatured.trim().toLowerCase() === "true"
            : Boolean(isFeatured);
    }

    Object.assign(category, updates);
    await category.save();

    return res.status(200).json({
        category: {
            id: category._id,
            name: category.name,
            isFeatured: category.isFeatured
        }
    });

};

export const getAllCategories = async (req, res) => {

    const {
        isFeatured 
    } = (req?.query || {});

    //fetching pageNumber and pageSize from query example:- https://a.com/hello?pn=2&ps=10
    const pageNumber = req.query.pn
        ? Math.max(parseInt(req.query.pn, 10), 1) || 1
        : 1;
    const pageSize = req.query.ps
        ? Math.max(parseInt(req.query.ps, 10), 1) || 10
        : 10; //default 10

    const filter = {};
    if(isFeatured !== undefined && isFeatured !== null) filter.isFeatured = isFeatured;
    filter.isDeleted = false;

    const [categories, categoryCount] = await Promise.all([
        Category.find(filter)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean(),
        Category.countDocuments({}),
    ]);
    const totalPages = Math.ceil(categoryCount / pageSize);
    const categoriesF = categories.map((cat) => {
        return {
            id: cat._id,
            name: cat.name,
            iconUrl: cat.iconUrl,
        };
    });
    return res.status(200).json({
        categories: categoriesF,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
    });
};

export const getChildCategories = async (req, res) => {
    const { categoryId } = req.params;
    if (!categoryId) {
        return res.status(400).json({ error: "Parent category id is required" });
    }

    const categories = await Category.find({
        parent: categoryId.trim(),
        isDeleted: false,
    })
        .select("name iconUrl")
        .lean();

    return res.status(200).json({ categories });

}
