# 🎮 Backlog Killer

> *"Je le jouerai un jour."* — toi, en 2019, en achetant ce jeu à -90% qui prend la poussière depuis.

**Backlog Killer** se connecte à ta bibliothèque Steam et choisit un jeu à ta place. Parce que toi, tu vas passer 45 minutes à scroller avant de relancer Minecraft.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Steam](https://img.shields.io/badge/Auth-Steam_OpenID-1b2838?logo=steam)](https://steamcommunity.com/dev)
[![License: MIT](https://img.shields.io/badge/Licence-MIT-green)](LICENSE)

---

## ✨ Fonctionnalités

- 🎲 **Tirage aléatoire** — un jeu est choisi parmi ta bibliothèque non jouée
- 🔗 **Auth Steam** — connexion en un clic, pas de compte supplémentaire à gérer
- 👥 **Multi-utilisateurs** — tes amis peuvent se connecter avec leur propre compte Steam
- 🎬 **Trailer intégré** — regarde le trailer du jeu tiré sans quitter l'appli
- ⭐ **Score OpenCritic** — pour savoir si le jeu vaut vraiment le coup avant de lancer
- 📸 **Screenshots** — parce qu'on juge un jeu à sa couverture (et à ses screenshots)
- 🏆 **Comparaison de bibliothèques** — découvre les jeux en commun avec tes amis

---

## 🛠️ Stack technique

| Couche | Techno |
|--------|--------|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Steam OpenID 2.0 + iron-session |
| API | Steam Web API |

---

## 🚀 Installation en local

**Prérequis :** Node.js 18+

```bash
git clone https://github.com/cparfait/backlog-killer.git
cd backlog-killer
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) et laisse l'app te juger pour ton backlog.

### Clé API Steam

Au premier lancement, l'app te demande une clé API Steam. Tu peux en obtenir une gratuitement sur [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey). Elle reste côté serveur, tes amis n't en ont pas besoin.

> ⚠️ Ton profil Steam (et celui de tes amis) doit être en **public** pour que l'API puisse lire la bibliothèque de jeux.

---

## 🐳 Self-hosting avec Docker

Tu veux héberger ça chez toi pour toute la guilde ? C'est prévu.

### Variables d'environnement

Crée un fichier `.env` à la racine du projet :

```env
STEAM_API_KEY=ta_clé_steam_32_chars
SESSION_SECRET=une_chaîne_aléatoire_32_chars_minimum
APP_BASE_URL=https://backlog.ton-domaine.com
NODE_ENV=production
```

> Génère un `SESSION_SECRET` solide avec : `openssl rand -hex 32`

### Avec Docker Compose

```bash
docker compose up -d --build
```

### Avec Portainer (Stack → Repository)

1. **Stacks → Add Stack → Repository**
2. URL du repo : `https://github.com/cparfait/backlog-killer`
3. Compose path : `docker-compose.yml`
4. Ajoute les variables d'environnement dans l'interface
5. Deploy

### Reverse proxy (Nginx Proxy Manager)

Le conteneur tourne sur le port `3000` et se connecte au réseau `npm_default`. Dans NPM :

| Champ | Valeur |
|-------|--------|
| Domain | `backlog.ton-domaine.com` |
| Forward Hostname | nom du conteneur |
| Forward Port | `3000` |
| SSL | Let's Encrypt ✅ |

> Si ton réseau NPM a un nom différent de `npm_default`, mets-le à jour dans `docker-compose.yml`.

---

## 📁 Structure du projet

```
backlog-killer/
├── app/              # Routes, pages et API (Next.js App Router)
│   ├── api/auth/     # Steam OpenID login / callback / logout
│   ├── library/      # Page principale de tirage
│   └── _components/  # Composants réutilisables
├── lib/
│   ├── steam/        # Client Steam API + vérification OpenID
│   └── session.ts    # Config iron-session
└── public/           # Assets statiques
```

---

## 📜 Licence

MIT — fais-en ce que tu veux, mais joue quand même à tes jeux.
