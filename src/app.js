const express=require('express')
const app=express()
const adminRoutes=require('./routes/admin.route.js')
const studentRoutes=require('./routes/student.route.js')
const cookieParser=require('cookie-parser')
const {login}=require('./controllers/admin.controller.js')
const path=require('path')
const authRoutes=require('./routes/auth.route.js')

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
        if (req.body[key] === "") req.body[key] = undefined;
      }
    }
  }
  next();
});

app.get('/',(req,res)=>{res.render('auth/login')})
app.post('/login',login)
app.use('/auth',authRoutes)
app.use('/admin',adminRoutes)
app.use('/student',studentRoutes)





module.exports={app}