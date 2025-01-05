import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter product name!"],
        
    },
    description: {
        type: String,
        required: [true],
        
    },
    price: {
        type: Number,
        required: [true],
        min:0,
    },
    image: {
        type: String,
        required: [true, "Please upload product image!"],
    },
    category: {
        type: String,
        required: [true, "Please enter product category!"],
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },



},{timestamps: true});

const Product = mongoose.model("Product", productSchema);

export default Product;