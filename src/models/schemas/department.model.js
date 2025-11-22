const mongoose=require('mongoose')

const departmentSchema=new mongoose.Schema({
    name:String,
    type:String,
    address:String,
    users:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }]
},{timestamp:true})

const Department=new mongoose.model('department',departmentSchema)
module.exports={Department} 