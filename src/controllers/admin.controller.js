const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { Department } = require('../models/schemas/department.model.js')
const { User } = require('../models/schemas/user.model.js')
const { sendWelcomeEmail } = require('../utils/admin/sendEmail.js')
const { Assignment } = require('../models/schemas/assignment.model.js')
const { uploadToCloudinary } = require('../utils/admin/cloudinary.js')
const csv=require('csv-parser')
const { Readable } = require('stream')

const adminEmail = 'admin@a.com'
const pass = '123'

const login = async (req, res) => {
  const { email, password } = req.body
  const hashedPassword = await bcrypt.hash(pass, 10)
  if (email === adminEmail) {
    const ok = await bcrypt.compare(password, hashedPassword)
    if (!ok) {
      return res
        .status(400)
        .render('auth/login', { error: 'Invalid password! 🥲' })
    }
    const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    })
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    })
    return res.redirect('/admin/dashboard')
  }
  const user = await User.findOne({ email })
  if (!user) {
    return res.render('auth/login', { error: 'Invalid email!' })
  }
  const userPassword = user.password
  const ok = await bcrypt.compare(password, userPassword)
  if (!ok) {
    return res.render('auth/login', { error: 'Invalid password!' })
  }
  const token = jwt.sign({ email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  })
  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 15 * 60 * 1000,
  })
  if (user.role === 'student') {
    return res.redirect('/student/dashboard')
  } else if (user.role === 'hod') {
    return res.redirect('/hod/dashboard')
  } else if (user.role === 'professor') {
    return res.redirect('/professor/dashboard')
  }
}

const createDepartment = async (req, res) => {
  const { name, type, address } = req.body
  await Department.create({ name, type, address })
  res
    .status(200)
    .render('admin/createDepartment', {
      success: 'Department Created Successfully! 🎊',
    })
}

const viewDepartments = async (req, res) => {
  try {
    const { q, type, page = 1 } = req.query
    const limit = 10
    const skip = (page - 1) * limit
    let query = {}
    if (q && q.trim() !== '') {
      query.name = { $regex: q.trim(), $options: 'i' }
    }
    if (type && type.trim() !== '') {
      query.type = type.trim()
    }
    const totalDepartments = await Department.countDocuments(query)
    const departments = await Department.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })
    const totalPages = Math.ceil(totalDepartments / limit)
    const deptData = await Promise.all(
        departments.map(async (dept) => {
            const userCount = await User.countDocuments({ department: dept._id });
            return {
            id: dept._id,
            name: dept.name,
            type: dept.type,
            address: dept.address,
            userCount: userCount
            };
        })
    );
    res.render('admin/departmentList', {
      departments: deptData,
      q,
      type,
      page: Number(page),
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching departments:', error)
    res.status(500).send('Internal Server Error')
  }
}

const updateDepartment = async (req, res) => {
  const id = req.params.id
  const { name, type, address } = req.body
  const updatedDepartment = await Department.findByIdAndUpdate(
    id,
    { name, type, address },
    { new: true }
  )
  if (!updatedDepartment) {
    return res
      .status(404)
      .render('admin/editDepartment', { error: 'Department not found!' })
  }
  res.render('admin/editDepartment', {
    department: updatedDepartment,
    success: 'Department Updated Successfully! 🎊',
  })
}

