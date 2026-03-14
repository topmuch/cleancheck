import Resend from "resend"
import { db } from "../db"

// Types
type EmailTemplate = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

type ReminderData = {
  siteName: string
  siteAddress: string
  scheduledDate: Date
  duration: number
  assignedTo?: string
  notes?: string
}

type InvoiceData = {
  invoiceNumber: string
  clientName: string
  clientEmail: string
  amount: number
  dueDate: Date
  items: { description: string; quantity: number; unitPrice: number; total: number }[]
  agencyName: string
}

type QuoteData = {
  quoteNumber: string
  clientName: string
  clientEmail: string
  amount: number
  validUntil: Date
  items: { description: string; quantity: number; unitPrice: number; total: number }[]
  agencyName: string
}

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// ==================== EMAIL SENDING ====================

export async function sendEmail(data: EmailTemplate): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.log("📧 [DEV] Email simulé:")
    console.log(`   To: ${Array.isArray(data.to) ? data.to.join(", ") : data.to}`)
    console.log(`   Subject: ${data.subject}`)
    return { success: true, id: "dev-mode" }
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "CleanCheck <noreply@cleancheck.app>",
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      replyTo: data.replyTo
    })

    if (error) {
      console.error("Erreur Resend:", error)
      return { success: false, error: error.message }
    }

    return { success: true, id: result?.id }
  } catch (error: any) {
    console.error("Erreur envoi email:", error)
    return { success: false, error: error.message }
  }
}

// ==================== TEMPLATE HELPERS ====================

function getBaseStyles() {
  return `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); padding: 30px; text-align: center; }
      .header-logo { width: 50px; height: 50px; background-color: #ffffff; border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; }
      .header-logo span { font-size: 24px; font-weight: bold; color: #3B82F6; }
      .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
      .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
      .content { padding: 30px; }
      .info-box { background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
      .info-box h2 { margin: 0 0 10px; color: #059669; font-size: 18px; }
      .info-box p { margin: 0; color: #666; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 12px 0; border-bottom: 1px solid #eee; }
      td:first-child { color: #666; }
      td:last-child { text-align: right; font-weight: 600; }
      .highlight-box { background-color: #FFFBEB; border-radius: 8px; padding: 15px; margin-top: 20px; }
      .highlight-box p { margin: 0; color: #92400E; font-size: 14px; }
      .button { display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; }
      .footer { background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eee; }
      .footer p { margin: 0; color: #9ca3af; font-size: 12px; }
    </style>
  `
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(amount)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

// ==================== EMAIL TEMPLATES ====================

export function getReminderEmailTemplate(data: ReminderData, hoursBefore: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel de ménage - CleanCheck</title>
  ${getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo"><span>C</span></div>
      <h1>Rappel de Ménage</h1>
      <p>Dans ${hoursBefore} heure${hoursBefore > 1 ? "s" : ""}</p>
    </div>
    <div class="content">
      <div class="info-box">
        <h2>📍 ${data.siteName}</h2>
        ${data.siteAddress ? `<p>${data.siteAddress}</p>` : ""}
      </div>
      <table>
        <tr>
          <td>📅 Date & Heure</td>
          <td>${formatDate(data.scheduledDate)}</td>
        </tr>
        <tr>
          <td>⏱️ Durée prévue</td>
          <td>${data.duration} minutes</td>
        </tr>
        ${data.assignedTo ? `
        <tr>
          <td>👤 Assigné à</td>
          <td>${data.assignedTo}</td>
        </tr>
        ` : ""}
      </table>
      ${data.notes ? `
      <div class="highlight-box">
        <p>📝 <strong>Note:</strong> ${data.notes}</p>
      </div>
      ` : ""}
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Voir le calendrier</a>
      </div>
    </div>
    <div class="footer">
      <p>Cet email a été envoyé automatiquement par CleanCheck.<br>Ne répondez pas à cet email.</p>
    </div>
  </div>
</body>
</html>
  `
}

export function getInvoiceEmailTemplate(data: InvoiceData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="text-align: left; padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="text-align: center; padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">${formatCurrency(item.unitPrice)}</td>
      <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee; font-weight: 600;">${formatCurrency(item.total)}</td>
    </tr>
  `).join("")

  const total = data.items.reduce((sum, item) => sum + item.total, 0)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${data.invoiceNumber} - ${data.agencyName}</title>
  ${getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo"><span>C</span></div>
      <h1>Facture ${data.invoiceNumber}</h1>
      <p>${data.agencyName}</p>
    </div>
    <div class="content">
      <p style="margin-bottom: 20px;">Bonjour ${data.clientName},</p>
      <p style="margin-bottom: 20px;">Veuillez trouver ci-joint votre facture <strong>${data.invoiceNumber}</strong> d'un montant de <strong>${formatCurrency(total)}</strong>.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="text-align: left; padding: 10px;">Description</th>
            <th style="text-align: center; padding: 10px;">Qté</th>
            <th style="text-align: right; padding: 10px;">Prix unitaire</th>
            <th style="text-align: right; padding: 10px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; padding: 15px 10px; font-weight: 600;">Total TTC</td>
            <td style="text-align: right; padding: 15px 10px; font-size: 18px; font-weight: 700; color: #3B82F6;">${formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="info-box">
        <h2>💳 Règlement</h2>
        <p>Échéance: ${formatDate(data.dueDate)}</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/finance" class="button">Voir la facture</a>
      </div>
    </div>
    <div class="footer">
      <p>${data.agencyName}<br>Cet email a été envoyé via CleanCheck.</p>
    </div>
  </div>
</body>
</html>
  `
}

export function getQuoteEmailTemplate(data: QuoteData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="text-align: left; padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="text-align: center; padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">${formatCurrency(item.unitPrice)}</td>
      <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee; font-weight: 600;">${formatCurrency(item.total)}</td>
    </tr>
  `).join("")

  const total = data.items.reduce((sum, item) => sum + item.total, 0)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis ${data.quoteNumber} - ${data.agencyName}</title>
  ${getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);">
      <div class="header-logo"><span>C</span></div>
      <h1>Devis ${data.quoteNumber}</h1>
      <p>${data.agencyName}</p>
    </div>
    <div class="content">
      <p style="margin-bottom: 20px;">Bonjour ${data.clientName},</p>
      <p style="margin-bottom: 20px;">Merci de l'intérêt pour nos services. Veuillez trouver ci-joint votre devis <strong>${data.quoteNumber}</strong>.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="text-align: left; padding: 10px;">Description</th>
            <th style="text-align: center; padding: 10px;">Qté</th>
            <th style="text-align: right; padding: 10px;">Prix unitaire</th>
            <th style="text-align: right; padding: 10px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; padding: 15px 10px; font-weight: 600;">Total TTC</td>
            <td style="text-align: right; padding: 15px 10px; font-size: 18px; font-weight: 700; color: #8B5CF6;">${formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="info-box" style="background-color: #FEF3C7; border-left-color: #F59E0B;">
        <h2 style="color: #D97706;">⏰ Validité</h2>
        <p>Ce devis est valable jusqu'au ${formatDate(data.validUntil)}</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/finance" class="button" style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);">Accepter le devis</a>
      </div>
    </div>
    <div class="footer">
      <p>${data.agencyName}<br>Cet email a été envoyé via CleanCheck.</p>
    </div>
  </div>
</body>
</html>
  `
}

export function getWelcomeEmailTemplate(userName: string, agencyName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur CleanCheck</title>
  ${getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo"><span>C</span></div>
      <h1>Bienvenue sur CleanCheck !</h1>
      <p>Votre compte est prêt</p>
    </div>
    <div class="content">
      <p style="margin-bottom: 20px;">Bonjour ${userName},</p>
      <p style="margin-bottom: 20px;">Félicitations ! Votre compte ${agencyName ? `pour <strong>${agencyName}</strong>` : ""} a été créé avec succès.</p>
      
      <div class="info-box">
        <h2>🚀 Prochaines étapes</h2>
        <p>1. Créez vos premiers sites de nettoyage</p>
        <p>2. Générez les QR Codes pour chaque site</p>
        <p>3. Invitez vos employés à rejoindre votre équipe</p>
        <p>4. Planifiez vos premières missions</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Accéder au dashboard</a>
      </div>

      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          Besoin d'aide ? Contactez-nous à <a href="mailto:support@cleancheck.app" style="color: #3B82F6;">support@cleancheck.app</a>
        </p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} CleanCheck. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
  `
}

// ==================== EMAIL SENDING FUNCTIONS ====================

export async function sendReminderEmail(
  to: string,
  data: ReminderData,
  hoursBefore: number
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    subject: `🧹 Rappel: Ménage à ${data.siteName} dans ${hoursBefore}h`,
    html: getReminderEmailTemplate(data, hoursBefore)
  })
}

export async function sendInvoiceEmail(
  to: string,
  data: InvoiceData
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    subject: `📄 Facture ${data.invoiceNumber} - ${data.agencyName}`,
    html: getInvoiceEmailTemplate(data)
  })
}

export async function sendQuoteEmail(
  to: string,
  data: QuoteData
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    subject: `📋 Devis ${data.quoteNumber} - ${data.agencyName}`,
    html: getQuoteEmailTemplate(data)
  })
}

export async function sendWelcomeEmail(
  to: string,
  userName: string,
  agencyName?: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    subject: "🎉 Bienvenue sur CleanCheck !",
    html: getWelcomeEmailTemplate(userName, agencyName || "")
  })
}

export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    subject: "🧪 Email de test - CleanCheck",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  ${getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo"><span>C</span></div>
      <h1>Email de test</h1>
    </div>
    <div class="content">
      <p>✅ Félicitations ! Votre configuration email fonctionne correctement.</p>
      <p>Vous pouvez maintenant envoyer des notifications à vos clients et employés.</p>
    </div>
    <div class="footer">
      <p>CleanCheck - Test email</p>
    </div>
  </div>
</body>
</html>
    `
  })
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
