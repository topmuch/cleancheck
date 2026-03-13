import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/sites - Récupérer tous les sites de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const sites = await db.site.findMany({
      where: { 
        userId: session.user.id,
        isActive: true 
      },
      include: {
        _count: {
          select: { tasks: true, cleaningSessions: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ sites })
  } catch (error) {
    console.error("Erreur GET /api/sites:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/sites - Créer un nouveau site
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, pinCode } = body

    if (!name) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 })
    }

    const site = await db.site.create({
      data: {
        userId: session.user.id,
        name,
        address: address || null,
        pinCode: pinCode || null,
      }
    })

    return NextResponse.json({ site }, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/sites:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
