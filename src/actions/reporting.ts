"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns"

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId) {
      return null
    }

    const now = new Date()
    const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 })
    const endOfWeekDate = endOfWeek(now, { weekStartsOn: 1 })
    const startOfMonthDate = startOfMonth(now)
    const endOfMonthDate = endOfMonth(now)

    const [
      employeesCount,
      activeEmployees,
      clientsCount,
      activeClients,
      sitesCount,
      sessionsThisWeek,
      sessionsThisMonth,
      completedSessions,
      monthlyRevenue,
      pendingTasks
    ] = await Promise.all([
      db.employee.count({ where: { agencyId: user.agencyId } }),
      db.employee.count({ where: { agencyId: user.agencyId, status: "ACTIVE" } }),
      db.client.count({ where: { agencyId: user.agencyId } }),
      db.client.count({ where: { agencyId: user.agencyId, status: "ACTIVE" } }),
      db.site.count({ where: { agencyId: user.agencyId, isActive: true } }),
      db.cleaningSession.count({
        where: {
          Site: { agencyId: user.agencyId },
          scheduledStart: { gte: startOfWeekDate, lte: endOfWeekDate }
        }
      }),
      db.cleaningSession.count({
        where: {
          Site: { agencyId: user.agencyId },
          scheduledStart: { gte: startOfMonthDate, lte: endOfMonthDate }
        }
      }),
      db.cleaningSession.count({
        where: {
          Site: { agencyId: user.agencyId },
          status: "COMPLETED"
        }
      }),
      db.invoice.aggregate({
        where: {
          agencyId: user.agencyId,
          status: "PAID",
          paidDate: { gte: startOfMonthDate }
        },
        _sum: { total: true }
      }),
      db.scheduledSession.count({
        where: {
          Site: { agencyId: user.agencyId },
          status: "PENDING"
        }
      })
    ])

    return {
      employees: { total: employeesCount, active: activeEmployees },
      clients: { total: clientsCount, active: activeClients },
      sites: { total: sitesCount },
      sessions: {
        thisWeek: sessionsThisWeek,
        thisMonth: sessionsThisMonth,
        completed: completedSessions
      },
      revenue: {
        monthly: monthlyRevenue._sum.total || 0
      },
      pendingTasks
    }
  } catch (error) {
    console.error("Erreur récupération stats dashboard:", error)
    return null
  }
}

// ==================== REVENUE REPORTS ====================

export async function getRevenueReport(period: "week" | "month" | "year" = "month") {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId) {
      return null
    }

    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (period) {
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 })
        break
      case "month":
        startDate = startOfMonth(now)
        break
      case "year":
        startDate = startOfYear(now)
        break
    }

    // Revenus par période
    const invoices = await db.invoice.findMany({
      where: {
        agencyId: user.agencyId,
        status: "PAID",
        paidDate: { gte: startDate, lte: endDate }
      },
      select: {
        total: true,
        paidDate: true
      }
    })

    // Dépenses par période
    const expenses = await db.expense.findMany({
      where: {
        agencyId: user.agencyId,
        date: { gte: startDate, lte: endDate }
      },
      select: {
        amount: true,
        date: true,
        category: true
      }
    })

    // Grouper par mois/année
    const revenueByMonth: Record<string, number> = {}
    const expensesByMonth: Record<string, number> = {}

    invoices.forEach(invoice => {
      if (invoice.paidDate) {
        const key = format(invoice.paidDate, "yyyy-MM")
        revenueByMonth[key] = (revenueByMonth[key] || 0) + invoice.total
      }
    })

    expenses.forEach(expense => {
      const key = format(expense.date, "yyyy-MM")
      expensesByMonth[key] = (expensesByMonth[key] || 0) + expense.amount
    })

    const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const profit = totalRevenue - totalExpenses

    // Dépenses par catégorie
    const expensesByCategory: Record<string, number> = {}
    expenses.forEach(expense => {
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount
    })

    return {
      period,
      startDate,
      endDate,
      totalRevenue,
      totalExpenses,
      profit,
      revenueByMonth,
      expensesByMonth,
      expensesByCategory,
      invoiceCount: invoices.length
    }
  } catch (error) {
    console.error("Erreur rapport revenus:", error)
    return null
  }
}

// ==================== EMPLOYEE PERFORMANCE ====================

