import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: [true, 'Review must belong to a product.']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user.']
    },
    rating: {
        type: Number,
        required: [true, 'Please provide a rating between 1 and 5.'],
        min: [1, 'Rating must be at least 1.0'],
        max: [5, 'Rating cannot be more than 5.0']
    },
    comment: {
        type: String,
        required: [true, 'Please add some review text.'],
        trim: true,
        maxlength: [1000, 'Review text cannot exceed 1000 characters.']
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Prevent a user from leaving multiple reviews for the same product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', ReviewSchema);
export default Review;
