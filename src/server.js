const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });
const {app}=require('./app.js')
const ejs=require('ejs')
const path=require('path')
const {connectDb}=require('./config/db.cfg.js')

app.set("view engine",'ejs')
app.set('views', path.join(__dirname, 'src/views'));




connectDb()
.then(()=>{
    app.listen(process.env.PORT,()=>{
    console.log(`Server started at ${process.env.PORT}...`)
    })
})
.catch((err)=>{
    console.log("Error while connecting with database ",err)
})

