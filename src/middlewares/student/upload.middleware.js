const path=require('path')
const multer=require('multer')

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname, '../../../public/uploads'))
    },
    filename:function(req,file,cb){
        const timestamp = Date.now();
        const nameWithoutExt = path.basename(file.originalname, path.extname(file.originalname)); // original name without extension
        const extension = path.extname(file.originalname);
        const finalName = `${nameWithoutExt}-${timestamp}${extension}`;

        cb(null, finalName);
    }
})

const fileFilter=(req,file,cb)=>{
    if(file.mimetype==='application/pdf'){
        cb(null,true)
    }else{
        cb(new Error("Only PDF files are allowed.⚔️"),false)
    }
}

const upload=multer({
    storage,
    limits:{fileSize:10 * 1024 * 1024},
    fileFilter
})

module.exports=upload