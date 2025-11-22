const multer =require("multer")

const upload=multer({
    storage:multer.memoryStorage(),
    fileFilter:(req,file,cb)=>{
        if(file.mimetype.startsWith('image/')){
            cb(null,true)
        }
        else{
            cb(new Error("Only images are required"),false)
        }
    }
})

module.exports=upload