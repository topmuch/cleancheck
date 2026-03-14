"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

// ==================== AGENCY ====================

export async function createAgency(data: {
  name: string
  email?: string
  phone?: string
  address?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    // Créer l'agence et mettre à jour l'utilisateur
    const agency = await db.$transaction(async (tx) => {
      const newAgency = await tx.agency.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
        }
      })

      // Mettre à jour le rôle de l'utilisateur
      await tx.user.update({
        where: { id: session.user.id },
        data: { 
          role: "AGENCY",
          agencyId: newAgency.id 
        }
      })

      return newAgency
    })

    revalidatePath("/dashboard")
    return { success: true, data: agency }
  } catch (error) {
    console.error("Erreur création agence:", error)
    return { error: "Erreur lors de la création" }
  }
}

export async function getAgency() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { Agency: true }
    })

    // Si l'utilisateur est rattaché à une agence
    if (user?.agencyId) {
      return await db.agency.findUnique({
        where: { id: user.agencyId },
        include: {
          Employees: true,
          Sites: true,
          Users: true
        }
      })
    }

    return null
  } catch (error) {
    console.error("Erreur récupération agence:", error)
    return null
  }
}

export async function updateAgency(id: string, data: {
  name?: string
  email?: string
  phone?: string
  address?: string
  isActive?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const agency = await db.agency.update({
      where: { id },
      data
    })

    revalidatePath("/dashboard")
    return { success: true, data: agency }
  } catch (error) {
    console.error("Erreur mise à jour agence:", error)
    return { error: "Erreur lors de la mise à jour" }
  }
}

// ==================== EMPLOYEES ====================

export async function createEmployee(data: {
  name: string
  email?: string
  phone: string
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
      return { error: "Vous devez appartenir à une agence" }
    }

    const employee = await db.employee.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        agencyId: user.agencyId
      }
    })

    revalidatePath("/dashboard")
    return { success: true, data: employee }
  } catch (error) {
    console.error("Erreur création employé:", error)
    return { error: "Erreur lors de la création" }
  }
}

export async function getEmployees() {
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

    return await db.employee.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { name: "asc" }
    })
  } catch (error) {
    console.error("Erreur récupération employés:", error)
    return []
  }
}

export async function updateEmployee(id: string, data: {
  name?: string
  email?: string
  phone?: string
  isActive?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Non autorisé" }
  }

  try {
    const employee = await db.employee.update({
      where: { id },
      data
    })

    revalidatePath("/dashboard")
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
    await db.employee.delete({
      where: { id }
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Erreur suppression employé:", error)
    return { error: "Erreur lors de la suppression" }
  }
}

// ==================== STATS ====================

export async function getAgencyStats() {
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

    const [employeesCount, sitesCount, sessionsCount] = await Promise.all([
      db.employee.count({
        where: { agencyId: user.agencyId, isActive: true }
      }),
      db.site.count({
        where: { agencyId: user.agencyId, isActive: true }
      }),
      db.cleaningSession.count({
        where: {
          Site: { agencyId: user.agencyId }
        }
      })
    ])

    return {
      employeesCount,
      sitesCount,
      sessionsCount
    }
  } catch (error) {
    console.error("Erreur récupération stats:", error)
    return null
  }
}
