import Coupon from "../models/coupon.model.js";
import {stripe} from "../lib/stripe.js"; 
import dotenv from "dotenv";
import Order from "../models/order.model.js";
dotenv.config();



export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Products array is required" });
    }

    let totalAmount = 0;
    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // Stripe works in cents
      totalAmount += amount * (product.quantity || 1);

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    // Handle Coupon Logic
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
      if (coupon) {
        totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [
            {
              coupon: await createStripeCoupon(coupon.discountPercentage),
            },
          ]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    // Check for New Coupon Creation
    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }

    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error("Error in create checkout session:", error);
    res.status(500).json({ message: "Some error occurred" });
  }
};

// Function to Create a Stripe Coupon
async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id;
}

async function createNewCoupon(userId){
    await Coupon.findOneandDelete({userId});
    const newCoupon = new Coupon({
        code :"GIFT" + Math.random().toString(36).substring(2,8).toUpperCase(),
        discountPercentage : 10,
        expirationDate : new Date(Date.now() + 30*24*60*60*1000),//30 days from now
        userId : userId
    })

    await newCoupon.save();

    return newCoupon;
}

export const checkoutSuccess = async(req,res)=>{
    try {
        const {sessionId} = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if(session.payment_status === "paid"){
            if(session.metadata.couponCode){
                await Coupon.findOneAndUpdate({
                    code:session.metadata.couponCode,userId :session.metadata.userId},{
                        isActive:false
                })
            }

            const products = JSON.parse(session.metadata.products);
            const newOrder = new Order({
                user: session.metadata.userId,
                products : products.map(product =>({
                    product:product.id,
                    quantity:product.quantity,
                    price:product.price
                })),
                totalAmount : session.amount_total/100,
                paymentIntent:session.payment_intent,
                StripeSessionId:sessionId
            })

            await newOrder.save();
            res.statq(200).json({message:"Order placed successfully",order:newOrder._id});
        }
    } catch (error) {
        console.error("error in checkout success",error);
        res.status(500).json({message:"error processing checkout success occured",error:error.message});
    }};
