import { NextRequest, NextResponse } from "next/server"
import { getSessionsNeedingReminders, markReminderSent } from "@/actions/scheduled-session"
import { sendReminderEmail, logNotification } from "@/lib/email"

// Cette route est appelée par Vercel Cron ou un service externe
// Configurer dans vercel.json ou via Coolify

export async function GET(request: NextRequest) {
  // Vérifier le secret pour sécuriser la route
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("🔄 Début du job de rappels:", new Date().toISOString())

    // Récupérer les sessions nécessitant des rappels
    const { sessions24h, sessions1h } = await getSessionsNeedingReminders()

    const results = {
      reminders24h: { sent: 0, failed: 0 },
      reminders1h: { sent: 0, failed: 0 }
    }

    // Envoyer les rappels 24h
    for (const session of sessions24h) {
      const user = session.Site.User
      
      if (!user?.email) {
        console.log("⚠️ Pas d'email pour session:", session.id)
        continue
      }

      const emailResult = await sendReminderEmail(user.email, {
        siteName: session.Site.name,
        siteAddress: session.Site.address || "",
        scheduledDate: session.scheduledDate,
        duration: session.duration,
        assignedTo: session.assignedTo || undefined,
        notes: session.notes || undefined
      }, 24)

      if (emailResult.success) {
        await markReminderSent(session.id, "24h")
        await logNotification({
          userId: user.id,
          type: "EMAIL",
          subject: `Rappel 24h: Ménage à ${session.Site.name}`,
          message: `Rappel envoyé pour la session du ${session.scheduledDate}`,
          status: "SENT",
          scheduledFor: session.scheduledDate
        })
        results.reminders24h.sent++
      } else {
        await logNotification({
          userId: user.id,
          type: "EMAIL",
          subject: `Rappel 24h: Ménage à ${session.Site.name}`,
          message: `Échec de l'envoi`,
          status: "FAILED",
          scheduledFor: session.scheduledDate,
          error: emailResult.error
        })
        results.reminders24h.failed++
      }
    }

    // Envoyer les rappels 1h
    for (const session of sessions1h) {
      const user = session.Site.User
      
      if (!user?.email) {
        console.log("⚠️ Pas d'email pour session:", session.id)
        continue
      }

      const emailResult = await sendReminderEmail(user.email, {
        siteName: session.Site.name,
        siteAddress: session.Site.address || "",
        scheduledDate: session.scheduledDate,
        duration: session.duration,
        assignedTo: session.assignedTo || undefined,
        notes: session.notes || undefined
      }, 1)

      if (emailResult.success) {
        await markReminderSent(session.id, "1h")
        await logNotification({
          userId: user.id,
          type: "EMAIL",
          subject: `Rappel 1h: Ménage à ${session.Site.name}`,
          message: `Rappel envoyé pour la session du ${session.scheduledDate}`,
          status: "SENT",
          scheduledFor: session.scheduledDate
        })
        results.reminders1h.sent++
      } else {
        await logNotification({
          userId: user.id,
          type: "EMAIL",
          subject: `Rappel 1h: Ménage à ${session.Site.name}`,
          message: `Échec de l'envoi`,
          status: "FAILED",
          scheduledFor: session.scheduledDate,
          error: emailResult.error
        })
        results.reminders1h.failed++
      }
    }

    console.log("✅ Job terminé:", results)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error: any) {
    console.error("❌ Erreur job cron:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Configuration pour Vercel Cron (optionnel)
// Ajouter dans vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron",
//     "schedule": "0 * * * *"
//   }]
// }
