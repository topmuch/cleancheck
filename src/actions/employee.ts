"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

// ==================== EMPLOYEE CRUD ====================

export async function createEmployee(data: {
  firstName: string
  lastName: string
  email?: string
  phone: string
  address?: string
  birthDate?: Date
  hireDate?: Date
  hourlyRate?: number
  monthlySalary?: number
  skills?: string[]
  languages?: string[]
  emergencyContact?: string
  emergencyPhone?: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { Agency: true }
    })

    if (!user?.agencyId && user?.role !== "AGENCY" && user?.role !== "MANAGER") {
      return { error: "Accès refusé" }
    }

    const agencyId = user.agencyId || user.Agency?.id
    if (!agencyId) {
      return { error: "Aucune agence associée" }
    }

    const employee = await db.employee.create({
      data: {
        agencyId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        birthDate: data.birthDate,
        hireDate: data.hireDate || new Date(),
        hourlyRate: data.hourlyRate,
        monthlySalary: data.monthlySalary,
        skills: data.skills ? JSON.stringify(data.skills) : null,
        languages: data.languages ? JSON.stringify(data.languages) : null,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        notes: data.notes,
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/employees")
    
    return { success: true, data: employee }
  } catch (error) {
    console.error("Erreur création employé:", error)
    return { error: "Erreur lors de la création" }
  }
}

export async function getEmployees(filters?: {
  status?: string
  search?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId && user?.role !== "SUPERADMIN") {
      return []
    }

    const where: any = { agencyId: user.agencyId }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } }
      ]
    }

    const employees = await db.employee.findMany({
      where,
      include: {
        _count: {
          select: { Sessions: true }
        }
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    })

    return employees
  } catch (error) {
    console.error("Erreur récupération employés:", error)
    return []
  }
}

export async function getEmployee(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        Availabilities: true,
        Documents: true,
        Leaves: {
          orderBy: { startDate: "desc" },
          take: 10
        },
        TimeEntries: {
          orderBy: { date: "desc" },
          take: 20
        },
        Sessions: {
          include: {
            Site: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 20
        },
        _count: {
          select: { Sessions: true, TimeEntries: true }
        }
      }
    })

    return employee
  } catch (error) {
    console.error("Erreur récupération employé:", error)
    return null
  }
}

export async function updateEmployee(id: string, data: {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  hourlyRate?: number
  monthlySalary?: number
  skills?: string[]
  languages?: string[]
  status?: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const updateData: any = { ...data }
    if (data.skills) {
      updateData.skills = JSON.stringify(data.skills)
    }
    if (data.languages) {
      updateData.languages = JSON.stringify(data.languages)
    }

    const employee = await db.employee.update({
      where: { id },
      data: updateData
    })

    revalidatePath("/dashboard/employees")
    revalidatePath(`/dashboard/employees/${id}`)
    
    return { success: true, data: employee }
  } catch (error) {
    console.error("Erreur mise à jour employé:", error)
    return { error: "Erreur lors de la mise à jour" }
  }
}

export async function deleteEmployee(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    await db.employee.update({
      where: { id },
      data: { isActive: false, status: "TERMINATED" }
    })

    revalidatePath("/dashboard/employees")
    
    return { success: true }
  } catch (error) {
    console.error("Erreur suppression employé:", error)
    return { error: "Erreur lors de la suppression" }
  }
}

// ==================== AVAILABILITY ====================

export async function setAvailability(data: {
  employeeId: string
  dayOfWeek: number // 0-6
  startTime: string
  endTime: string
  isAvailable: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const availability = await db.availability.upsert({
      where: {
        employeeId_dayOfWeek: {
          employeeId: data.employeeId,
          dayOfWeek: data.dayOfWeek
        }
      },
      update: {
        startTime: data.startTime,
        endTime: data.endTime,
        isAvailable: data.isAvailable
      },
      create: {
        employeeId: data.employeeId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isAvailable: data.isAvailable
      }
    })

    revalidatePath(`/dashboard/employees/${data.employeeId}`)
    
    return { success: true, data: availability }
  } catch (error) {
    console.error("Erreur définition disponibilité:", error)
    return { error: "Erreur lors de la définition" }
  }
}

export async function getEmployeeAvailability(employeeId: string) {
  try {
    return await db.availability.findMany({
      where: { employeeId },
      orderBy: { dayOfWeek: "asc" }
    })
  } catch (error) {
    console.error("Erreur récupération disponibilités:", error)
    return []
  }
}

// ==================== LEAVES ====================

export async function createLeave(data: {
  employeeId: string
  type: string
  startDate: Date
  endDate: Date
  reason?: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const leave = await db.leave.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        notes: data.notes
      }
    })

    revalidatePath(`/dashboard/employees/${data.employeeId}`)
    
    return { success: true, data: leave }
  } catch (error) {
    console.error("Erreur création congé:", error)
    return { error: "Erreur lors de la création" }
  }
}

