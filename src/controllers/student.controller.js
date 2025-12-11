const { User } = require('../models/schemas/user.model')
const { Assignment } = require('../models/schemas/assignment.model.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/student/sendEmail.js')
const path = require('path')
const { uploadToCloudinary } = require('../utils/student/cloudinary.js')
const https = require('https')

const dashboard = async (req, res) => {
  const user = await User.findOne({ email: req.user.email })
  if (!user) {
    return res.redirect('/')
  }
  const draftCount = await Assignment.countDocuments({
    status: 'draft',
    student: user._id,
  })
  const submittedCount = await Assignment.countDocuments({
    status: 'submitted',
    student: user._id,
  })
  const approvedCount = await Assignment.countDocuments({
    status: 'approved',
    student: user._id,
  })
  const rejectedCount = await Assignment.countDocuments({
    status: 'rejected',
    student: user._id,
  })
  const recentSubmissions = await Assignment.find({ student: user._id })
    .sort({ createdAt: -1 })
    .limit(5)
  res.render('student/dashboard', {
    draftCount,
    submittedCount,
    approvedCount,
    rejectedCount,
    recentSubmissions,
    user,
    currentPage: 'dashboard',
  })
}

const createAssignment = async (req, res) => {
  try {
    const { title, description, category, faculty } = req.body
    const student = await User.findOne({ email: req.user.email })
    if (!student) {
      return res.status(404).send('Student not found')
    }
    if (!req.files || req.files.length === 0) {
      return res.render('student/uploadAssignment', {
        error: 'Please upload atleast 1 file! 🥲',
      })
    }
    const assignments = []
    for (const file of req.files) {
      const result = await uploadToCloudinary(
        file.buffer,
        'assignmentChecker/assignments'
      )
      const newAssignment = await Assignment.create({
        title: title,
        description,
        category,
        filePath: result.secure_url,
        fileId: result.public_id,
        student: student._id,
        faculty,
        status: 'draft',
      })
      assignments.push(newAssignment)
    }
    res.redirect('/student/assignments')
  } catch (error) {
    console.log(error)
    const student = await User.findOne({ email: req.user.email })
    const faculties = await User.find({
      department: student.department,
      role: 'professor',
    })
    res.render('student/uploadAssignment', {
      error:
        'Error while uploading assignment! May be checks if info is correct and valid',
      faculty: faculties,
    })
  }
}

const viewAssignments = async (req, res) => {
  const user = await User.findOne({ email: req.user.email })
  try {
    const assignments = await Assignment.find({ student: user._id }).populate(
      'faculty',
      'name'
    )
    res.render('student/assignments', {
      assignments,
      currentPage: 'assignments',
    })
  } catch (error) {
    console.log(error)
    res.render('student/assignments', {
      error: 'Error while fetching assignments!',
      currentPage: 'assignments',
    })
  }
}

const submitAssignment = async (req, res) => {
  const id = req.params.id
  const assignment = await Assignment.findById(id)
  if (!assignment) {
    return res.json({
      success: false,
      message: 'Assignment does not exist',
    })
  }
  if (assignment.status == 'submitted') {
    return res.json({
      success: false,
      message: 'Assignment is already submitted',
    })
  }
  const student = await User.findOne({ email: req.user.email })
  assignment.history.push({
    action: 'submitted',
    filePath: assignment.filePath,
    remarks: 'Submition',
    user: student._id,
  })
  assignment.status = 'submitted'
  await assignment.save()
  const faculty = await User.findById(assignment.faculty)
  if (!faculty) {
    return res.json({
      success: false,
      message: 'Faculty not found for this assignment!',
    })
  }
  if (!student) {
    return res.json({
      success: false,
      message: 'Student info not found!',
    })
  }
  await sendEmail({
    to: faculty.email,
    subject: 'New Assignment Submitted for Review',
    html: `
        <p>Hello ${faculty.name},</p>
        <p>A student has submitted a draft assignment for your review.</p>
        <p><strong>Assignment Title:</strong> ${assignment.title}</p>
        <p><strong>Submitted By:</strong> ${student.name}</p>
        <p>Please log in to the portal to review it.</p>
      `,
  })
  res.json({
    success: true,
    message: 'Assignment submitted and notification sent',
  })
}

