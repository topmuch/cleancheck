import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// PUT /api/session-tasks/[id] - Mettre à jour une session task (cocher/décocher)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { completed } = body

    if (typeof completed !== "boolean") {
      return NextResponse.json({ 
        error: "completed est requis (boolean)" 
      }, { status: 400 })
    }

    const sessionTask = await db.sessionTask.update({
      where: { id },
      data: {
        completed,
        completedAt: completed ? new Date() : null
      }
    })

    return NextResponse.json({ sessionTask })
  } catch (error) {
    console.error("Erreur PUT /api/session-tasks/[id]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
