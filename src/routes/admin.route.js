const express=require('express')
const router=express.Router()
const {createDepartment,viewDepartments,updateDepartment,deleteDepartment,createUser,viewUsers,updateUser, deleteUser,logout}=require('../controllers/admin.controller.js')
const {authAdmin}=require('../middlewares/admin/authAdmin.middleware.js')
const {Department}=require('../models/schemas/department.model.js')
const {User}=require('../models/schemas/user.model.js')
const upload=require('../middlewares/admin/upload.middleware.js')


function sanitizeInput(obj) {
  if (!obj) return;
  for (let key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].trim();
      if (obj[key] === "") obj[key] = undefined;
    }
  }
}



//main pages
router.route('/dashboard').get(authAdmin,async(req,res)=>{
    const departmentCount=await Department.countDocuments();
    const studentCount=await User.countDocuments({role:"student"})
    const hodCount=await User.countDocuments({role:"hod"})
    const professorCount=await User.countDocuments({role:"professor"})
    res.render('admin/dashboard',{departmentCount,studentCount,hodCount,professorCount})
})
router.route('/logout').post(authAdmin,logout)
//department related routes
router.route('/departments').get(authAdmin,viewDepartments)
router.route('/departments/create').get(authAdmin,(req,res)=>{res.render('admin/createDepartment')}).post(authAdmin,createDepartment)
router.route('/departments/:id/edit').get(authAdmin,async(req,res)=>{
    const department=await Department.findById(req.params.id)
    const deptData={
        id:department._id,
        name:department.name,
        type:department.type,
        address:department.address
    }
    res.render('admin/editDepartment',{department:deptData})
}).post(authAdmin,updateDepartment)
router.route('/departments/:id/delete').delete(authAdmin,deleteDepartment)

//user related routes
router.route('/users/create').get(authAdmin,async(req,res)=>{
    const departments=await Department.find()
    res.render('admin/createUser',{departments})
}).post(authAdmin,upload.single("avatar"),(req, res, next) => {
    sanitizeInput(req.body);
    next();
  },createUser)
router.route('/users').get(authAdmin,viewUsers)
router.route('/users/:id/edit').get(authAdmin,async(req,res)=>{
    const id=req.params.id
    const user=await User.findById(id)
    const departments=await Department.find()
    res.render('admin/editUser',{user,departments})
}).post(authAdmin,updateUser)
router.route('/users/:id/delete').delete(authAdmin,deleteUser)



module.exports=router