const deleteDepartment = async (req, res) => {
  const id = req.params.id
  const userCount = await User.countDocuments({ department: id })
  if (userCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete department. ${userCount} user(s) are still associated.`,
    })
  }
  const deletedDept = await Department.findByIdAndDelete(id)
  if (!deletedDept) {
    return res.status(404).json({
      success: false,
      message: 'Deparment not found!',
    })
  }
  return res.status(200).json({
    success: true,
    message: 'Department deleted successfully! 😎',
  })
}

const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, department, role } = req.body
    const existingUser = await User.findOne({ email })
    const departments = await Department.find()
    if (existingUser) {
      return res.status(400).render('admin/createUser', {
        error: 'Email already exists!',
        departments,
      })
    }
    const plainPassword = password || crypto.randomBytes(4).toString('hex')
    const hashedPassword = await bcrypt.hash(plainPassword, 10)
    var avatar = 'https://avatar.iran.liara.run/public/19'
    if (req.file && req.file.buffer) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        'assignmentChecker/userAvatars'
      )
      avatar = result.secure_url
    }
    const user = new User({
      name,
      email,
      password:hashedPassword,
      phone,
      department,
      role,
      avatar,
    })
    await user.validate()
    await user.save()
    if (req.body.sendEmail) {
      // await sendWelcomeEmail(email, name, plainPassword)
      let ack = await sendWelcomeEmail(email,name,plainPassword)
      if(!ack){
        console.log(ack)
        res.render('admin/createUser',{error:"Error while sending email to user",departments})
      }
    }

    res.render('admin/createUser', {
      departments,
      success: 'User created successfully! 🎊',
    })
  } catch (error) {
    console.log("Error while creating user!", error)
    const departments = await Department.find()
    res.render('admin/createUser',{error:"Error while creating user",departments})
  }
}

const viewUsers = async (req, res) => {
  try {
    const { search, role, department, page = 1 } = req.query
    const limit = 20
    const skip = (page - 1) * limit
    let query = {}
    if (role && role.trim() !== '') {
      query.role = role.trim()
    }
    if (department && department.trim() !== '') {
      query.department = department.trim()
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }
    const users = await User.find(query)
      .populate('department', 'name')
      .skip(skip)
      .limit(Number(limit))
      .sort({ name: 1 })

    const totalUser = await User.countDocuments(query)
    const totalPages = Math.ceil(totalUser / limit)
    const departments = await Department.find()
    res.render('admin/userList', {
      users,
      departments,
      page: Number(page),
      totalPages,
      search,
      role,
      department,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).send('Internal Server Error')
  }
}

const updateUser = async (req, res) => {
  try {
    const { name, email, phone, department, password } = req.body
    const id = req.params.id
    const user = await User.findById(id)
    if (!user) {
      return res.render('admin/editUser', { error: 'User not found! 😔' })
    }
    if (name) user.name = name
    if (email) user.email = email
    if (phone) user.phone = phone
    if (department) user.department = department
    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10)
    }
    await user.save()
    const departments = await Department.find()
    res.render('admin/editUser', {
      user,
      departments,
      success: 'User updated successfully! 🎊',
    })
  } catch (error) {
    console.log(error)
    res.render('admin/editUser', { error: 'Error while updating user info...' })
  }
}

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (user.role === 'Student') {
      const pending = await Assignment.find({
        student: userId,
        status: 'pending',
      })

      if (pending.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete: user has pending submissions.',
        })
      }
    }

    await User.findByIdAndDelete(userId)

    return res.json({ success: true, message: 'User deleted successfully.' })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const logout=async(req,res)=>{
  try {
      res.clearCookie('token')
      res.redirect('/')
  } catch (error) {
      console.log("Error while logging out ",error)
      res.redirect('/admin/dashboard')
  }
}

const bulkUserCreation=async(req,res)=>{
  try {
    if(!req.file){
      return res.render('admin/bulkUserCreation',{error:"File is required!"})
    }
    const rows=[]
    const stream=Readable.from(req.file.buffer.toString())
    stream
      .pipe(csv())
      .on('data',(data)=>rows.push(data))
      .on('end',async()=>{
        var added=0;
        var skipped=0;
        for(let row of rows){
          let {name,email,password,phone,department,role}=row
          name = name?.trim();
          email = email?.trim().toLowerCase();
          password = password?.trim();
          phone = phone?.trim();
          department = department?.trim();
          role = role?.trim();
          if (!name || !email || !password || !phone || !department || !role) {
            skipped++;
            continue;
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            skipped++;
            continue;
          }
          if (isNaN(Number(phone))) {
            skipped++;
            continue;
          }
          const dept = await Department.findOne({ name: department });
          if (!dept) {
            skipped++;
            continue;
          }
          const exists=await User.findOne({email})
          if(exists){
            skipped++;
            continue
          }
          const hashedPassword=await bcrypt.hash(password,10)
          const user = new User({
              name,
              email,
              password:hashedPassword,
              phone,
              department:dept._id,
              role,
          })
          await user.validate()
          await user.save()
          added++
        }
        return res.render('admin/bulkUserCreation',{success:`Upload complete! Added: ${added}, Skipped: ${skipped}`})
      })
  } catch (error) {
    console.log("Error while bulk uploading user, ",error)
    return res.render('admin/bulkUserCreation',{error:"Internal server error!"})
  }
}

module.exports = {
  login,
  createDepartment,
  viewDepartments,
  updateDepartment,
  deleteDepartment,
  createUser,
  viewUsers,
  updateUser,
  deleteUser,
  logout,
  bulkUserCreation,
}
