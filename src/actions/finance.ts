"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { format } from "date-fns"

// ==================== QUOTES ====================

function generateQuoteNumber(count: number): string {
  const year = new Date().getFullYear()
  const num = String(count).padStart(4, "0")
  return `DEV-${year}-${num}`
}

export async function createQuote(data: {
  clientId: string
  siteId?: string
  validUntil: Date
  items: {
    description: string
    quantity: number
    unit?: string
    unitPrice: number
    taxRate?: number
  }[]
  discount?: number
  notes?: string
  terms?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId) {
      return { error: "Aucune agence associée" }
    }

    // Compter les devis existants pour générer le numéro
    const count = await db.quote.count({ where: { agencyId: user.agencyId } })
    const number = generateQuoteNumber(count + 1)

    // Calculer les totaux
    let subtotal = 0
    let tax = 0
    const itemsData = data.items.map(item => {
      const total = item.quantity * item.unitPrice
      subtotal += total
      if (item.taxRate) {
        tax += total * (item.taxRate / 100)
      }
      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || "heure",
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 20,
        total
      }
    })

    const total = subtotal + tax - (data.discount || 0)

    const quote = await db.quote.create({
      data: {
        agencyId: user.agencyId,
        clientId: data.clientId,
        siteId: data.siteId,
        number,
        validUntil: data.validUntil,
        subtotal,
        tax,
        discount: data.discount || 0,
        total,
        notes: data.notes,
        terms: data.terms,
        Items: {
          create: itemsData
        }
      },
      include: {
        Items: true,
        Client: true,
        Site: true
      }
    })

    revalidatePath("/dashboard/finance")
    revalidatePath(`/dashboard/clients/${data.clientId}`)
    
    return { success: true, data: quote }
  } catch (error) {
    console.error("Erreur création devis:", error)
    return { error: "Erreur lors de la création" }
  }
}

export async function getQuotes(filters?: {
  status?: string
  clientId?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId) {
      return []
    }

    const where: any = { agencyId: user.agencyId }

    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    return await db.quote.findMany({
      where,
      include: {
        Client: { select: { firstName: true, lastName: true, companyName: true } },
        Site: { select: { name: true } },
        Items: true,
        _count: { select: { Items: true } }
      },
      orderBy: { createdAt: "desc" }
    })
  } catch (error) {
    console.error("Erreur récupération devis:", error)
    return []
  }
}

export async function updateQuoteStatus(id: string, status: string, rejectionReason?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const updateData: any = { status }
    
    if (status === "ACCEPTED") {
      updateData.acceptedAt = new Date()
    } else if (status === "REJECTED") {
      updateData.rejectedAt = new Date()
      updateData.rejectionReason = rejectionReason
    }

    const quote = await db.quote.update({
      where: { id },
      data: updateData
    })

    revalidatePath("/dashboard/finance")
    
    return { success: true, data: quote }
  } catch (error) {
    console.error("Erreur mise à jour devis:", error)
    return { error: "Erreur lors de la mise à jour" }
  }
}

export async function convertQuoteToInvoice(quoteId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const quote = await db.quote.findUnique({
      where: { id: quoteId },
      include: { Items: true }
    })

    if (!quote) {
      return { error: "Devis non trouvé" }
    }

    // Vérifier qu'une facture n'existe pas déjà
    const existingInvoice = await db.invoice.findUnique({
      where: { quoteId }
    })

    if (existingInvoice) {
      return { error: "Une facture existe déjà pour ce devis" }
    }

    // Générer le numéro de facture
    const count = await db.invoice.count({ where: { agencyId: quote.agencyId } })
    const number = generateInvoiceNumber(count + 1)

    // Date d'échéance (30 jours)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const invoice = await db.invoice.create({
      data: {
        agencyId: quote.agencyId,
        clientId: quote.clientId,
        siteId: quote.siteId,
        quoteId: quote.id,
        number,
        dueDate,
        subtotal: quote.subtotal,
        tax: quote.tax,
        discount: quote.discount,
        total: quote.total,
        notes: quote.notes,
        terms: quote.terms,
        status: "DRAFT",
        Items: {
          create: quote.Items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            total: item.total
          }))
        }
      }
    })

    // Mettre à jour le statut du devis
    await db.quote.update({
      where: { id: quoteId },
      data: { status: "ACCEPTED", acceptedAt: new Date() }
    })

    revalidatePath("/dashboard/finance")
    
    return { success: true, data: invoice }
  } catch (error) {
    console.error("Erreur conversion devis:", error)
    return { error: "Erreur lors de la conversion" }
  }
}

