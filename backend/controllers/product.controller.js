import {redis} from '../lib/redis.js';
import Product from '../models/product.model.js';
import cloudinary from '../lib/cloudinary.js';

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json({products});
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log("intenal server error",error.message);
    }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        let featuredProducts = await redis.get("featured_products");
        if(featuredProducts){
            return res.json(JSON.parse(featuredProducts));
        }
        //.lean returns a plain javascript object instead of a mongoose documenta and improves performance
        featuredProducts = await Product.find({isFeatured:true}).lean();

        if(!featuredProducts){
            return res.status(404).json({message:"Featured products not found"});
        }   

        await redis.set("featured_products",JSON.stringify(featuredProducts));
        res.json({featuredProducts}); 
    } catch (error) {
        console.log("error in getFeatureducts",error.message);
        res.status(500).json({ message: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;

        let cloudinaryResponse= null
        if(image){
          cloudinaryResponse=  await cloudinary.uploader.upload(image,{folder:"products"})
      }
      const product = await Product.create({
          name,
          description,
          price,
          image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
          category,
      });

      res.status(201).json({product});
    } catch (error) {
        console.log("error in createProduct",error.message);
        res.status(500).json({ message: error.message });
        
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product){
            return res.status(404).json({message:"Product not found"});
        }
        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0];
            try{
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("image deleted from cloudinary");
            }catch(error){
                console.log("error in deleting image from cloudinary",error.message);
            }
        }
        await Product.findByIdAndDelete(req.params.id);
        res.json({message:"Product deleted successfully"});

    } catch (error) {
        console.log("error in deleteProduct",error.message);
        res.status(500).json({ message: error.message });
    }
}

export const getRecommendedProducts = async (req, res) => {
    try {
        const product = await Product.aggregate([
            { $sample: { size: 3 } },
            {$project: {_id:1,name:1,price:1,description:1,image:1}}
        ]);
        res.json({product});
    } catch (error) {
        console.log("error in getRecommendedProducts",error.message);
        res.status(500).json({ message: error.message });
        
    }
}

export const getProductsByCategory = async (req, res) => {
    const {category} = req.params;
    try {
        const products = await Product.find({category});
        res.json({products});
    } catch (error) {
        console.log("error in getProductsByCategory",error.message);
        res.status(500).json({ message: error.message });
        
    }
}

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if(product){
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updateFeaturedProductsCache();
            res.json({updatedProduct});
        }
        else{
            res.status(404).json({message:"Product not found"});
        }
    } catch (error) {
        console.log("error in toggleFeaturedProduct",error.message);    
        res.status(500).json({ message: error.message });
    }
}

async function updateFeaturedProductsCache(){   
    try {
     const featuredProducts = await Product.find({isFeatured:true}).lean();  
     await redis.set("featured_products",JSON.stringify(featuredProducts)); 
    } catch (error) {
        console.log("error in updateFeaturedProductsCache",error.message);
    }
}