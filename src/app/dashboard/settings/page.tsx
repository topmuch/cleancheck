"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2, Mail, Bell, Save, Send, CheckCircle, XCircle, 
  Clock, Settings, User, Building2
} from "lucide-react"
import { toast } from "sonner"
import { sendTestEmail } from "@/lib/email/service"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  
  // Settings state
  const [settings, setSettings] = useState({
    // Email notifications
    emailReminders24h: true,
    emailReminders1h: true,
    emailInvoiceSent: true,
    emailQuoteSent: true,
    emailWelcomeNewUser: true,
    
    // Reminder timing
    reminder24hEnabled: true,
    reminder1hEnabled: true,
    
    // Agency settings
    agencyName: "",
    agencyEmail: "",
    agencyPhone: "",
    agencyAddress: "",
    
    // Invoice settings
    invoicePrefix: "FAC",
    invoicePaymentTerms: 30,
    quoteValidity: 30,
  })

  const handleSaveSettings = async () => {
    setLoading(true)
    
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setLoading(false)
    toast.success("Paramètres enregistrés avec succès")
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Veuillez entrer une adresse email")
      return
    }

    setTestEmailSending(true)
    
    const result = await sendTestEmail(testEmail)
    
    setTestEmailSending(false)
    
    if (result.success) {
      toast.success("Email de test envoyé avec succès")
    } else {
      toast.error(result.error || "Erreur lors de l'envoi")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez votre application CleanCheck
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="agency" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Agence
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Facturation
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications automatiques</CardTitle>
              <CardDescription>
                Configurez les rappels et notifications envoyés automatiquement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Rappel 24h avant</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyer un rappel 24 heures avant chaque intervention
                  </p>
                </div>
                <Switch
                  checked={settings.emailReminders24h}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailReminders24h: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Rappel 1h avant</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyer un rappel 1 heure avant chaque intervention
                  </p>
                </div>
                <Switch
                  checked={settings.emailReminders1h}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailReminders1h: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Confirmation facture</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyer un email quand une facture est émise
                  </p>
                </div>
                <Switch
                  checked={settings.emailInvoiceSent}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailInvoiceSent: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Confirmation devis</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyer un email quand un devis est envoyé
                  </p>
                </div>
                <Switch
                  checked={settings.emailQuoteSent}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailQuoteSent: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email de bienvenue</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyer un email de bienvenue aux nouveaux utilisateurs
                  </p>
                </div>
                <Switch
                  checked={settings.emailWelcomeNewUser}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailWelcomeNewUser: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agency Tab */}
        <TabsContent value="agency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'agence</CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur vos factures et devis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom de l'agence</Label>
                  <Input
                    value={settings.agencyName}
                    onChange={(e) => setSettings({ ...settings, agencyName: e.target.value })}
                    placeholder="Mon Agence de Ménage"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email de contact</Label>
                  <Input
                    type="email"
                    value={settings.agencyEmail}
                    onChange={(e) => setSettings({ ...settings, agencyEmail: e.target.value })}
                    placeholder="contact@monagence.com"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={settings.agencyPhone}
                    onChange={(e) => setSettings({ ...settings, agencyPhone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input
                    value={settings.agencyAddress}
                    onChange={(e) => setSettings({ ...settings, agencyAddress: e.target.value })}
                    placeholder="123 Rue de Paris, 75001 Paris"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horaires d'ouverture</CardTitle>
              <CardDescription>
                Définissez vos heures de travail habituelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configuration des horaires disponible bientôt</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de facturation</CardTitle>
              <CardDescription>
                Personnalisez vos factures et devis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Préfixe facture</Label>
                  <Input
                    value={settings.invoicePrefix}
                    onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                    placeholder="FAC"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: FAC-2024-0001
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Délai de paiement (jours)</Label>
                  <Input
                    type="number"
                    value={settings.invoicePaymentTerms}
                    onChange={(e) => setSettings({ ...settings, invoicePaymentTerms: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Validité devis (jours)</Label>
                  <Input
                    type="number"
                    value={settings.quoteValidity}
                    onChange={(e) => setSettings({ ...settings, quoteValidity: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tarification</CardTitle>
              <CardDescription>
                Configurez vos tarifs par défaut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configuration des tarifs disponible bientôt</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuration Email (Resend)
              </CardTitle>
              <CardDescription>
                Configurez l'envoi d'emails via Resend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {process.env.NEXT_PUBLIC_RESEND_CONFIGURED ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Resend configuré</p>
                        <p className="text-sm text-muted-foreground">
                          Les emails seront envoyés via Resend
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Mode développement</p>
                        <p className="text-sm text-muted-foreground">
                          Les emails sont simulés en console
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <Badge variant={process.env.NEXT_PUBLIC_RESEND_CONFIGURED ? "default" : "secondary"}>
                  {process.env.NEXT_PUBLIC_RESEND_CONFIGURED ? "Actif" : "Mode dev"}
                </Badge>
              </div>

              {/* Test Email */}
              <div className="space-y-4">
                <Label>Tester l'envoi d'email</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button onClick={handleSendTestEmail} disabled={testEmailSending}>
                    {testEmailSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Envoyez un email de test pour vérifier votre configuration
                </p>
              </div>

              <Separator />

              {/* Setup Instructions */}
              <div className="space-y-4">
                <h4 className="font-medium">Comment configurer Resend</h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Créez un compte sur <a href="https://resend.com" target="_blank" className="text-blue-500 hover:underline">resend.com</a></li>
                  <li>Obtenez votre clé API dans le dashboard Resend</li>
                  <li>Vérifiez votre domaine expéditeur</li>
                  <li>Ajoutez les variables d'environnement dans Coolify :</li>
                </ol>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono">
                  <p>RESEND_API_KEY=re_xxxxxxxx</p>
                  <p>RESEND_FROM_EMAIL=CleanCheck &lt;noreply@votredomaine.com&gt;</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Templates d'emails</CardTitle>
              <CardDescription>
                Prévisualisez et personnalisez vos templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Rappel de ménage", icon: Clock, description: "Envoyé avant chaque intervention" },
                  { name: "Facture", icon: Mail, description: "Envoyé lors de l'émission d'une facture" },
                  { name: "Devis", icon: Mail, description: "Envoyé lors de l'envoi d'un devis" },
                  { name: "Bienvenue", icon: User, description: "Envoyé aux nouveaux utilisateurs" },
                ].map((template) => (
                  <div key={template.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <template.icon className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Prévisualiser
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les paramètres
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
