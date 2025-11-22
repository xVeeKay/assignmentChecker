const express=require('express')
const router=express.Router()
const {forgotPassword,resetPassword}=require('../controllers/auth.controller.js')
const { User } = require('../models/schemas/user.model.js')


router.route('/forgot-password').get((req,res)=>{
    res.render('auth/forgotPassword')
}).post(forgotPassword)

router.route('/reset-password/:token').get(async(req,res)=>{
    const user=await User.findOne({
        resetPasswordToken:req.params.token,
        resetPasswordExpires:{$gt:Date.now()}
    })
    if(!user){
        return res.render('auth/resetPassword',{error:"Token invalid or expired"})
    }
    res.render('auth/resetPassword',{tokenExpired:false,token:req.params.token})
})
router.route('/reset-password').post(resetPassword)


module.exports=router