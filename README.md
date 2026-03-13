# CleanCheck MVP

Application SaaS de gestion de prestations de ménage avec QR Code.

## 🚀 Fonctionnalités

- 📱 **Scan QR Code** - Les intervenants scannent pour commencer/terminer une mission
- ✅ **Checklist de tâches** - Liste personnalisable de tâches par site
- ⏱️ **Timer automatique** - Suivi du temps d'intervention
- 📊 **Dashboard** - Vue d'ensemble des sites et sessions
- 🔐 **Authentification** - Système de connexion sécurisé
- 📝 **Historique** - Toutes les interventions sont enregistrées

## 🛠️ Stack Technique

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (développement) / PostgreSQL (production)
- **Auth**: NextAuth.js
- **UI**: shadcn/ui

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
  -v cleancheck_data:/app/data \
  cleancheck
```

## ☁️ Déploiement sur Coolify

### 1. Prérequis

- Un serveur avec Coolify installé
- Un domaine configuré

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
```

4. **Volume persistant**

Créer un volume pour la base de données:
- Mount point: `/app/data`

### 3. Déployer

Cliquer sur "Deploy" dans Coolify.

### 4. Post-déploiement

Après le premier déploiement, exécuter le seed pour créer les données de démo:

```bash
# Dans le conteneur
docker exec -it <container-id> npx prisma db seed
```

Ou créer un utilisateur manuellement via l'interface d'inscription.

## 🔑 Compte de démonstration

- **Email**: `demo@cleancheck.com`
- **Mot de passe**: `demo123`

## 📁 Structure du projet

```
├── src/
│   ├── app/                 # Pages Next.js App Router
│   │   ├── api/             # API Routes
│   │   ├── dashboard/       # Dashboard client
│   │   ├── login/           # Page de connexion
│   │   ├── mission/         # Interface travailleur (QR)
│   │   └── signup/          # Page d'inscription
│   ├── components/          # Composants React
│   ├── lib/                 # Utilitaires et configuration
│   └── actions/             # Server Actions
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

## 📝 Licence

MIT
