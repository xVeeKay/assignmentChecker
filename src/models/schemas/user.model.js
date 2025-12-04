const mongoose=require('mongoose');
const { Department } = require('./department.model');


const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
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
    password:{
        type:String,
        required:true
    },    
    phone:{
        type:Number,
        required:true
    },
    department:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'department',
        required:true
    },
    role:{
        type:String,
        required:true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    avatar:{
        type:String,
        default:"https://avatar.iran.liara.run/public/19"
    },
    lastLogoutAll:{
        type:Date,
        default:null
    },
},{timestamps:true})

const User=mongoose.model("User",userSchema)
module.exports={User}