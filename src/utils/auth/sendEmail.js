const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user:"vishalKakiyan@gmail.com",
      pass:"nqfuhqcbfkidhqwd"  
    },
  });

  return transporter.sendMail({
    from: `"Admin team" <vishalkakiyan@gmail.com>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
