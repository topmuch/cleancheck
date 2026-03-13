"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Task } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Loader2, AlertCircle, Play } from "lucide-react"
import { toast } from "sonner"

interface SiteInfo {
  id: string
  name: string
  address: string | null
  hasPin: boolean
  tasks: Task[]
}

export default function MissionPage() {
  const { token } = useParams()
  const router = useRouter()
  const [site, setSite] = useState<SiteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workerName, setWorkerName] = useState("")
  const [pinCode, setPinCode] = useState("")

  useEffect(() => {
    fetchSite()
  }, [token])

  const fetchSite = async () => {
    try {
      const response = await fetch(`/api/mission/${token}`)
      const data = await response.json()

      if (response.ok) {
        setSite(data.site)
      } else {
        setError(data.error || "Ce QR Code n'est pas valide")
      }
    } catch (err) {
      setError("Erreur lors du chargement du site")
    } finally {
      setLoading(false)
    }
  }

  const handleStartMission = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!workerName.trim()) {
      toast.error("Veuillez entrer votre nom")
      return
    }

    if (site?.hasPin && !pinCode) {
      toast.error("Veuillez entrer le code PIN")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: site!.id,
          workerName: workerName.trim(),
          pinCode: pinCode || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/work/${data.session.id}`)
      } else {
        toast.error(data.error || "Erreur lors du démarrage de la mission")
      }
    } catch (err) {
      console.error("Erreur:", err)
      toast.error("Erreur lors du démarrage de la mission")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">QR Code invalide</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{site.name}</h1>
          {site.address && (
            <p className="text-muted-foreground mt-1">{site.address}</p>
          )}
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Démarrer l'intervention</CardTitle>
            <CardDescription>
              Entrez vos informations pour commencer
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleStartMission}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workerName">Votre nom *</Label>
                <Input
                  id="workerName"
                  placeholder="Ex: Marie Dupont"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  required
                  disabled={submitting}
                  className="h-12 text-lg"
                  autoComplete="name"
                />
              </div>

              {site.hasPin && (
                <div className="space-y-2">
                  <Label htmlFor="pinCode">Code PIN *</Label>
                  <Input
                    id="pinCode"
                    type="password"
                    placeholder="••••"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                    required
                    disabled={submitting}
                    className="h-12 text-lg text-center tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ce site nécessite un code PIN pour accéder
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Tâches à effectuer:</strong>
                </p>
                {site.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune tâche définie pour ce site
                  </p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {site.tasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        {task.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg bg-blue-500 hover:bg-blue-600 mt-4"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Démarrage...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Démarrer la mission
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
