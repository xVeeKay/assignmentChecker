const jwt=require('jsonwebtoken')

const authProfessor=(req,res,next)=>{
    const token=req.cookies.token;
        if(!token){
            return res.status(400).redirect('/')
        }
        try {
            const decoded=jwt.verify(token,process.env.JWT_SECRET)
            if(decoded.role!=='professor'){
                return res.status(400).redirect('/')
            }
            req.user={email:decoded.email,role:decoded.role}
            next()
        } catch (error) {
            console.log("Invalid token:", error.message);
            return res.status(401).clearCookie("token").redirect('/');
        }          
}
module.exports={authProfessor}