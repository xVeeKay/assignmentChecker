const nodemailer=require("nodemailer")


const transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:"vishalKakiyan@gmail.com",
        pass:"nqfuhqcbfkidhqwd"
    }
})

async function sendWelcomeEmail(to, name, password) {
  const mailOptions = {
    from: `"Admin Team" <vishalkakiyan@gmail.com>`,
    to,
    subject: "Welcome to Our System 🎉",
    html: `
      <h3>Welcome, ${name}!</h3>
      <p>Your account has been created successfully.</p>
      <p><b>Email:</b> ${to}</p>
      <p><b>Password:</b> ${password}</p>
      <p>Please log in and change your password after first login.</p>
      <hr />
      <small>This is an automated email. Do not reply.</small>
    `,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendWelcomeEmail };