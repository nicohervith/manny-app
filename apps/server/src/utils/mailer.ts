import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

export const sendVerificationEmail = async (email: string, code: string) => {
  const mailOptions = {
    from: `"Mani Oficios Cerca" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Código de verificación - Mani Oficios Cerca",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>¡Hola!</h2>
        <p>Tu código de verificación para Mani Oficios Cerca es:</p>
        <h1 style="color: #007AFF; letter-spacing: 5px;">${code}</h1>
        <p>Este código expirará en breve.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
