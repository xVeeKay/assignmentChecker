const {cloudinary}=require('../config/cloudinary.cfg.js')

const uploadToCloudinary=(fileBuffer,folder)=>{
    return new Promise((resolve,reject)=>{
        const stream=cloudinary.uploader.upload_stream({folder},(err,result)=>{
            if(err){
                reject(err)
            }
            resolve(result)
        })
        stream.end(fileBuffer)
    })
}
module.exports={uploadToCloudinary}