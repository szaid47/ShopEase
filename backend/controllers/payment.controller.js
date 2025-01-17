export const createCheckoutSession = async (req, res) => {
    try {
        const {products,couponCode} = req.body;

        if(!Array.isArray(products) || products.length === 0){
            return res.status(400).json({message:"Products array is required"});
        }
        let totalAmount = 0;

        const lineItems = products.map(product =>{
            const amount = Math.round(product.price *100) // stripe works in cents
            totalAmount += amount*product.quantity;

            return{
                price_data:{
                    currency:"usd",
                    product_data:{
                        name:product.title,
                        images:[product.image],
                    },
                    unit_amount:amount
                },
            }
        });
        let coupon = null;
        if(couponCode){
            coupon = await Coupon.findOne({code:couponCode,userId:req.user._id,isActive:true});
            if(coupon){
                totalAmount -= Math.round(totalAmount* coupon.discountPercentage/100);  
            }
        }

    } catch (error) {
        
    }
}