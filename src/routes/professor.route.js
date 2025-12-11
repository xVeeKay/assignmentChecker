const express=require('express')
const router=express.Router()
const {User}=require('../models/schemas/user.model')
const { Assignment } = require('../models/schemas/assignment.model.js')
const { authProfessor } = require('../middlewares/professor/authProfessor.middleware.js')
const {dashboard,approveAssignment,rejectAssignment,forwardAssignment,logout,changePassword}=require('../controllers/professor.controller.js')

router.route('/dashboard').get(authProfessor,dashboard)
router.route('/profile').get(authProfessor,async(req,res)=>{
    const user=await User.findOne({email:req.user.email}).populate('department')
    const reviewedCount=await Assignment.countDocuments({faculty:user._id,status:{$in:['rejected','approved']}})
    res.render('professor/profile',{user,reviewedCount})
})
router.route('/logout-all').get(authProfessor,async(req,res)=>{
  const user=await User.findOne({email:req.user.email})
  user.lastLogoutAll=Date.now()
  await user.save()
  res.clearCookie('token')
  return res.redirect('/')
})
router.route('/logout').post(authProfessor,logout)
router.route('/change-password').post(authProfessor,changePassword)
router.route('/assignments').get(authProfessor,async(req,res)=>{
    const user=await User.findOne({email:req.user.email})
    const assignments=await Assignment.find({faculty:user._id,status:{$in:['submitted','forwarded']}}).populate('student')
    res.render('professor/viewAllAssignments',{assignments})
})
router.route('/review/:id').get(authProfessor,async(req,res)=>{
    const assignment=await Assignment.findById(req.params.id).populate('student')
    const currentFaculty=await User.findOne({email:req.user.email})
    const faculties = await User.find({
        email:{$ne:currentFaculty.email},
        department: currentFaculty.department,
        role: { $in: ['professor', 'hod'] }
    }).populate('department');
    res.render('professor/reviewAssignment',{assignment,faculties})
})
router.route('/approve/:id').post(authProfessor,approveAssignment)
router.route('/reject/:id').post(authProfessor,rejectAssignment)
router.route('/reviews').get(authProfessor,async(req,res)=>{
    const user=await User.findOne({email:req.user.email})
    const assignments = await Assignment.find({
        faculty: user._id,
        status: { $in: ["rejected", "approved"] }
    }).populate('student');
    res.render('hod/reviews',{assignments})
})
router.route('/forward-assignment').post(authProfessor,forwardAssignment)

module.exports=router

