"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { addDays, addWeeks, addMonths } from "date-fns"

// Types
export type Frequency = "NONE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY"
export type ScheduledStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

// ==================== CREATE ====================

export async function createScheduledSession(data: {
  siteId: string
  scheduledDate: Date
  duration?: number
  frequency?: Frequency
  assignedTo?: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    // Vérifier que le site appartient à l'utilisateur
    const site = await db.site.findFirst({
      where: { id: data.siteId, userId: session.user.id }
    })

    if (!site) {
      return { error: "Site non trouvé" }
    }

    const scheduledSession = await db.scheduledSession.create({
      data: {
        siteId: data.siteId,
        scheduledDate: data.scheduledDate,
        duration: data.duration || 60,
        frequency: data.frequency || "NONE",
        assignedTo: data.assignedTo,
        notes: data.notes,
        status: "PENDING",
      }
    })

    // Si récurrent, créer les prochaines sessions
    if (data.frequency && data.frequency !== "NONE") {
      await createRecurringSessions(scheduledSession.id, data)
    }

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/site/${data.siteId}`)
    
    return { success: true, data: scheduledSession }
  } catch (error) {
    console.error("Erreur création session planifiée:", error)
    return { error: "Erreur lors de la création" }
  }
}

// ==================== READ ====================

export async function getScheduledSessions(siteId?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const where: any = {}
    
    if (siteId) {
      where.siteId = siteId
    } else {
      // Récupérer les sites de l'utilisateur
      const sites = await db.site.findMany({
        where: { userId: session.user.id },
        select: { id: true }
      })
      where.siteId = { in: sites.map(s => s.id) }
    }

    const sessions = await db.scheduledSession.findMany({
      where,
      include: {
        Site: {
          select: { name: true, address: true }
        }
      },
      orderBy: { scheduledDate: "asc" }
    })

    return sessions
  } catch (error) {
    console.error("Erreur récupération sessions:", error)
    return []
  }
}

export async function getScheduledSessionsByDateRange(startDate: Date, endDate: Date) {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const sites = await db.site.findMany({
      where: { userId: session.user.id },
      select: { id: true }
    })

    const sessions = await db.scheduledSession.findMany({
      where: {
        siteId: { in: sites.map(s => s.id) },
        scheduledDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        Site: {
          select: { name: true, address: true, pinCode: true }
        }
      },
      orderBy: { scheduledDate: "asc" }
    })

    return sessions
  } catch (error) {
    console.error("Erreur récupération sessions par date:", error)
    return []
  }
}

export async function getUpcomingSessions(hours: number = 24) {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const now = new Date()
    const futureDate = new Date(now.getTime() + hours * 60 * 60 * 1000)

    const sites = await db.site.findMany({
      where: { userId: session.user.id },
      select: { id: true }
    })

    const sessions = await db.scheduledSession.findMany({
      where: {
        siteId: { in: sites.map(s => s.id) },
        scheduledDate: {
          gte: now,
          lte: futureDate
        },
        status: "PENDING"
      },
      include: {
        Site: {
          select: { name: true, address: true }
        }
      },
      orderBy: { scheduledDate: "asc" }
    })

    return sessions
  } catch (error) {
    console.error("Erreur récupération sessions à venir:", error)
    return []
  }
}

// ==================== UPDATE ====================

export async function updateScheduledSession(
  id: string,
  data: {
    scheduledDate?: Date
    duration?: number
    frequency?: Frequency
    assignedTo?: string
    notes?: string
    status?: ScheduledStatus
  }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const existing = await db.scheduledSession.findUnique({
      where: { id },
      include: { Site: true }
    })

    if (!existing || existing.Site.userId !== session.user.id) {
      return { error: "Session non trouvée" }
    }

    const updated = await db.scheduledSession.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/site/${existing.siteId}`)
    
    return { success: true, data: updated }
  } catch (error) {
    console.error("Erreur mise à jour session:", error)
    return { error: "Erreur lors de la mise à jour" }
  }
}

export async function markReminderSent(id: string, type: "24h" | "1h") {
  try {
    const updateData = type === "24h" 
      ? { reminderSent: true }
      : { reminder1hSent: true }

    await db.scheduledSession.update({
      where: { id },
      data: updateData
    })

    return { success: true }
  } catch (error) {
    console.error("Erreur marquage rappel:", error)
    return { error: "Erreur" }
  }
}

// ==================== DELETE ====================

export async function deleteScheduledSession(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const existing = await db.scheduledSession.findUnique({
      where: { id },
      include: { Site: true }
    })

    if (!existing || existing.Site.userId !== session.user.id) {
      return { error: "Session non trouvée" }
    }

    await db.scheduledSession.delete({
      where: { id }
    })

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/site/${existing.siteId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Erreur suppression session:", error)
    return { error: "Erreur lors de la suppression" }
  }
}

// ==================== HELPERS ====================

async function createRecurringSessions(
  parentId: string,
  data: {
    siteId: string
    scheduledDate: Date
    duration: number
    frequency: Frequency
    assignedTo?: string
    notes?: string
  }
) {
  // Créer les 12 prochaines occurrences
  const occurrences = 12
  const sessions = []

  for (let i = 1; i <= occurrences; i++) {
    let nextDate: Date

    switch (data.frequency) {
      case "DAILY":
        nextDate = addDays(data.scheduledDate, i)
        break
      case "WEEKLY":
        nextDate = addWeeks(data.scheduledDate, i)
        break
      case "BIWEEKLY":
        nextDate = addWeeks(data.scheduledDate, i * 2)
        break
      case "MONTHLY":
        nextDate = addMonths(data.scheduledDate, i)
        break
      default:
        continue
    }

    sessions.push({
      siteId: data.siteId,
      scheduledDate: nextDate,
      duration: data.duration,
      frequency: data.frequency,
      assignedTo: data.assignedTo,
      notes: data.notes,
      status: "PENDING" as ScheduledStatus
    })
  }

  if (sessions.length > 0) {
    await db.scheduledSession.createMany({ data: sessions })
  }
}

// ==================== FOR CRON JOBS ====================

export async function getSessionsNeedingReminders() {
  const now = new Date()
  
  // Sessions dans 24h (±30 min)
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in24hMin = new Date(in24h.getTime() - 30 * 60 * 1000)
  const in24hMax = new Date(in24h.getTime() + 30 * 60 * 1000)

  // Sessions dans 1h (±15 min)
  const in1h = new Date(now.getTime() + 60 * 60 * 1000)
  const in1hMin = new Date(in1h.getTime() - 15 * 60 * 1000)
  const in1hMax = new Date(in1h.getTime() + 15 * 60 * 1000)

  const [sessions24h, sessions1h] = await Promise.all([
    db.scheduledSession.findMany({
      where: {
        scheduledDate: { gte: in24hMin, lte: in24hMax },
        reminderSent: false,
        status: "PENDING"
      },
      include: { Site: { include: { User: true } } }
    }),
    db.scheduledSession.findMany({
      where: {
        scheduledDate: { gte: in1hMin, lte: in1hMax },
        reminder1hSent: false,
        status: "PENDING"
      },
      include: { Site: { include: { User: true } } }
    })
  ])

  return { sessions24h, sessions1h }
}
