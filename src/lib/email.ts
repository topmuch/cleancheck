import Resend from "resend"
import { db } from "./db"

// Initialiser Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Types
type EmailTemplate = {
  to: string
  subject: string
  html: string
  text?: string
}

type ReminderData = {
  siteName: string
  siteAddress: string
  scheduledDate: Date
  duration: number
  assignedTo?: string
  notes?: string
}

// ==================== EMAIL TEMPLATES ====================

function getReminderEmailHtml(data: ReminderData, hoursBefore: number): string {
  const formattedDate = data.scheduledDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel de ménage - CleanCheck</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); padding: 30px; text-align: center;">
      <div style="width: 50px; height: 50px; background-color: #ffffff; border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 24px; font-weight: bold; color: #3B82F6;">C</span>
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Rappel de Ménage</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Dans ${hoursBefore} heure${hoursBefore > 1 ? "s" : ""}</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
        <h2 style="margin: 0 0 10px; color: #059669; font-size: 18px;">📍 ${data.siteName}</h2>
        ${data.siteAddress ? `<p style="margin: 0; color: #666;">${data.siteAddress}</p>` : ""}
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">📅 Date & Heure</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">⏱️ Durée prévue</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${data.duration} minutes</td>
        </tr>
        ${data.assignedTo ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">👤 Assigné à</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${data.assignedTo}</td>
        </tr>
        ` : ""}
      </table>

      ${data.notes ? `
      <div style="background-color: #FFFBEB; border-radius: 8px; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; color: #92400E; font-size: 14px;">📝 <strong>Note:</strong> ${data.notes}</p>
      </div>
      ` : ""}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600;">
          Voir le calendrier
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        Cet email a été envoyé automatiquement par CleanCheck.
        <br>Ne répondez pas à cet email.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

function getReminderEmailText(data: ReminderData, hoursBefore: number): string {
  const formattedDate = data.scheduledDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  return `
RAPPEL DE MÉNAGE - CleanCheck
Dans ${hoursBefore} heure${hoursBefore > 1 ? "s" : ""}

📍 Site: ${data.siteName}
${data.siteAddress ? `   Adresse: ${data.siteAddress}` : ""}

📅 Date & Heure: ${formattedDate}
⏱️ Durée prévue: ${data.duration} minutes
${data.assignedTo ? `👤 Assigné à: ${data.assignedTo}` : ""}
${data.notes ? `📝 Note: ${data.notes}` : ""}

Consultez votre calendrier: ${process.env.NEXTAUTH_URL}/dashboard

---
Cet email a été envoyé automatiquement par CleanCheck.
  `.trim()
}

// ==================== SEND FUNCTIONS ====================

export async function sendReminderEmail(
  to: string,
  data: ReminderData,
  hoursBefore: number
): Promise<{ success: boolean; error?: string }> {
  // Si pas de clé API Resend, simuler l'envoi
  if (!process.env.RESEND_API_KEY) {
    console.log("📧 [DEV] Email simulé:")
    console.log(`   To: ${to}`)
    console.log(`   Subject: Rappel: Ménage à ${data.siteName} dans ${hoursBefore}h`)
    return { success: true }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "CleanCheck <noreply@cleancheck.app>",
      to,
      subject: `🧹 Rappel: Ménage à ${data.siteName} dans ${hoursBefore}h`,
      html: getReminderEmailHtml(data, hoursBefore),
      text: getReminderEmailText(data, hoursBefore)
    })

    if (error) {
      console.error("Erreur Resend:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Email envoyé:", result?.id)
    return { success: true }
  } catch (error: any) {
    console.error("Erreur envoi email:", error)
    return { success: false, error: error.message }
  }
}

export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  const testData: ReminderData = {
    siteName: "Bureau Test",
    siteAddress: "123 Rue de Test, Paris",
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    duration: 60,
    assignedTo: "Marie Dupont",
    notes: "Ceci est un email de test"
  }

  return sendReminderEmail(to, testData, 24)
}

// ==================== NOTIFICATION LOGGING ====================

export async function logNotification(data: {
  userId: string
  type: "EMAIL" | "SMS" | "WHATSAPP"
  subject: string
  message: string
  status: "PENDING" | "SENT" | "FAILED"
  scheduledFor: Date
  error?: string
}) {
  try {
    await db.notification.create({
      data: {
        ...data,
        sentAt: data.status === "SENT" ? new Date() : null
      }
    })
  } catch (error) {
    console.error("Erreur log notification:", error)
  }
}

export async function getNotificationHistory(userId: string, limit: number = 50) {
  try {
    return await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit
    })
  } catch (error) {
    console.error("Erreur récupération notifications:", error)
    return []
  }
}
