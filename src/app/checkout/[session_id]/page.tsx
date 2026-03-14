"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Task } from "@/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, MapPin, CheckCircle2, Loader2 } from "lucide-react"

interface SessionTaskWithTask {
  taskId: string
  completed: boolean
  task: Task | null
}

interface SessionData {
  id: string
  workerName: string
  startTime: Date | string
  endTime: Date | string | null
  durationSeconds: number | null
  status: string
  site: {
    name: string
    address: string | null
  }
  sessionTasks: SessionTaskWithTask[]
}

export default function CheckoutPage() {
  const { session_id } = useParams()
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession()
  }, [session_id])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${session_id}`)
      const data = await response.json()

      if (response.ok) {
        // Trier les tâches par orderIndex
        if (data.session.sessionTasks) {
          data.session.sessionTasks.sort(
            (a: SessionTaskWithTask, b: SessionTaskWithTask) => 
              (a.task?.orderIndex || 0) - (b.task?.orderIndex || 0)
          )
        }
        setSession(data.session)
      }
    } catch (err) {
      console.error("Erreur:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes} minutes`
  }

  const formatTime = (dateString: Date | string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p>Session non trouvée</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedTasks = session.sessionTasks.filter((st) => st.completed)
  const totalTasks = session.sessionTasks.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Success Header */}
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-green-700">Mission terminée !</h1>
          <p className="text-muted-foreground mt-2">Merci pour votre intervention</p>
        </div>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardContent className="py-6 space-y-4">
            {/* Site Info */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">{session.site.name}</p>
                {session.site.address && (
                  <p className="text-sm text-muted-foreground">{session.site.address}</p>
                )}
              </div>
            </div>

            {/* Worker */}
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
                👤
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Intervenant</p>
                <p className="font-medium">{session.workerName}</p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Durée</p>
                <p className="font-medium">
                  {formatDuration(session.durationSeconds)}
                  <span className="text-muted-foreground text-sm ml-2">
                    ({formatTime(session.startTime)} - {session.endTime ? formatTime(session.endTime) : "?"})
                  </span>
                </p>
              </div>
            </div>

            {/* Tasks Summary */}
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tâches complétées</p>
                <p className="font-medium">
                  {completedTasks.length} / {totalTasks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        {totalTasks > 0 && (
          <Card>
            <CardContent className="py-4">
              <h3 className="font-medium mb-3">Détail des tâches</h3>
              <div className="space-y-2">
                {session.sessionTasks.map((st) => (
                  <div
                    key={st.taskId}
                    className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
                      st.completed ? "bg-green-50" : "bg-gray-50"
                    }`}
                  >
                    {st.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span
                      className={
                        st.completed ? "text-green-700" : "text-muted-foreground"
                      }
                    >
                      {st.task?.name || "Tâche inconnue"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8 pb-8">
          Cette intervention a été enregistrée avec succès.
        </p>
      </div>
    </div>
  )
}
