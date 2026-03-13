import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST /api/sessions - Créer une nouvelle session de ménage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteId, workerName, pinCode } = body

    if (!siteId || !workerName) {
      return NextResponse.json({ 
        error: "siteId et workerName sont requis" 
      }, { status: 400 })
    }

    // Vérifier le site
    const site = await db.site.findFirst({
      where: { 
        id: siteId,
        isActive: true 
      },
      include: {
        tasks: {
          where: { isActive: true }
        }
      }
    })

    if (!site) {
      return NextResponse.json({ error: "Site non trouvé" }, { status: 404 })
    }

    // Vérifier le PIN si nécessaire
    if (site.pinCode && pinCode !== site.pinCode) {
      return NextResponse.json({ error: "Code PIN incorrect" }, { status: 403 })
    }

    // Vérifier s'il y a déjà une session en cours
    const ongoingSession = await db.cleaningSession.findFirst({
      where: {
        siteId,
        status: "IN_PROGRESS"
      }
    })

    if (ongoingSession) {
      return NextResponse.json({ 
        error: "Une session est déjà en cours sur ce site",
        ongoingSession 
      }, { status: 400 })
    }

    // Créer la session
    const session = await db.cleaningSession.create({
      data: {
        siteId,
        workerName,
        status: "IN_PROGRESS",
      }
    })

    // Créer les sessionTasks pour chaque tâche du site
    if (site.tasks.length > 0) {
      await db.sessionTask.createMany({
        data: site.tasks.map(task => ({
          sessionId: session.id,
          taskId: task.id,
          completed: false
        }))
      })
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/sessions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
