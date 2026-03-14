"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

// ==================== CLIENT CRUD ====================

export async function createClient(data: {
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone: string
  phone2?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  notes?: string
  source?: string
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

    const client = await db.client.create({
      data: {
        agencyId: user.agencyId,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        phone2: data.phone2,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country || "France",
        notes: data.notes,
        source: data.source,
        status: "PROSPECT"
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/clients")
    
    return { success: true, data: client }
  } catch (error) {
    console.error("Erreur création client:", error)
    return { error: "Erreur lors de la création" }
  }
}

export async function getClients(filters?: {
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

    if (!user?.agencyId) {
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
        { companyName: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } }
      ]
    }

    const clients = await db.client.findMany({
      where,
      include: {
        _count: {
          select: { Sites: true, Invoices: true, Contracts: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return clients
  } catch (error) {
    console.error("Erreur récupération clients:", error)
    return []
  }
}

export async function getClient(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const client = await db.client.findUnique({
      where: { id },
      include: {
        Sites: {
          include: {
            _count: { select: { CleaningSession: true } }
          }
        },
        Contracts: true,
        Notes: { orderBy: { createdAt: "desc" } },
        Preferences: true,
        Invoices: {
          orderBy: { createdAt: "desc" },
          take: 10
        },
        Quotes: {
          orderBy: { createdAt: "desc" },
          take: 10
        },
        _count: {
          select: { Sites: true, Invoices: true, Contracts: true }
        }
      }
    })

    return client
  } catch (error) {
    console.error("Erreur récupération client:", error)
    return null
  }
}

export async function updateClient(id: string, data: {
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  phone2?: string
  address?: string
  city?: string
  postalCode?: string
  status?: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const client = await db.client.update({
      where: { id },
      data
    })

    revalidatePath("/dashboard/clients")
    revalidatePath(`/dashboard/clients/${id}`)
    
    return { success: true, data: client }
  } catch (error) {
    console.error("Erreur mise à jour client:", error)
    return { error: "Erreur lors de la mise à jour" }
  }
}

export async function deleteClient(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    await db.client.update({
      where: { id },
      data: { status: "LOST" }
    })

    revalidatePath("/dashboard/clients")
    
    return { success: true }
  } catch (error) {
    console.error("Erreur suppression client:", error)
    return { error: "Erreur lors de la suppression" }
  }
}

// ==================== CLIENT NOTES ====================

export async function addClientNote(data: {
  clientId: string
  type: string
  title?: string
  content: string
  isImportant?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const note = await db.clientNote.create({
      data: {
        clientId: data.clientId,
        type: data.type,
        title: data.title,
        content: data.content,
        isImportant: data.isImportant || false,
        createdBy: session.user.id
      }
    })

    revalidatePath(`/dashboard/clients/${data.clientId}`)
    
    return { success: true, data: note }
  } catch (error) {
    console.error("Erreur ajout note:", error)
    return { error: "Erreur lors de l'ajout" }
  }
}

export async function deleteClientNote(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const note = await db.clientNote.findUnique({
      where: { id },
      select: { clientId: true }
    })

    await db.clientNote.delete({ where: { id } })

    if (note) {
      revalidatePath(`/dashboard/clients/${note.clientId}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error("Erreur suppression note:", error)
    return { error: "Erreur lors de la suppression" }
  }
}

// ==================== CLIENT PREFERENCES ====================

export async function setClientPreference(data: {
  clientId: string
  category: string
  key: string
  value: string
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const preference = await db.clientPreference.upsert({
      where: {
        clientId_category_key: {
          clientId: data.clientId,
          category: data.category,
          key: data.key
        }
      },
      update: {
        value: data.value,
        notes: data.notes
      },
      create: {
        clientId: data.clientId,
        category: data.category,
        key: data.key,
        value: data.value,
        notes: data.notes
      }
    })

    revalidatePath(`/dashboard/clients/${data.clientId}`)
    
    return { success: true, data: preference }
  } catch (error) {
    console.error("Erreur définition préférence:", error)
    return { error: "Erreur lors de la définition" }
  }
}

export async function getClientPreferences(clientId: string, category?: string) {
  try {
    const where: any = { clientId }
    if (category) {
      where.category = category
    }

    return await db.clientPreference.findMany({ where })
  } catch (error) {
    console.error("Erreur récupération préférences:", error)
    return []
  }
}

// ==================== CONTRACTS ====================

export async function createContract(data: {
  clientId: string
  siteId?: string
  name: string
  type: string
  startDate: Date
  endDate?: Date
  frequency?: string
  dayOfWeek?: number
  price: number
  priceType?: string
  hoursIncluded?: number
  terms?: string
  autoRenew?: boolean
  notes?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const contract = await db.contract.create({
      data: {
        clientId: data.clientId,
        siteId: data.siteId,
        name: data.name,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        price: data.price,
        priceType: data.priceType || "FIXED",
        hoursIncluded: data.hoursIncluded,
        terms: data.terms,
        autoRenew: data.autoRenew || false,
        notes: data.notes
      }
    })

    // Mettre à jour le statut du client
    await db.client.update({
      where: { id: data.clientId },
      data: { status: "ACTIVE" }
    })

    revalidatePath("/dashboard/clients")
    revalidatePath(`/dashboard/clients/${data.clientId}`)
    
    return { success: true, data: contract }
  } catch (error) {
    console.error("Erreur création contrat:", error)
    return { error: "Erreur lors de la création" }
  }
}

export async function getContracts(clientId?: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    const where: any = {}
    
    if (clientId) {
      where.clientId = clientId
    } else if (user?.agencyId) {
      where.Client = { agencyId: user.agencyId }
    }

    return await db.contract.findMany({
      where,
      include: {
        Client: { select: { firstName: true, lastName: true, companyName: true } },
        Site: { select: { name: true, address: true } }
      },
      orderBy: { startDate: "desc" }
    })
  } catch (error) {
    console.error("Erreur récupération contrats:", error)
    return []
  }
}

export async function updateContractStatus(id: string, status: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const contract = await db.contract.update({
      where: { id },
      data: { status }
    })

    revalidatePath(`/dashboard/clients/${contract.clientId}`)
    
    return { success: true, data: contract }
  } catch (error) {
    console.error("Erreur mise à jour contrat:", error)
    return { error: "Erreur lors de la mise à jour" }
  }
}

// ==================== STATS ====================

export async function getClientStats() {
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

    const [totalClients, activeClients, prospects, totalRevenue] = await Promise.all([
      db.client.count({ where: { agencyId: user.agencyId } }),
      db.client.count({ where: { agencyId: user.agencyId, status: "ACTIVE" } }),
      db.client.count({ where: { agencyId: user.agencyId, status: "PROSPECT" } }),
      db.client.aggregate({
        where: { agencyId: user.agencyId },
        _sum: { totalSpent: true }
      })
    ])

    return {
      totalClients,
      activeClients,
      prospects,
      totalRevenue: totalRevenue._sum.totalSpent || 0
    }
  } catch (error) {
    console.error("Erreur récupération stats clients:", error)
    return null
  }
}