// ==================== INVOICES ====================

function generateInvoiceNumber(count: number): string {
  const year = new Date().getFullYear()
  const num = String(count).padStart(4, "0")
  return `FAC-${year}-${num}`
}

export async function createInvoice(data: {
  clientId: string
  siteId?: string
  dueDate: Date
  items: {
    description: string
    quantity: number
    unit?: string
    unitPrice: number
    taxRate?: number
  }[]
  discount?: number
  notes?: string
  terms?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId) {
      return { error: "Aucune agence associée" }
    }

    // Compter les factures existantes
    const count = await db.invoice.count({ where: { agencyId: user.agencyId } })
    const number = generateInvoiceNumber(count + 1)

    // Calculer les totaux
    let subtotal = 0
    let tax = 0
    const itemsData = data.items.map(item => {
      const total = item.quantity * item.unitPrice
      subtotal += total
      if (item.taxRate) {
        tax += total * (item.taxRate / 100)
      }
      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || "heure",
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 20,
        total
      }
    })

    const total = subtotal + tax - (data.discount || 0)

    const invoice = await db.invoice.create({
      data: {
        agencyId: user.agencyId,
        clientId: data.clientId,
        siteId: data.siteId,
        number,
        dueDate: data.dueDate,
        subtotal,
        tax,
        discount: data.discount || 0,
        total,
        notes: data.notes,
        terms: data.terms,
        Items: {
          create: itemsData
        }
      },
      include: {
        Items: true,
        Client: true
      }
    })

    revalidatePath("/dashboard/finance")
    
    return { success: true, data: invoice }
  } catch (error) {
    console.error("Erreur création facture:", error)
    return { error: "Erreur lors de la création" }
  }
}

export async function getInvoices(filters?: {
  status?: string
  clientId?: string
  overdue?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId) {
      return []
    }

    const where: any = { agencyId: user.agencyId }

    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.clientId) {
      where.clientId = filters.clientId
    }
    if (filters?.overdue) {
      where.status = "SENT"
      where.dueDate = { lt: new Date() }
    }

    return await db.invoice.findMany({
      where,
      include: {
        Client: { select: { firstName: true, lastName: true, companyName: true } },
        Site: { select: { name: true } },
        Items: true,
        _count: { select: { Sessions: true } }
      },
      orderBy: { createdAt: "desc" }
    })
  } catch (error) {
    console.error("Erreur récupération factures:", error)
    return []
  }
}

export async function updateInvoiceStatus(id: string, data: {
  status: string
  paymentMethod?: string
  paymentRef?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const updateData: any = { status: data.status }
    
    if (data.status === "PAID") {
      updateData.paidDate = new Date()
      updateData.paymentMethod = data.paymentMethod
      updateData.paymentRef = data.paymentRef
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: { Client: true }
    })

    // Mettre à jour le total dépensé du client
    if (data.status === "PAID" && invoice.clientId) {
      await db.client.update({
        where: { id: invoice.clientId },
        data: {
          totalSpent: { increment: invoice.total },
          lastServiceDate: new Date()
        }
      })
    }

    revalidatePath("/dashboard/finance")
    
    return { success: true, data: invoice }
  } catch (error) {
    console.error("Erreur mise à jour facture:", error)
    return { error: "Erreur lors de la mise à jour" }
  }
}

