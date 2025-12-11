const {User}=require('../models/schemas/user.model.js')
const {Assignment}=require('../models/schemas/assignment.model.js')

const dashboard=async(req,res)=>{
    try {
        const user=await User.findOne({email:req.user.email})
        if(!user){
            res.json({error:"User not found!"})
        }
        const assignments=await Assignment.find({faculty:user._id,status:{$in:['submitted','forwarded']}}).populate('student')
        const pendingCount=await Assignment.countDocuments({faculty:user._id,status:{$in:['submitted','forwarded']}})
        const approvedCount=await Assignment.countDocuments({faculty:user._id,status:'approved'})
        const rejectedCount=await Assignment.countDocuments({faculty:user._id,status:'rejected'})
        const totalReviewed=approvedCount+rejectedCount
        res.render('hod/dashboard',{assignments,pendingCount,approvedCount,rejectedCount,totalReviewed})
    } catch (error) {
        const user=await User.findOne({email:req.user.email})
        if(!user){
            res.json({error:"User not found!"})
        }
        const assignments=await Assignment.find({faculty:user._id,status:{$in:['submitted','forwarded']}}).populate('student')
        console.log("Error while showing the dashboard",error)
        res.render('hod/dashboard',{assignments})
    }
}

const approveAssignment=async(req,res)=>{
    try {
        const {remarks,signature}=req.body
        const id=req.params.id
        const assignment=await Assignment.findById(id)
        if(!assignment){
            return res.render('brivo')
        }
    } catch (error) {
        
    }
}

module.exports = {
  dashboard,
  approveAssignment,
}
