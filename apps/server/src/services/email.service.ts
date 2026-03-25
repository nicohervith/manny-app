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

export const sendVerificationEmail = async (email: string, code: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Manny Oficios Cerca <no-reply@mannyoficioscerca.com.ar>",
      to: email,
      subject: "Verifica tu correo - Manny Oficios Cerca",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007AFF;">Verificación de correo</h2>
          <p>Tu código de verificación para Manny Oficios Cerca es:</p>
          <div style="background: #f2f2f7; padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="letter-spacing: 10px; color: #333; margin: 0;">${code}</h1>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Si no solicitaste este código, puedes ignorar este mensaje.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Error de Resend:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    console.error("Falla crítica en sendVerificationEmail:", err);
    throw err;
  }
};