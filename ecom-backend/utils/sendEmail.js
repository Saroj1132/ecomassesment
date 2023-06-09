const nodeMailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({
    
    service: 'gmail',
    auth: {
      user: 'sarojpanigrahi425@gmail.com',
      pass: '8866141306',
    },
  });

  const mailOptions = {
    from: 'sarojpanigrahi425@gmail.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};