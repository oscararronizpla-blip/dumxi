import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendgridSend({ to, subject, html }: {
  to: string
  subject: string
  html: string
}) {
  await sgMail.send({
    to,
    from: { email: "noreply@dumxi.com", name: "Dumxi" },
    replyTo: "soporte@dumxi.com",
    subject,
    html,
  })
}
