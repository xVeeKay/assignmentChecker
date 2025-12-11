const express=require('express')
const router=express.Router()
const {User}=require('../models/schemas/user.model')
const { Assignment } = require('../models/schemas/assignment.model.js')
const { authHod } = require('../middlewares/hod/authHod.middleware.js')
const {dashboard,approveAssignment}=require('../controllers/hod.controller.js')

router.route('/dashboard').get(authHod,dashboard)
router.route('/assignments').get(authHod,async(req,res)=>{
    const user=await User.findOne({email:req.user.email})
        if(!user){
            res.json({error:"User not found!"})
        }
    const assignments=await Assignment.find({faculty:user._id,status:{$in:['submitted','forwarded']}}).populate('student')
    res.render('hod/viewAllAssignments',{assignments})
})
router.route('/reviews').get(authHod,async(req,res)=>{
    const user=await User.findOne({email:req.user.email})
    const assignments = await Assignment.find({
        faculty: user._id,
        status: { $in: ["rejected", "approved"] }
    }).populate('student');
    res.render('hod/reviews',{assignments})
})
router.route('/review/:id').get(authHod,async(req,res)=>{
    const assignment=await Assignment.findById(req.params.id).populate('student')
    const currentFaculty=await User.findOne({email:req.user.email})
    const faculties = await User.find({
        email:{$ne:currentFaculty.email},
        department: currentFaculty.department,
        role: { $in: ['professor', 'hod'] }
    }).populate('department');
    res.render('hod/reviewAssignment',{assignment,faculties})
})
router.route('/approve/:id').post(authHod,approveAssignment)





module.exports=router

