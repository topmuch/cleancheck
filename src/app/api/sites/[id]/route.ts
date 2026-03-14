import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/sites/[id] - Récupérer un site avec ses détails
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    const site = await db.site.findFirst({
      where: { 
        id,
        userId: session.user.id 
      },
      include: {
        tasks: {
          where: { isActive: true },
          orderBy: { orderIndex: "asc" }
        },
        cleaningSessions: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            sessionTasks: {
              select: {
                taskId: true,
                completed: true
              }
            }
          }
        }
      }
    })

    if (!site) {
      return NextResponse.json({ error: "Site non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ site })
  } catch (error) {
    console.error("Erreur GET /api/sites/[id]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE /api/sites/[id] - Supprimer un site
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que le site appartient à l'utilisateur
    const site = await db.site.findFirst({
      where: { 
        id,
        userId: session.user.id 
      }
    })

    if (!site) {
      return NextResponse.json({ error: "Site non trouvé" }, { status: 404 })
    }

    await db.site.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur DELETE /api/sites/[id]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
