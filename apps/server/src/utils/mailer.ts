import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email: string, code: string) => {
  const mailOptions = {
    from: `"Manny Oficios Cerca" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Código de verificación - Manny Oficios Cerca",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>¡Hola!</h2>
        <p>Tu código de verificación para Manny Oficios Cerca es:</p>
        <h1 style="color: #007AFF; letter-spacing: 5px;">${code}</h1>
        <p>Este código expirará en breve.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
