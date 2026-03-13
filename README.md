# CleanCheck MVP

Application SaaS de gestion de prestations de ménage avec QR Code.

## 🚀 Fonctionnalités

### Core Features
- 📱 **Scan QR Code** - Les intervenants scannent pour commencer/terminer une mission
- ✅ **Checklist de tâches** - Liste personnalisable de tâches par site
- ⏱️ **Timer automatique** - Suivi du temps d'intervention
- 📊 **Dashboard** - Vue d'ensemble des sites et sessions
- 🔐 **Authentification** - Système de connexion sécurisé
- 📝 **Historique** - Toutes les interventions sont enregistrées

### Nouveautés v2.0
- 📅 **Calendrier de ménage** - Planification récurrente (quotidien, hebdo, mensuel)
- 📧 **Notifications email** - Rappels automatiques 24h et 1h avant les interventions
- 👥 **Gestion d'équipe** - Système d'agence avec employés et managers
- 🔔 **Système RBAC** - Rôles : SUPERADMIN, AGENCY, MANAGER, EMPLOYEE, OWNER

## 🛠️ Stack Technique

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (développement) / PostgreSQL (production)
- **Auth**: NextAuth.js
- **UI**: shadcn/ui
- **Email**: Resend
- **Calendar**: react-day-picker + date-fns

## 📦 Installation locale

```bash
# Cloner le repository
git clone https://github.com/topmuch/cleancheck.git
cd cleancheck

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Initialiser la base de données
npx prisma generate
npx prisma db push

# (Optionnel) Seeder la base de données
npm run db:seed

# Démarrer en développement
npm run dev
```

## 🐳 Déploiement Docker

```bash
# Construire l'image
docker build -t cleancheck .

# Lancer le conteneur
docker run -p 3000:3000 \
  -e NEXTAUTH_URL=https://votre-domaine.com \
  -e NEXTAUTH_SECRET=votre-secret \
  -e RESEND_API_KEY=votre-cle-resend \
  -v cleancheck_data:/app/data \
  cleancheck
```

## ☁️ Déploiement sur Coolify

### 1. Prérequis

- Un serveur avec Coolify installé
- Un domaine configuré
- Compte Resend pour les emails (optionnel)

### 2. Configuration dans Coolify

1. **Créer une nouvelle application**
   - Type: Docker
   - Source: Git Repository
   - Repository: `https://github.com/topmuch/cleancheck`
   - Branch: `main`

2. **Configuration Docker**
   - Dockerfile location: `/Dockerfile`

3. **Variables d'environnement**

```env
DATABASE_URL=file:/app/data/cleancheck.db
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=générer-avec-openssl-rand-base64-32
NODE_ENV=production
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=CleanCheck <noreply@votre-domaine.com>
CRON_SECRET=votre-secret-cron
```

4. **Volume persistant**

Créer un volume pour la base de données:
- Mount point: `/app/data`

### 3. Configurer les Cron Jobs

Dans Coolify, ajouter un cron job qui appelle `/api/cron` toutes les heures :

```bash
# Exemple avec curl
curl -H "Authorization: Bearer votre-cron-secret" https://votre-domaine.com/api/cron
```

Ou utiliser un service externe comme [cron-job.org](https://cron-job.org).

### 4. Déployer

Cliquer sur "Deploy" dans Coolify.

## 🔑 Compte de démonstration

- **Email**: `demo@cleancheck.com`
- **Mot de passe**: `demo123`

## 📁 Structure du projet

```
├── src/
│   ├── app/                 # Pages Next.js App Router
│   │   ├── api/             # API Routes
│   │   │   ├── cron/        # Cron job pour rappels
│   │   │   ├── sites/       # API Sites
│   │   │   └── sessions/    # API Sessions
│   │   ├── dashboard/       # Dashboard client
│   │   ├── login/           # Page de connexion
│   │   ├── mission/         # Interface travailleur (QR)
│   │   └── signup/          # Page d'inscription
│   ├── components/          # Composants React
│   │   ├── calendar/        # Composants calendrier
│   │   └── ui/              # Composants shadcn/ui
│   ├── lib/                 # Utilitaires et configuration
│   │   ├── auth.ts          # Configuration NextAuth
│   │   ├── db.ts            # Client Prisma
│   │   └── email.ts         # Service email Resend
│   └── actions/             # Server Actions
│       ├── scheduled-session.ts  # Actions calendrier
│       ├── agency.ts        # Actions agence/employés
│       ├── site.ts          # Actions sites
│       └── session.ts       # Actions sessions
├── prisma/
│   ├── schema.prisma        # Schéma base de données
│   └── seed.ts              # Données initiales
├── public/                  # Fichiers statiques
├── Dockerfile               # Image Docker
├── docker-compose.yml       # Orchestration Docker
└── docker-entrypoint.sh     # Script de démarrage
```

## 🌐 URLs importantes

| Page | Description |
|------|-------------|
| `/` | Page d'accueil |
| `/login` | Connexion |
| `/signup` | Inscription |
| `/dashboard` | Tableau de bord |
| `/dashboard/site/[id]` | Détails d'un site |
| `/mission/[token]` | Interface travailleur |
| `/api/cron` | Endpoint Cron (rappels) |
| `/api/health` | Health check |

## 📊 Modèle de données

### Rôles utilisateurs
- **SUPERADMIN**: Accès complet à toute la plateforme
- **AGENCY**: Propriétaire d'agence, gère employés et clients
- **MANAGER**: Manager d'agence, gère les plannings
- **EMPLOYEE**: Employé, effectue les missions
- **OWNER**: Client particulier, gère ses propres sites

### Tables principales
- **User**: Utilisateurs avec rôle
- **Agency**: Agences de nettoyage
- **Employee**: Employés d'agence
- **Site**: Lieux de nettoyage
- **Task**: Tâches par site
- **CleaningSession**: Sessions de nettoyage
- **ScheduledSession**: Sessions planifiées (calendrier)
- **Notification**: Historique des notifications

## 📧 Configuration Email (Resend)

1. Créer un compte sur [resend.com](https://resend.com)
2. Obtenir une clé API
3. Configurer le domaine expéditeur
4. Ajouter les variables dans `.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxx
   RESEND_FROM_EMAIL=CleanCheck <noreply@votre-domaine.com>
   ```

## 🔄 Cron Jobs

Le système utilise un endpoint `/api/cron` pour :
- Envoyer les rappels 24h avant
- Envoyer les rappels 1h avant
- Mettre à jour les statuts des sessions

### Configuration Vercel Cron

Ajouter dans `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 * * * *"
  }]
}
```

### Configuration Coolify/externe

Appeler l'endpoint toutes les heures:
```bash
curl -H "Authorization: Bearer votre-cron-secret" https://votre-domaine.com/api/cron
```

## 📝 Licence

MIT

---

Développé avec ❤️ par CleanCheck Team