export async function sendInvoiceReminder(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const invoice = await db.invoice.update({
      where: { id },
      data: {
        reminderSent: { increment: 1 }
      }
    })

    // TODO: Envoyer l'email de rappel via Resend

    revalidatePath("/dashboard/finance")
    
    return { success: true, message: "Rappel envoyé" }
  } catch (error) {
    console.error("Erreur envoi rappel:", error)
    return { error: "Erreur lors de l'envoi" }
  }
}

// ==================== EXPENSES ====================

export async function createExpense(data: {
  category: string
  description: string
  amount: number
  date: Date
  receiptUrl?: string
  isRecurring?: boolean
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId) {
      return { error: "Aucune agence associée" }
    }

    const expense = await db.expense.create({
      data: {
        agencyId: user.agencyId,
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: data.date,
        receiptUrl: data.receiptUrl,
        isRecurring: data.isRecurring || false,
        notes: data.notes
      }
    })

    revalidatePath("/dashboard/finance")
    
    return { success: true, data: expense }
  } catch (error) {
    console.error("Erreur création dépense:", error)
    return { error: "Erreur lors de la création" }
  }
}

export async function getExpenses(filters?: {
  category?: string
  startDate?: Date
  endDate?: Date
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user?.agencyId) {
      return []
    }

    const where: any = { agencyId: user.agencyId }

    if (filters?.category) {
      where.category = filters.category
    }
    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) where.date.gte = filters.startDate
      if (filters.endDate) where.date.lte = filters.endDate
    }

    return await db.expense.findMany({
      where,
      orderBy: { date: "desc" }
    })
  } catch (error) {
    console.error("Erreur récupération dépenses:", error)
    return []
  }
}

// ==================== STATS ====================

export async function getFinanceStats() {
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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      pendingInvoices,
      overdueInvoices,
      totalExpenses,
      monthlyExpenses,
      pendingQuotes
    ] = await Promise.all([
      db.invoice.aggregate({
        where: { agencyId: user.agencyId, status: "PAID" },
        _sum: { total: true }
      }),
      db.invoice.aggregate({
        where: {
          agencyId: user.agencyId,
          status: "PAID",
          paidDate: { gte: startOfMonth }
        },
        _sum: { total: true }
      }),
      db.invoice.aggregate({
        where: {
          agencyId: user.agencyId,
          status: "PAID",
          paidDate: { gte: startOfLastMonth, lte: endOfLastMonth }
        },
        _sum: { total: true }
      }),
      db.invoice.aggregate({
        where: { agencyId: user.agencyId, status: "SENT" },
        _sum: { total: true }
      }),
      db.invoice.count({
        where: {
          agencyId: user.agencyId,
          status: "SENT",
          dueDate: { lt: now }
        }
      }),
      db.expense.aggregate({
        where: { agencyId: user.agencyId },
        _sum: { amount: true }
      }),
      db.expense.aggregate({
        where: {
          agencyId: user.agencyId,
          date: { gte: startOfMonth }
        },
        _sum: { amount: true }
      }),
      db.quote.count({
        where: { agencyId: user.agencyId, status: "SENT" }
      })
    ])

    return {
      totalRevenue: totalRevenue._sum.total || 0,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      lastMonthRevenue: lastMonthRevenue._sum.total || 0,
      pendingInvoices: pendingInvoices._sum.total || 0,
      overdueInvoices,
      totalExpenses: totalExpenses._sum.amount || 0,
      monthlyExpenses: monthlyExpenses._sum.amount || 0,
      pendingQuotes,
      profit: (monthlyRevenue._sum.total || 0) - (monthlyExpenses._sum.amount || 0)
    }
  } catch (error) {
    console.error("Erreur récupération stats finance:", error)
    return null
  }
}
