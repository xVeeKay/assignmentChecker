const express=require('express')
const router=express.Router()
const {User}=require('../models/schemas/user.model')
const { Assignment } = require('../models/schemas/assignment.model.js')
const { authProfessor } = require('../middlewares/professor/authProfessor.middleware.js')
const {dashboard,approveAssignment,rejectAssignment,forwardAssignment}=require('../controllers/professor.controller.js')

router.route('/dashboard').get(authProfessor,dashboard)
router.route('/assignments').get(authProfessor,async(req,res)=>{
    const user=await User.findOne({email:req.user.email})
    const assignments=await Assignment.find({faculty:user._id,status:'submitted'}).populate('student')
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
    res.render('professor/reviews',{assignments})
})
router.route('/forward-assignment').post(authProfessor,forwardAssignment)

module.exports=router

