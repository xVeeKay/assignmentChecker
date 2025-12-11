// const nodemailer=require("nodemailer")

// const transporter=nodemailer.createTransport({
//     service:'gmail',
//     auth:{
//         user:"vishalKakiyan@gmail.com",
//         pass:"nqfuhqcbfkidhqwd"
//     }
// })

// async function sendWelcomeEmail(to, name, password) {
//   const mailOptions = {
//     from: `"Admin Team" <vishalkakiyan@gmail.com>`,
//     to,
//     subject: "Welcome to Our System 🎉",
//     html: `
//       <h3>Welcome, ${name}!</h3>
//       <p>Your account has been created successfully.</p>
//       <p><b>Email:</b> ${to}</p>
//       <p><b>Password:</b> ${password}</p>
//       <p>Please log in and change your password after first login.</p>
//       <hr />
//       <small>This is an automated email. Do not reply.</small>
//     `,
//   };
//   await transporter.sendMail(mailOptions);
// }

// module.exports = { sendWelcomeEmail };

const brevo = require('@getbrevo/brevo')

module.exports.sendWelcomeEmail = async (to, name, password) => {
  try {
    let apiInstance = new brevo.TransactionalEmailsApi()

    let apiKey = apiInstance.authentications['apiKey']
    apiKey.apiKey = process.env.BREVO_API_KEY // Store this in .env

    let sendSmtpEmail = new brevo.SendSmtpEmail()

    sendSmtpEmail.subject = 'Welcome to Our System 🎉'
    sendSmtpEmail.htmlContent = `<html><h3>Welcome, ${name}!</h3>
       <p>Your account has been created successfully.</p>
       <p><b>Email:</b> ${to}</p>
       <p><b>Password:</b> ${password}</p>
       <p>Please log in and change your password after first login.</p>
       <hr />
       <small>This is an automated email. Do not reply.</small></html>`
    sendSmtpEmail.sender = {
      name: 'Assignment approval system',
      email: 'vishalkakiyan@gmail.com',
    } // Must match the email you verified!
    sendSmtpEmail.to = [
      { email: to, name: name },
    ]

    let data = await apiInstance.sendTransacEmail(sendSmtpEmail)
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}
