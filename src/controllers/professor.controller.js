const { User } = require('../models/schemas/user.model')
const { Assignment } = require('../models/schemas/assignment.model.js')
const bcrypt = require('bcrypt')
const crypto=require('crypto')



const dashboard=async(req,res)=>{
    try {
        const user=await User.findOne({email:req.user.email})
        const assignments=await Assignment.find({faculty:user._id,status:{$in:['submitted','forwarded']}}).populate('student')
        const pendingCount=await Assignment.countDocuments({faculty:user._id,status:{$in:['submitted','forwarded']}})
        const approvedCount=await Assignment.countDocuments({faculty:user._id,status:'approved'})
        const rejectedCount=await Assignment.countDocuments({faculty:user._id,status:'rejected'})
        const totalReviewed=approvedCount+rejectedCount
        res.render('professor/dashboard',{assignments,pendingCount,approvedCount,rejectedCount,totalReviewed})
    } catch (error) {
        console.log("Error while showing dashboard of user")
        return res.send("Server side error, plz try to login again!")
    }
}

const approveAssignment=async(req,res)=>{
    try {
        const {remarks,signature}=req.body
        const id=req.params.id
        const assignment=await Assignment.findById(id)
        if(!assignment){
            return res.json({success:false,message:"Assignment not found!"})
        }
        const user=await User.findOne({email:req.user.email})
        if(!user){
            return res.json({success:false,message:"Current user not found!"})
        }
        const hashedSignature=crypto.createHash('sha256').update(signature).digest('hex')
        assignment.history.push({
            action:"approved",
            filePath:assignment.filePath,
            remarks,
            user:user._id,
            signature:{
                raw:signature,
                hash:hashedSignature
            }
        })
        assignment.status="approved"
        await assignment.save()
        return res.json({success:true,message:"Assignment approved successfully!🎊"})
    } catch (error) {
        console.log("error while approving the assignment ",error)
        return res.json({success:false,message:"error while approving the assignment!"})
    }
}

const rejectAssignment=async(req,res)=>{
    try {
        const {remarks,signature}=req.body
        const id=req.params.id
        const assignment=await Assignment.findById(id)
        if(!assignment){
            return res.json({success:false,message:"Assignment not found!"})
        }
        const user=await User.findOne({email:req.user.email})
        if(!user){
            return res.json({success:false,message:"Current user not found!"})
        }
        const hashedSignature=crypto.createHash('sha256').update(signature).digest('hex')
        assignment.history.push({
            action:"rejected",
            filePath:assignment.filePath,
            remarks,
            user:user._id,
            signature:{
                raw:signature,
                hash:hashedSignature
            }
        })
        assignment.status="rejected"
        await assignment.save()
        return res.json({success:true,message:"Assignment rejected successfully!"})
    } catch (error) {
        console.log("error while rejecting the assignment ",error)
        return res.json({success:false,message:"error while rejecting the assignment!"})
    }
}

const forwardAssignment=async(req,res)=>{
    try {
            const {forwardMessage,assignmentId,forwardToFacultyId}=req.body
            const assignment=await Assignment.findById(assignmentId)
            if(!assignment){
                return res.json({success:false,message:"Assignment not found!"})
            }
            const user=await User.findOne({email:req.user.email})
            if(!user){
                return res.json({success:false,message:"User not found!"})
            }
            assignment.history.push({
                action:'forwarded',
                filePath:assignment.filePath,
                remarks:forwardMessage,
                user:user._id,
            })
            assignment.status='forwarded'
            assignment.faculty=forwardToFacultyId
            await assignment.save()
            res.json({success:true,message:"Assignment Forwarded successfully!"})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:"Error while forwarding the assignment"})
    }
}


module.exports = {
  dashboard,
  approveAssignment,
  rejectAssignment,
  forwardAssignment,
}
