import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if(!accessToken){
            return res.status(401).json({message: "You are not authenticated!-no token provided"});
        }
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const user =await User.findById(decoded.userId).select("-password");

        if(!user){
            res.status(404).json({message: "User not found"});
        }
        req.user = user;

        next()
        } catch (error) {
            if(error.name==="TokenExpiredError"){
                return res.status(401).json({message: "You are not authenticated!-token expired"});
            }
            throw error;    
            
        }
    } catch (error) {
        console.log("error in protectRoute",error.message);
        res.status(401).json({message: "You are not authenticated!-token failed"});
    }
}

export const adminRoute = (req, res, next) => {
    if(req.user && req.user.role==="admin"){
        next();
    }
    else{
        res.status(403).json({message: "Not authorized as an admin"});
    }
}