const downloadAssignment = async (req, res) => {
  try {
    const id = req.params.id
    const assignment = await Assignment.findById(id)

    if (!assignment) {
      return res.json({ error: 'Assignment not found!' })
    }

    if (!assignment.filePath) {
      return res.json({ error: 'Assignment does not have file!' })
    }

    const fileUrl = assignment.filePath
    const fileName = assignment.title.replace(/\s+/g, '_') + '.pdf'

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`)
    res.setHeader('Content-Type', 'application/pdf')

    https
      .get(fileUrl, (fileStream) => {
        fileStream.pipe(res)
      })
      .on('error', (err) => {
        console.error('Download error:', err)
        res.status(500).send('Error downloading file')
      })
  } catch (error) {
    console.log(error)
    res.status(500).send('Server error')
  }
}

const resubmitAssignment = async (req, res) => {
  try {
    const id = req.params.id
    const { description } = req.body
    const assignment = await Assignment.findById(id)
    if (!assignment) {
      return res.render('student/assignments', {
        error: 'Assignment not found!',
      })
    }
    let newFile = assignment.filePath
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        'assignmentChecker/assignments'
      )
      newFile = result.secure_url
      assignment.fileId = result.public_id
    }
    const student = await User.findOne({ email: req.user.email })
    assignment.history.push({
      action: 'resubmitted',
      filePath: newFile,
      remarks: 'Resubmittion',
      user: student._id,
    })
    assignment.filePath = newFile
    ;(assignment.description = description), (assignment.status = 'submitted')
    await assignment.save()

    //mail sending to faculty

    const faculty = await User.findById(assignment.faculty)
    if (!faculty) {
      return res.json({
        success: false,
        message: 'Faculty not found for this assignment!',
      })
    }

    if (!student) {
      return res.json({
        success: false,
        message: 'Student info not found!',
      })
    }
    await sendEmail({
      to: faculty.email,
      subject: 'Resubmitted assignment for Review',
      html: `
            <p>Hello ${faculty.name},</p>
            <p>A student has resubmitted an assignment for your review.</p>
            <p><strong>Assignment Title:</strong> ${assignment.title}</p>
            <p><strong>Submitted By:</strong> ${student.name}</p>
            <p>Please log in to the portal to review it.</p>
        `,
    })
    res.redirect(`/student/assignments/${id}`)
  } catch (error) {
    const id = req.params.id
    console.log(error)
    res.redirect(`/student/assignments/${id}`)
  }
}

const logout = async (req, res) => {
  try {
    res.clearCookie('token')
    res.redirect('/')
  } catch (error) {
    console.log('Error while logging out ', error)
    res.redirect('/student/dashboard')
  }
}

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body
    const user = await User.findOne({ email: req.user.email }).populate(
      'department'
    )
    const submittedCount = await Assignment.countDocuments({
      student: user._id,
      status: 'submitted',
    })
    const ok = await bcrypt.compare(oldPassword, user.password)
    if (!ok) {
      return res.render('student/profile', {
        error: 'Incorrect password!',
        user,
        submittedCount,
        currentPage:'profile'
      })
    }
    if (newPassword !== confirmPassword) {
      return res.render('student/profile', {
        error: 'New password does not match with confirm password!',
        user,
        submittedCount,
        currentPage:'profile'
      })
    }
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    res.render('student/profile', {
      success: 'Password changed successfully!',
      user,
      submittedCount,
      currentPage:'profile'
    })
  } catch (error) {
    console.log('Error while changing the password ,', error)
    const user = await User.findOne({ email: req.user.email }).populate(
      'department'
    )
    const submittedCount = await Assignment.countDocuments({
      student: user._id,
      status: 'submitted',
    })
    return res.render('student/profile', {
      error: 'Error while changing the password',
      user,
      submittedCount,
      currentPage:'profile'
    })
  }
}

module.exports = {
  dashboard,
  createAssignment,
  viewAssignments,
  submitAssignment,
  downloadAssignment,
  resubmitAssignment,
  logout,
  changePassword,
}
