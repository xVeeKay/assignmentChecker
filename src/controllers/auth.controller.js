const crypto=require('crypto')
const {User}=require('../models/schemas/user.model.js')
const bcrypt=require('bcrypt')
const sendEmail=require('../utils/auth/sendEmail.js')

const forgotPassword=async(req,res)=>{
    try {
        const {email}=req.body
        const user=await User.findOne({email})
        if(!user){
            return res.render('auth/forgotPassword',{error:"User not found!🤔"})
        }
        const resetToken=crypto.randomBytes(32).toString('hex')
        user.resetPasswordToken=resetToken
        user.resetPasswordExpires=Date.now()+10*60*1000
        await user.save()
        const resetUrl=`http://localhost:3000/auth/reset-password/${resetToken}`
        await sendEmail({
            to:email,
            subject:'Reset your password',
            html: `<p>Click the link to reset your password:</p>
                   <a href="${resetUrl}" target="_blank">${resetUrl}</a>`
        })
        res.render('auth/forgotPassword',{success:"Password reset link sent to your email."})
    } catch (error) {
        console.log("Error while forgeting password: ",error)
        res.render('auth/forgotPassword',{error:"Error while forgetting password!🥲"})
    }
}

const resetPassword=async(req,res)=>{
    try {
        const {newPassword,confirmPassword,token}=req.body
        if(newPassword!==confirmPassword){
            return res.render('auth/resetPassword',{error:"Newpassword doesnot match with confirm password!"})
        }
        const user=await User.findOne({
            resetPasswordToken:token,
            resetPasswordExpires:{$gt:Date.now()}
        })
        if(!user){
            return res.render('auth/resetPassword',{error:"Token invalid or expired"})
        }
        user.password=await bcrypt.hash(newPassword,10)
        user.resetPasswordToken=undefined
        user.resetPasswordExpires=undefined
        await user.save()
        res.render('auth/resetPassword',{success:"Password changed successfully. You can now login.🥳"})
    } catch (error) {
        console.log("Error while resetting password ",error)
        return res.render('auth/resetPassword',{error:"Error while resetting your password!"})
    }
}


module.exports={
    forgotPassword,
    resetPassword
}