const express=require('express')
const app=express()
const adminRoutes=require('./routes/admin.route.js')
const studentRoutes=require('./routes/student.route.js')
const cookieParser=require('cookie-parser')
const {login}=require('./controllers/admin.controller.js')
const path=require('path')
const authRoutes=require('./routes/auth.route.js')
const professorRoutes=require('./routes/professor.route.js')
const hodRoutes=require('./routes/hod.route.js')

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use((req, res, next) => {
  // sanitize req.body
  if (req.body) {
    Object.keys(req.body).forEach(k => {
      if (typeof req.body[k] === "string") {
        let trimmed = req.body[k].trim();
        req.body[k] = trimmed === "" ? undefined : trimmed;
      }
    });
  }

  // sanitize req.fields (multer sometimes uses this)
  if (req.fields) {
    Object.keys(req.fields).forEach(k => {
      if (typeof req.fields[k] === "string") {
        let trimmed = req.fields[k].trim();
        req.fields[k] = trimmed === "" ? undefined : trimmed;
      }
    });
  }

  next();
});


app.get('/',(req,res)=>{res.render('auth/login')})
app.post('/login',login)
app.use('/auth',authRoutes)
app.use('/admin',adminRoutes)
app.use('/student',studentRoutes)
app.use('/professor',professorRoutes)
app.use('/hod',hodRoutes)



module.exports={app}