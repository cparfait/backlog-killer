# 🎮 Backlog Killer

Application destinée aux joueurs possédant une liste de jeux (backlog) interminable. Ajoutez vos jeux, faites évoluer votre profil, gagnez de l'expérience et débloquez des succès pour vous motiver à vider votre pile !

## 🛠️ Stack Technique

* **Framework :** [Next.js](https://nextjs.org/) (App Router)
* **Langage :** TypeScript
* **Styling :** Tailwind CSS & Lucide Icons
* **Base de données :** SQLite via Prisma ORM
* **Authentification :** JWT (JSON Web Tokens)
* **API Externe :** Twitch/IGDB (pour la recherche de jeux)

---

## 🚀 Installation en local

### Prérequis
* Node.js (v18 ou supérieur)
* npm
* Un compte Twitch Developer (pour récupérer un *Client ID* et un *Client Secret* afin de faire fonctionner la recherche de jeux IGDB).

### Étapes d'installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/cparfait/backlog-killer.git
   cd backlog-killer
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   Créez un fichier `.env` à la racine du projet (en vous basant sur `.env.example`) :
   ```env
   # Base de données
   DATABASE_URL="file:./dev.db"

   # Authentification
   JWT_SECRET=votre_cle_secrete_ici
   
   # API Twitch / IGDB
   TWITCH_CLIENT_ID=votre_client_id
   TWITCH_CLIENT_SECRET=votre_client_secret
   ```

4. **Initialiser la base de données**
   Générez le client Prisma et créez la base de données locale :
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Lancer l'application**
   Démarrez le serveur de développement :
   ```bash
   npm run dev
   ```

### Accès à l'application

* 🌐 **URL Locale :** [http://localhost:3000](http://localhost:3000)

> **Note :** Un utilisateur de test est créé automatiquement avec l'email **`test@test.com`** et le mot de passe **`password`**.

---

## ✨ Fonctionnalités

* 🔒 **Authentification sécurisée :** Inscription et connexion avec hashage des mots de passe (Bcrypt) et tokens JWT.
* 🔍 **Recherche de jeux :** Intégration de l'API IGDB pour récupérer titres, jaquettes et plateformes.
* 📚 **Gestion du Backlog :** Organisation par statuts (PLAYING, FINISHED, ABANDONED, WISHLIST).
* 📈 **Système de Niveaux (XP) :** Progression du profil en fonction des jeux terminés.
* 🏆 **Succès (Badges) :** Système de récompenses automatiques selon vos actions.

---

## 🏗️ Structure du projet

```text
backlog-killer/
├── app/                  # Routes, Pages et API (Next.js App Router)
├── lib/                  # Logique partagée (Prisma, Auth, Utilitaires)
├── public/               # Assets statiques (Images, Icons)
├── prisma/               # Schéma de base de données
├── .env.example          # Template des variables d'environnement
├── next.config.ts        # Configuration Next.js
└── package.json          # Dépendances et scripts
```

---

## 📜 Licence

Ce projet est sous licence MIT.
