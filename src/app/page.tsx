"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, QrCode, CheckCircle, Smartphone } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Rediriger vers le dashboard si connecté
    if (status === "authenticated" && session) {
      router.push("/dashboard")
    }
  }, [session, status, router])

  // Afficher un loader pendant la vérification de la session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // Si connecté, afficher le loader pendant la redirection
  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Redirection vers le tableau de bord...</p>
        </div>
      </div>
    )
  }

  // Page d'accueil pour les utilisateurs non connectés
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">C</span>
            </div>
            <span className="text-xl font-bold">CleanCheck</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Se connecter</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-500 hover:bg-blue-600">
                Essai gratuit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Gérez vos prestations de ménage avec{" "}
            <span className="text-blue-500">simplicité</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            CleanCheck révolutionne la gestion de vos équipes de nettoyage.
            Un simple scan QR Code pour suivre chaque intervention en temps réel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto">
                Commencer gratuitement
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Comment ça fonctionne ?</h2>
          <p className="text-muted-foreground">Un processus simple en 3 étapes</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle>1. Affichez le QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Générez un QR Code unique pour chaque site.
                Affichez-le à l'entrée de vos locaux.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle>2. L'intervenant scanne</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                L'intervenant scanne le QR Code avec son smartphone.
                Il déclare son arrivée et consulte les tâches.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-blue-200 transition-colors">
            <CardHeader>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
              <CardTitle>3. Suivez en temps réel</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Recevez des notifications et consultez l'historique
                complet de chaque intervention.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">C</span>
              </div>
              <span className="font-semibold">CleanCheck</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 CleanCheck. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