export async function getEmployeePerformanceReport(employeeId?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId) {
      return null
    }

    const startOfMonthDate = startOfMonth(new Date())

    const where: any = {
      agencyId: user.agencyId,
      isActive: true
    }

    if (employeeId) {
      where.id = employeeId
    }

    const employees = await db.employee.findMany({
      where,
      include: {
        Sessions: {
          where: {
            createdAt: { gte: startOfMonthDate }
          },
          select: {
            status: true,
            qualityScore: true,
            clientRating: true,
            durationMinutes: true
          }
        },
        TimeEntries: {
          where: {
            date: { gte: startOfMonthDate }
          },
          select: {
            totalMinutes: true
          }
        }
      }
    })

    const report = employees.map(emp => {
      const sessions = emp.Sessions
      const completed = sessions.filter(s => s.status === "COMPLETED").length
      const avgQuality = sessions.filter(s => s.qualityScore).reduce((sum, s) => sum + (s.qualityScore || 0), 0) / (sessions.filter(s => s.qualityScore).length || 1)
      const avgRating = sessions.filter(s => s.clientRating).reduce((sum, s) => sum + (s.clientRating || 0), 0) / (sessions.filter(s => s.clientRating).length || 1)
      const totalHours = emp.TimeEntries.reduce((sum, t) => sum + (t.totalMinutes || 0), 0) / 60

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        totalSessions: sessions.length,
        completedSessions: completed,
        completionRate: sessions.length > 0 ? (completed / sessions.length) * 100 : 0,
        avgQuality: avgQuality || 0,
        avgRating: avgRating || 0,
        totalHours,
        hourlyRate: emp.hourlyRate
      }
    })

    return report
  } catch (error) {
    console.error("Erreur rapport employés:", error)
    return null
  }
}

// ==================== CLIENT REPORTS ====================

export async function getClientReport() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId) {
      return null
    }

    const clients = await db.client.findMany({
      where: { agencyId: user.agencyId },
      include: {
        Sites: { select: { id: true } },
        Invoices: {
          where: { status: "PAID" },
          select: { total: true }
        },
        Contracts: {
          where: { status: "ACTIVE" },
          select: { price: true, frequency: true }
        }
      }
    })

    const report = clients.map(client => ({
      id: client.id,
      name: client.companyName || `${client.firstName} ${client.lastName}`,
      email: client.email,
      phone: client.phone,
      status: client.status,
      sitesCount: client.Sites.length,
      totalSpent: client.totalSpent,
      lastServiceDate: client.lastServiceDate,
      activeContracts: client.Contracts.length,
      monthlyValue: client.Contracts.reduce((sum, c) => sum + c.price, 0)
    }))

    // Stats globales
    const totalClients = clients.length
    const activeClients = clients.filter(c => c.status === "ACTIVE").length
    const prospects = clients.filter(c => c.status === "PROSPECT").length
    const lostClients = clients.filter(c => c.status === "LOST").length

    return {
      clients: report,
      stats: {
        total: totalClients,
        active: activeClients,
        prospects,
        lost: lostClients,
        retentionRate: totalClients > 0 ? (activeClients / totalClients) * 100 : 0
      }
    }
  } catch (error) {
    console.error("Erreur rapport clients:", error)
    return null
  }
}

// ==================== SESSION REPORTS ====================

export async function getSessionReport(period: "week" | "month" = "month") {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId) {
      return null
    }

    const now = new Date()
    const startDate = period === "week" 
      ? startOfWeek(now, { weekStartsOn: 1 })
      : startOfMonth(now)

    const sessions = await db.cleaningSession.findMany({
      where: {
        Site: { agencyId: user.agencyId },
        scheduledStart: { gte: startDate }
      },
      include: {
        Site: { select: { name: true } },
        Employee: { select: { firstName: true, lastName: true } }
      }
    })

    const byStatus = {
      scheduled: sessions.filter(s => s.status === "SCHEDULED").length,
      inProgress: sessions.filter(s => s.status === "IN_PROGRESS").length,
      completed: sessions.filter(s => s.status === "COMPLETED").length,
      cancelled: sessions.filter(s => s.status === "CANCELLED").length,
      noShow: sessions.filter(s => s.status === "NO_SHOW").length
    }

    const avgDuration = sessions
      .filter(s => s.durationMinutes)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / (sessions.filter(s => s.durationMinutes).length || 1)

    const avgQuality = sessions
      .filter(s => s.qualityScore)
      .reduce((sum, s) => sum + (s.qualityScore || 0), 0) / (sessions.filter(s => s.qualityScore).length || 1)

    // Sessions par jour
    const byDay: Record<string, number> = {}
    sessions.forEach(s => {
      if (s.scheduledStart) {
        const key = format(s.scheduledStart, "yyyy-MM-dd")
        byDay[key] = (byDay[key] || 0) + 1
      }
    })

    return {
      period,
      startDate,
      total: sessions.length,
      byStatus,
      avgDuration: avgDuration || 0,
      avgQuality: avgQuality || 0,
      byDay,
      sessions: sessions.slice(0, 50) // Limiter pour l'affichage
    }
  } catch (error) {
    console.error("Erreur rapport sessions:", error)
    return null
  }
}

// ==================== EXPORT ====================

export async function exportReport(type: "revenue" | "clients" | "employees" | "sessions", format: "json" | "csv" = "json") {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    let data: any

    switch (type) {
      case "revenue":
        data = await getRevenueReport("year")
        break
      case "clients":
        data = await getClientReport()
        break
      case "employees":
        data = await getEmployeePerformanceReport()
        break
      case "sessions":
        data = await getSessionReport("month")
        break
    }

    if (format === "csv") {
      // Convertir en CSV (simplifié)
      return { data, format: "csv" }
    }

    return { data, format: "json" }
  } catch (error) {
    console.error("Erreur export:", error)
    return null
  }
}
