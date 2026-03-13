import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

// POST /api/register - Inscription d'un nouvel utilisateur
export async function POST(request: NextRequest) {
  console.log("=== POST /api/register - Début ===")
  
  try {
    const body = await request.json()
    console.log("Body reçu:", { ...body, password: "***" })
    
    const { email, password, name } = body

    if (!email || !password) {
      console.log("Erreur: Email ou mot de passe manquant")
      return NextResponse.json({ 
        error: "Email et mot de passe sont requis" 
      }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("Erreur: Mot de passe trop court")
      return NextResponse.json({ 
        error: "Le mot de passe doit contenir au moins 6 caractères" 
      }, { status: 400 })
    }

    console.log("Recherche utilisateur existant...")
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    console.log("Utilisateur existant:", existingUser ? "Oui" : "Non")

    if (existingUser) {
      return NextResponse.json({ 
        error: "Un compte existe déjà avec cet email" 
      }, { status: 400 })
    }

    console.log("Hashage du mot de passe...")
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log("Création de l'utilisateur...")
    
    // Créer l'utilisateur
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      }
    })

    console.log("Utilisateur créé:", user.id)

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }, { status: 201 })
  } catch (error) {
    console.error("=== ERREUR POST /api/register ===")
    console.error("Erreur complète:", error)
    
    if (error instanceof Error) {
      console.error("Message:", error.message)
      console.error("Stack:", error.stack)
    }
    
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}
