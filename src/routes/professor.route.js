const express=require('express')
const router=express.Router()
const {User}=require('../models/schemas/user.model')
const { Assignment } = require('../models/schemas/assignment.model.js')
const { authProfessor } = require('../middlewares/professor/authProfessor.middleware.js')

router.route('/dashboard').get(authProfessor,async(req,res)=>{
    const user=await User.findOne({email:req.user.email})
    const assignments=await Assignment.find({faculty:user._id}).populate('student')
    res.render('professor/dashboard',{assignments})
})


module.exports=router

