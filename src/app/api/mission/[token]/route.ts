import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/mission/[token] - Vérifier le token QR et récupérer les infos du site
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const site = await db.site.findFirst({
      where: { 
        qrToken: token,
        isActive: true 
      },
      include: {
        tasks: {
          where: { isActive: true },
          orderBy: { orderIndex: "asc" }
        }
      }
    })

    if (!site) {
      return NextResponse.json({ 
        error: "Ce QR Code n'est pas valide ou le site n'est plus actif." 
      }, { status: 404 })
    }

    // Ne pas exposer le PIN complet, juste indiquer s'il y en a un
    return NextResponse.json({ 
      site: {
        id: site.id,
        name: site.name,
        address: site.address,
        hasPin: !!site.pinCode,
        tasks: site.tasks
      }
    })
  } catch (error) {
    console.error("Erreur GET /api/mission/[token]:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
