import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validación básica
    if (!name || !email || !subject || !message) {
      return Response.json(
        { error: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    // Enviar correo con Resend
    const { data, error } = await resend.emails.send({
      from: "Oopsy <noreply@oopsy.cl>",
      to: ["contacto@oopsy.cl"],
      replyTo: email,
      subject: `[Oopsy Web] ${subject} — ${name}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #faf8f5; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 24px; color: #302e2c; margin: 0;">Nuevo mensaje de contacto</h1>
            <div style="width: 40px; height: 2px; background: linear-gradient(90deg, #b7e27f, #f2a0c5); margin: 12px auto;"></div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e8e5e0; color: #8a8580; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 120px;">Nombre</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e8e5e0; color: #302e2c; font-size: 15px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e8e5e0; color: #8a8580; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Correo</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e8e5e0; color: #302e2c; font-size: 15px;"><a href="mailto:${email}" style="color: #52b8c6;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e8e5e0; color: #8a8580; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Asunto</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e8e5e0; color: #302e2c; font-size: 15px;">${subject}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 16px; background: #ffffff; border-radius: 12px; border: 1px solid #e8e5e0;">
            <p style="color: #8a8580; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Mensaje</p>
            <p style="color: #302e2c; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="text-align: center; color: #8a8580; font-size: 12px; margin-top: 24px;">
            Enviado desde el formulario de contacto de oopsy.cl
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json(
        { error: "Error al enviar el correo." },
        { status: 500 }
      );
    }

    return Response.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Contact API error:", err);
    return Response.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
