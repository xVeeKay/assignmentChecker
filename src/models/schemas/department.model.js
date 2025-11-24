const mongoose=require('mongoose')

const departmentSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    type:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
},{timestamp:true})

const Department=new mongoose.model('department',departmentSchema)
module.exports={Department} 