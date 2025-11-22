const jwt=require("jsonwebtoken")

const authAdmin=(req,res,next)=>{
    const token=req.cookies.token;
    if(!token){
        return res.status(400).redirect('/')
    }
    try {
        const decoded=jwt.verify(token,'vk')
        if(decoded.role!=='admin'){
            return res.status(400).redirect('/')
        }
        req.user={username:decoded.username,role:decoded.role}
        next()
    } catch (error) {
        console.log("Invalid token:", error.message);
        return res.status(401).clearCookie("token").redirect('/');
    }
}

module.exports={authAdmin}