const mongoose=require('mongoose')

const connectDb=async()=>{
    try {
        const connectInstance=await mongoose.connect(`${process.env.MONGO_URL}`)
        console.log("MongoDB connect successfully, host: ",connectInstance.connection.host);
    } catch (error) {
        console.log("MongoDB connection problem: ",error)
        process.exit(1)
    }
}
module.exports={connectDb}