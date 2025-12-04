const express=require('express')
const router=express.Router()
const {User}=require('../models/schemas/user.model')
const {authStudent}=require('../middlewares/student/authStudent.middleware.js')
const {dashboard,createAssignment, viewAssignments,submitAssignment,downloadAssignment,resubmitAssignment,logout,changePassword}=require('../controllers/student.controller.js')
const {Department}=require('../models/schemas/department.model.js')
const upload=require('../middlewares/student/upload.middleware.js')
const { Assignment } = require('../models/schemas/assignment.model.js')




function sanitizeInput(obj) {
  if (!obj) return;
  for (let key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].trim();
      if (obj[key] === "") obj[key] = undefined;
    }
  }
}




router.route('/logout').post(authStudent,logout)
router.route('/dashboard').get(authStudent,dashboard)
router.route('/profile').get(authStudent,async(req,res)=>{
    const user=await User.findOne({email:req.user.email}).populate('department')
    if(!user){
        return res.render('student/dashboard',{error:"User info not found"})
    }
    const submittedCount=await Assignment.countDocuments({student:user._id,status:'submitted'})
    res.render('student/profile',{user,submittedCount})
})
router.route('/logout-all').get(authStudent,async(req,res)=>{
  const user=await User.findOne({email:req.user.email})
  user.lastLogoutAll=Date.now()
  await user.save()
  res.clearCookie('token')
  return res.redirect('/')
})
router.route('/change-password').post(authStudent,changePassword)
router.route('/assignments/upload').get(authStudent,async(req,res)=>{
    const student=await User.findOne({email:req.user.email})
    if (!student) {
        return res.status(404).send('Student not found');
    }
    const faculties=await User.find({department:student.department,role:'professor'})
    res.render('student/uploadAssignment',{faculty:faculties})
}).post(authStudent,upload.array('files',5),(req, res, next) => {
    sanitizeInput(req.body);
    next();
  },createAssignment)
router.route('/assignments').get(authStudent,viewAssignments)
router.route('/assignments/:id').get(authStudent,async(req,res)=>{
    const assignment=await Assignment.findById(req.params.id).populate('faculty','name').populate("history.user", "name email");  
    res.render('student/assignmentDetails',{assignment,history:assignment.history   })
})
router.route('/assignments/:id/submit').post(authStudent,submitAssignment)
router.route('/assignments/:id/download').get(authStudent,downloadAssignment)
router.route('/assignments/:id/resubmit').get(authStudent,async(req,res)=>{
    const assignment=await Assignment.findById(req.params.id)
    var remarks='';
    for(var i=assignment.history.length-1;i>=0;i--){
        if(assignment.history[i].action==='rejected'){
            remarks=assignment.history[i].remarks
            break;
        }
    }
    res.render('student/resubmitAssignment',{assignment,remarks})
}).post(authStudent,upload.single('file'),(req, res, next) => {
    sanitizeInput(req.body);
    next();
  },resubmitAssignment)



module.exports=router

