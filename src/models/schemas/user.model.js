const mongoose=require('mongoose');
const { Department } = require('./department.model');


const userSchema=new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true,
        required:true,
        validate:{
            validator:function(value){
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },
            message:(props)=>`${props.value} is not a valid email.`
        },
    },
    password:String,
    phone:Number,
    department:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'department'
    },
    role:String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    avatar:String
},{timestamps:true})

const User=mongoose.model("User",userSchema)
module.exports={User}