const mongoose=require('mongoose')

const departmentSchema=new mongoose.Schema({
    name:String,
    type:String,
    address:String,
},{timestamp:true})

const Department=new mongoose.model('department',departmentSchema)
module.exports={Department} 