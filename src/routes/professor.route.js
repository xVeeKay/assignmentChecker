const express=require('express')
const router=express.Router()
const {User}=require('../models/schemas/user.model')
const { Assignment } = require('../models/schemas/assignment.model.js')
const { authProfessor } = require('../middlewares/professor/authProfessor.middleware.js')
const {dashboard}=require('../controllers/professor.controller.js')

router.route('/dashboard').get(authProfessor,dashboard)


module.exports=router

