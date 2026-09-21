import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
{
    name:{
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    iconUrl:{
        type: String,
    },
    isDeleted:{
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}
);

const Category = mongoose.model('Category', categorySchema);
export default Category;