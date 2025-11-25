const { User } = require('../models/schemas/user.model')
const { Assignment } = require('../models/schemas/assignment.model.js')
const bcrypt = require('bcrypt')



const dashboard=async(req,res)=>{
    try {
        const user=await User.findOne({email:req.user.email})
        const assignments=await Assignment.find({faculty:user._id,status:'submitted'}).populate('student')
        const pendingCount=await Assignment.countDocuments({faculty:user._id,status:'submitted'})
        const approvedCount=await Assignment.countDocuments({faculty:user._id,status:'approved'})
        const rejectedCount=await Assignment.countDocuments({faculty:user._id,status:'rejected'})
        const totalReviewed=approvedCount+rejectedCount
        res.render('professor/dashboard',{assignments,pendingCount,approvedCount,rejectedCount,totalReviewed})
    } catch (error) {
        console.log("Error while showing dashboard of user")
        return res.send("Server side error, plz try to login again!")
    }
}


module.exports = {
  dashboard,
  
}
