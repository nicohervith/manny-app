import nodemailer from "nodemailer";

// Configuración para Gmail (necesitarás una "Contraseña de Aplicación")
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Tu email: ej@gmail.com
    pass: process.env.EMAIL_PASS, // Tu contraseña de aplicación de 16 dígitos
  },
});

export const sendVerificationEmail = async (email: string, code: string) => {
  const mailOptions = {
    from: `"FindJob App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Código de verificación - FindJob",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>¡Hola!</h2>
        <p>Tu código de verificación para FindJob es:</p>
        <h1 style="color: #007AFF; letter-spacing: 5px;">${code}</h1>
        <p>Este código expirará en breve.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
