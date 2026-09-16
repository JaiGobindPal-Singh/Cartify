import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    categories: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Category",
      trim: true,
      default: [],
    },
    keywords: {
      type: [String],
      trim: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);


const Product = mongoose.model('Product', productSchema);
export default Product;