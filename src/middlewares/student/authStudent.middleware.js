const jwt=require('jsonwebtoken');
const { User } = require('../../models/schemas/user.model');

const authStudent=async(req,res,next)=>{
    const token=req.cookies.token;
        if(!token){
            return res.status(400).redirect('/')
        }
        try {
            const decoded=jwt.verify(token,process.env.JWT_SECRET)
            const user=await User.findOne({email:decoded.email})
            if(user.lastLogoutAll&&decoded.iat*1000<user.lastLogoutAll.getTime()){
                return res.redirect('/')
            }
            if(decoded.role!=='student'){
                return res.status(400).redirect('/')
            }
            req.user={email:decoded.email,role:decoded.role}
            next()
        } catch (error) {
            console.log("Invalid token:", error.message);
            return res.status(401).clearCookie("token").redirect('/');
        }          
}
module.exports={authStudent}