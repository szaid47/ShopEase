import express from "express";
import { addtoCart, getCartProducts, removeAllFromCart, updateQuantity } from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",protectRoute,getCartProducts);
router.post("/",protectRoute,addtoCart);
router.delete("/",protectRoute,removeAllFromCart);
router.put("/:id",protectRoute,updateQuantity);



export default router;