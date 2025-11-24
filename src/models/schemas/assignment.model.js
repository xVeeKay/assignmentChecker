const mongoose=require('mongoose')
const {User}=require('../schemas/user.model.js')

const mongooseSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    student:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    filePath:{
        type:String,
        required:true
    },
    fileId:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    faculty:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    submittedAt:{
        type:Date,
        default:Date.now()
    },
    status:{
        type:String,
        default:'draft',
        required:true
    },
    history:[{
        action: { type: String, enum: ["submitted", "resubmitted", "approved", "rejected"] },
        filePath:{
            type:String,
            required:true
        },
        remarks:{
            type:String,
            required:true
        },
        date:{
            type:Date,
            default:Date.now()
        },
        user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
        },
        signature:{
            type:String,
            required:true
        }
    }]
},{timestamps:true})

const Assignment=new mongoose.model("Assignment",mongooseSchema)
module.exports={Assignment}