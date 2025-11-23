const { User } = require('../models/schemas/user.model')
const { Assignment } = require('../models/schemas/assignment.model.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/student/sendEmail.js')
const path = require('path')
const { uploadToCloudinary } = require('../utils/student/cloudinary.js')
const https = require('https')

const dashboard = async (req, res) => {
  const draftCount = await Assignment.countDocuments({ status: 'draft' })
  const submittedCount = await Assignment.countDocuments({
    status: 'submitted',
  })
  const approvedCount = await Assignment.countDocuments({ status: 'approved' })
  const rejectedCount = await Assignment.countDocuments({ status: 'rejected' })
  const recentSubmissions = await Assignment.find()
    .sort({ createdAt: -1 })
    .limit(5)
  res.render('student/dashboard', {
    draftCount,
    submittedCount,
    approvedCount,
    rejectedCount,
    recentSubmissions,
  })
}

const createAssignment = async (req, res) => {
  try {
    const { title, description, category, faculty } = req.body
    const student = await User.find({ email: req.user.email })
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
        title: title || file.originalname,
        description: description || '',
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
    res.render('student/uploadAssignment', {
      error: 'Error while uploading assignment!',
    })
  }
}

const viewAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('faculty', 'name')
    res.render('student/assignments', { assignments })
  } catch (error) {
    console.log(error)
    res.render('student/assignments', {
      error: 'Error while fetching assignments!',
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
    console.log(error)
    res.redirect(`/student/assignments/${id}`)
  }
}

module.exports = {
  dashboard,
  createAssignment,
  viewAssignments,
  submitAssignment,
  downloadAssignment,
  resubmitAssignment,
}
