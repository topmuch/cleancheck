import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/tasks - Récupérer les tâches d'un site
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get("siteId")
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId est requis" }, { status: 400 })
    }

    const tasks = await db.task.findMany({
      where: { 
        siteId,
        isActive: true 
      },
      orderBy: { orderIndex: "asc" }
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Erreur GET /api/tasks:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/tasks - Créer une nouvelle tâche
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { siteId, name, description, orderIndex } = body

    if (!siteId || !name) {
      return NextResponse.json({ error: "siteId et name sont requis" }, { status: 400 })
    }

    // Vérifier que le site appartient à l'utilisateur
    const site = await db.site.findFirst({
      where: { 
        id: siteId,
        userId: session.user.id 
      }
    })

    if (!site) {
      return NextResponse.json({ error: "Site non trouvé" }, { status: 404 })
    }

    // Compter les tâches existantes pour l'ordre
    const existingTasks = await db.task.count({
      where: { siteId }
    })

    const task = await db.task.create({
      data: {
        siteId,
        name,
        description: description || null,
        orderIndex: orderIndex ?? existingTasks,
      }
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/tasks:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE /api/tasks - Supprimer une tâche (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "id est requis" }, { status: 400 })
    }

    // Soft delete
    const task = await db.task.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error("Erreur DELETE /api/tasks:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
