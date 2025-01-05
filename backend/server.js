import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import { connectDb } from "./lib/db.js";

dotenv.config();
const app = express()
const PORT=process.env.PORT || 5000;

app.use(express.json());//allow u to parse the body of the request
app.use(cookieParser()); 
app.use("/api/auth",authRoutes);
app.use("/api/products",productRoutes);
app.use("/api/cart",cartRoutes);



app.listen(PORT, () => {
  console.log("Server is running on port http://localhost:"+PORT);
  connectDb();
});

