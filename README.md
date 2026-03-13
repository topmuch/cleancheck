# 🧹 CleanCheck MVP

Application SaaS de gestion de prestations de ménage avec QR Code. Permet aux clients de gérer leurs sites et aux intervenants de valider leur travail sans compte utilisateur.

## ✨ Fonctionnalités

### Espace Client (Dashboard Web)
- 🔐 **Authentification** - Inscription/Connexion sécurisée
- 📍 **Gestion des sites** - Créer, modifier, supprimer des sites
- ✅ **Gestion des tâches** - Définir les tâches standards par site
- 📱 **QR Code** - Génération et impression de QR Code unique par site
- 📊 **Historique** - Suivi des interventions (Date, Heure, Durée, Intervenant)
- 🔒 **PIN de sécurité** - Code PIN optionnel pour sécuriser l'accès

### Espace Intervenant (PWA Mobile)
- 📱 **Check-in par QR Code** - Scan du QR Code pour démarrer une mission
- ⏱️ **Timer en temps réel** - Suivi du temps écoulé
- ✅ **Checklist de tâches** - Cocher les tâches effectuées
- 🎉 **Check-out** - Récapitulatif et validation de l'intervention

### Technique
- 📱 **PWA** - Installable sur mobile (iOS/Android)
- 🔒 **Authentification** - NextAuth.js avec credentials
- 🗄️ **Base de données** - Prisma avec SQLite

## 🚀 Installation

### 1. Prérequis
- Node.js 18+ ou Bun

### 2. Installation des dépendances

```bash
bun install
```

### 3. Configuration de la base de données

La base de données SQLite est créée automatiquement. Pour initialiser :

```bash
bun run db:push
```

### 4. Lancement en développement

```bash
bun run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du Projet

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── api/               # Routes API
│   │   ├── auth/          # NextAuth.js
│   │   ├── sites/         # CRUD Sites
│   │   ├── tasks/         # CRUD Tâches
│   │   ├── sessions/      # Sessions de ménage
│   │   └── mission/       # Check-in par QR
│   ├── login/             # Page de connexion
│   ├── signup/            # Page d'inscription
│   ├── dashboard/         # Espace client
│   │   └── site/[id]/     # Détail d'un site
│   ├── mission/[token]/   # Check-in intervenant
│   ├── work/[session_id]/ # Travail intervenant
│   └── checkout/...       # Récapitulatif
├── components/
│   └── ui/                # Composants shadcn/ui
├── contexts/
│   └── AuthContext.tsx    # Contexte d'authentification
├── lib/
│   ├── auth.ts            # Configuration NextAuth
│   └── db.ts              # Client Prisma
└── types/
    └── database.ts        # Types TypeScript

prisma/
└── schema.prisma          # Schéma de la base de données

public/
├── icons/                 # Icônes PWA
├── manifest.json          # Manifest PWA
└── sw.js                  # Service Worker
```

## 🔧 Scripts Disponibles

```bash
bun run dev      # Serveur de développement
bun run build    # Build de production
bun run lint     # Vérification ESLint
bun run db:push  # Synchroniser la DB avec Prisma
```

## 📱 PWA

L'application est installable sur mobile :
1. Ouvrir l'application dans le navigateur mobile
2. Ajouter à l'écran d'accueil
3. L'application fonctionne hors-ligne (partiellement)

## 🔒 Sécurité

### Authentification
- Mots de passe hashés avec bcrypt
- Sessions JWT avec NextAuth.js
- Protection des routes par middleware

### QR Code
- Token unique par site (cuid)
- Aucune donnée sensible dans le QR Code
- PIN optionnel pour sécuriser l'accès

## 🎨 Stack Technique

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma + SQLite
- **Auth**: NextAuth.js
- **QR Code**: qrcode.react
- **Icons**: Lucide React
- **Language**: TypeScript 5

## 📝 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/register | Inscription utilisateur |
| POST | /api/auth/signin | Connexion |
| GET | /api/sites | Liste des sites |
| POST | /api/sites | Créer un site |
| GET | /api/sites/[id] | Détail d'un site |
| DELETE | /api/sites/[id] | Supprimer un site |
| GET | /api/tasks?siteId= | Tâches d'un site |
| POST | /api/tasks | Créer une tâche |
| DELETE | /api/tasks?id= | Supprimer une tâche |
| GET | /api/mission/[token] | Infos site par QR |
| POST | /api/sessions | Créer une session |
| GET | /api/sessions/[id] | Détail session |
| PUT | /api/sessions/[id] | Terminer session |
| PUT | /api/session-tasks/[id] | Cocher tâche |

## 📄 License

MIT License - voir le fichier LICENSE pour plus de détails.

---

Développé avec ❤️ pour simplifier la gestion des prestations de ménage.
