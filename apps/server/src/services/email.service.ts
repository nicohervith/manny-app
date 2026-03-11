import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
) => {
  await resend.emails.send({
    from: "no-reply@mannyoficioscerca.com.ar",
    to: email,
    subject: "Recuperar contraseña - Manny Oficios Cerca",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007AFF;">Recuperar contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Tu código de recuperación es:</p>
        <h1 style="letter-spacing: 8px; color: #333;">${resetToken}</h1>
        <p style="color: #999; font-size: 12px;">Este código expira en 15 minutos.</p>
        <p style="color: #999; font-size: 12px;">Si no solicitaste esto, ignorá este email.</p>
      </div>
    `,
  });
};
