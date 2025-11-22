const mongoose=require('mongoose')

const connectDb=async()=>{
    try {
        const connectInstance=await mongoose.connect("mongodb+srv://vishalkakiyan:vk2505005@cluster0.bbbmwim.mongodb.net/UUS?appName=Cluster0")
        console.log("MongoDB connect successfully, host: ",connectInstance.connection.host);
    } catch (error) {
        console.log("MongoDB connection problem: ",error)
        process.exit(1)
    }
}
module.exports={connectDb}