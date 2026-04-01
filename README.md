🎮 Backlog Killer
Application destinée aux joueurs possédant une liste de jeux (backlog) interminable. Ajoutez vos jeux, faites évoluer votre profil, gagnez de l'expérience et débloquez des succès pour vous motiver à vider votre pile !

🛠️ Stack Technique
Frontend : React, Vite, TypeScript, Tailwind CSS, Lucide Icons
Backend : Node.js, Express, TypeScript
Base de données : SQLite via Prisma ORM
Authentification : JWT (JSON Web Tokens)
API Externe : Twitch/IGDB (pour la recherche de jeux)
🚀 Installation en local
Prérequis
Node.js (v18 ou supérieur)
npm
Un compte Twitch Developer (pour récupérer un Client ID et un Client Secret afin de faire fonctionner la recherche de jeux IGDB).
1. Cloner le dépôt
git clone https://github.com/cparfait/backlog-killer.gitcd backlog-killer
2. Installer les dépendances
Le projet utilise des workspaces npm, une seule commande suffit à la racine :

bash

npm install
3. Configurer les variables d'environnement
Renommez le fichier .env.example en .env à la racine du projet et remplissez les valeurs :

env

# Authentification
JWT_SECRET=your_super_secret_jwt_key_here

# API Twitch / IGDB (Obligatoire pour chercher un jeu)
TWITCH_CLIENT_ID=votre_client_id
TWITCH_CLIENT_SECRET=votre_client_secret
4. Initialiser la base de données
Le projet utilise SQLite et Prisma. Pour créer les tables et la base dev.db :

bash

npx prisma migrate dev --name init
5. Lancer l'application
Démarrez le frontend et le backend simultanément en mode développement :

bash

npm run dev
🌐 Frontend : http://localhost:5173
⚙️ Backend (API) : http://localhost:3000
(Note : Un utilisateur de test est créé automatiquement au lancement du backend avec l'email test@test.com et le mot de passe password)

✨ Fonctionnalités
🔐 Authentification sécurisée : Inscription et connexion avec hashage des mots de passe (Bcrypt) et tokens JWT.
🔍 Recherche de jeux : Recherche automatique via l'API IGDB (Titre, jaquette, date de sortie, plateformes).
📚 Gestion du Backlog : Ajout des jeux avec statuts précis (PLAYING, FINISHED, ABANDONED, WISHLIST).
📈 Système de Niveaux (XP) : Gagnez de l'expérience en terminant ou en abandonnant des jeux pour faire monter votre niveau.
🏆 Succès (Badges) : Déblocage automatique de badges selon vos actions (ex: Premier abandon, Premier jeu fini, Premier wish, Collectionneur).
🗑️ Suppression : Possibilité de retirer un jeu de sa liste.
🏗️ Structure du projet
text

backlog-killer/
├── packages/
│   ├── frontend/       # Application React (Vite + Tailwind)
│   └── backend/        # API REST (Express + Prisma)
├── .env.example        # Variables d'environnement à copier
├── package.json        # Configuration npm workspaces
└── README.md
📜 Licence
Ce projet est sous licence MIT.
