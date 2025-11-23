const mongoose=require('mongoose')
const {User}=require('../schemas/user.model.js')

const mongooseSchema=new mongoose.Schema({
    title:String,
    description:String,
    student:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    filePath:String,
    fileId:String,
    category:String,
    faculty:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    submittedAt:{
        type:Date,
        default:Date.now()
    },
    status:{
        type:String,
        default:'draft'
    },
    history:[{
        action: { type: String, enum: ["submitted", "resubmitted", "approved", "rejected"] },
        filePath:String,
        remarks:String,
        date:{
            type:Date,
            default:Date.now()
        },
        user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
        },
        signature:String
    }]
},{timestamps:true})

const Assignment=new mongoose.model("Assignment",mongooseSchema)
module.exports={Assignment}