export async function updateLeaveStatus(id: string, status: "APPROVED" | "REJECTED") {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const leave = await db.leave.update({
      where: { id },
      data: {
        status,
        approvedBy: session.user.id
      }
    })

    revalidatePath(`/dashboard/employees/${leave.employeeId}`)
    
    return { success: true, data: leave }
  } catch (error) {
    console.error("Erreur mise à jour congé:", error)
    return { error: "Erreur lors de la mise à jour" }
  }
}

// ==================== DOCUMENTS ====================

export async function addEmployeeDocument(data: {
  employeeId: string
  type: string
  name: string
  fileUrl: string
  expiryDate?: Date
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const document = await db.employeeDocument.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        name: data.name,
        fileUrl: data.fileUrl,
        expiryDate: data.expiryDate,
        notes: data.notes
      }
    })

    revalidatePath(`/dashboard/employees/${data.employeeId}`)
    
    return { success: true, data: document }
  } catch (error) {
    console.error("Erreur ajout document:", error)
    return { error: "Erreur lors de l'ajout" }
  }
}

export async function verifyDocument(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const document = await db.employeeDocument.update({
      where: { id },
      data: { isVerified: true }
    })

    revalidatePath(`/dashboard/employees/${document.employeeId}`)
    
    return { success: true, data: document }
  } catch (error) {
    console.error("Erreur vérification document:", error)
    return { error: "Erreur lors de la vérification" }
  }
}

// ==================== TIME ENTRIES ====================

export async function clockIn(employeeId: string, location?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Vérifier s'il y a déjà une entrée ouverte
    const openEntry = await db.timeEntry.findFirst({
      where: {
        employeeId,
        clockOut: null
      }
    })

    if (openEntry) {
      return { error: "Une entrée est déjà ouverte" }
    }

    const entry = await db.timeEntry.create({
      data: {
        employeeId,
        date: today,
        clockIn: new Date(),
        location
      }
    })

    return { success: true, data: entry }
  } catch (error) {
    console.error("Erreur pointage entrée:", error)
    return { error: "Erreur lors du pointage" }
  }
}

export async function clockOut(employeeId: string, notes?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const openEntry = await db.timeEntry.findFirst({
      where: {
        employeeId,
        clockOut: null
      }
    })

    if (!openEntry) {
      return { error: "Aucune entrée ouverte trouvée" }
    }

    const clockOut = new Date()
    const totalMinutes = Math.round((clockOut.getTime() - openEntry.clockIn.getTime()) / 60000)

    const entry = await db.timeEntry.update({
      where: { id: openEntry.id },
      data: {
        clockOut,
        totalMinutes,
        notes
      }
    })

    return { success: true, data: entry }
  } catch (error) {
    console.error("Erreur pointage sortie:", error)
    return { error: "Erreur lors du pointage" }
  }
}

export async function getTimeEntries(employeeId: string, startDate?: Date, endDate?: Date) {
  try {
    const where: any = { employeeId }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    return await db.timeEntry.findMany({
      where,
      orderBy: { date: "desc" }
    })
  } catch (error) {
    console.error("Erreur récupération pointages:", error)
    return []
  }
}

// ==================== PERFORMANCE ====================

export async function getEmployeePerformance(employeeId: string) {
  try {
    const sessions = await db.cleaningSession.findMany({
      where: { employeeId },
      select: {
        status: true,
        qualityScore: true,
        clientRating: true,
        durationMinutes: true,
        scheduledStart: true,
        actualStart: true
      }
    })

    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.status === "COMPLETED").length
    const avgQuality = sessions.filter(s => s.qualityScore).reduce((acc, s) => acc + (s.qualityScore || 0), 0) / (sessions.filter(s => s.qualityScore).length || 1)
    const avgRating = sessions.filter(s => s.clientRating).reduce((acc, s) => acc + (s.clientRating || 0), 0) / (sessions.filter(s => s.clientRating).length || 1)
    const avgDuration = sessions.filter(s => s.durationMinutes).reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / (sessions.filter(s => s.durationMinutes).length || 1)
    
    // Calculer le taux de ponctualité
    const onTimeSessions = sessions.filter(s => {
      if (!s.scheduledStart || !s.actualStart) return false
      const diff = (s.actualStart.getTime() - s.scheduledStart.getTime()) / 60000
      return diff <= 15 // 15 min de tolérance
    }).length
    const punctualityRate = completedSessions > 0 ? (onTimeSessions / completedSessions) * 100 : 0

    return {
      totalSessions,
      completedSessions,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      avgQuality: avgQuality || 0,
      avgRating: avgRating || 0,
      avgDuration: avgDuration || 0,
      punctualityRate
    }
  } catch (error) {
    console.error("Erreur calcul performance:", error)
    return null
  }
}
