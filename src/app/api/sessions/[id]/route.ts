import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/sessions/[id] - Récupérer une session avec ses détails
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db.cleaningSession.findUnique({
      where: { id },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        sessionTasks: {
          include: {
            task: {
              select: {
                id: true,
                name: true,
                description: true,
                orderIndex: true
              }
            }
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    // Trier les tâches par orderIndex
    session.sessionTasks.sort((a, b) => 
      (a.task?.orderIndex || 0) - (b.task?.orderIndex || 0)
    )

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Erreur GET /api/sessions/[id]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT /api/sessions/[id] - Mettre à jour une session (terminer)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const session = await db.cleaningSession.findUnique({
      where: { id }
    })

    if (!session) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json({ 
        error: "Cette session est déjà terminée et ne peut plus être modifiée" 
      }, { status: 400 })
    }

    const updateData: any = {}

    if (body.status === "COMPLETED") {
      updateData.status = "COMPLETED"
      updateData.endTime = new Date()
      
      // Calculer la durée
      const startTime = new Date(session.startTime).getTime()
      const endTime = Date.now()
      updateData.durationSeconds = Math.floor((endTime - startTime) / 1000)
    }

    const updatedSession = await db.cleaningSession.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error("Erreur PUT /api/sessions/[id]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
