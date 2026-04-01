# 🎮 Backlog Killer

**Petit outil pour découvrir aléatoirement une pépite de sa collection STEAM.**

Fini le syndrome de la page blanche devant votre bibliothèque de jeux ! Backlog Killer se connecte à votre compte Steam pour vous proposer un jeu au hasard parmi ceux que vous possédez, afin de vous aider à vider votre pile de jeux en attente.

---

## 🛠️ Stack Technique

* **Framework :** [Next.js](https://nextjs.org/) (App Router)
* **Langage :** TypeScript
* **Styling :** Tailwind CSS
* **API :** Steam Web API (Récupération de la bibliothèque de jeux)

---

## 🚀 Installation en local

### Prérequis
* Node.js (v18 ou supérieur)
* npm (ou yarn / pnpm)
* Une **Clé d'API Steam** (à générer sur [Steamworks](https://steamcommunity.com/dev/apikey)).

### Étapes d'installation

1. **Cloner le dépôt**
   ```bash
   git clone [https://github.com/cparfait/backlog-killer.git](https://github.com/cparfait/backlog-killer.git)
   cd backlog-killer
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   Copiez le fichier `.env.example` (s'il existe) ou créez un fichier `.env` à la racine du projet :
   
   * **Linux / macOS :** `cp .env.example .env`
   * **Windows :** `copy .env.example .env`

   Ajoutez-y vos identifiants Steam (adaptez les noms de variables selon ce que vous avez défini dans votre code) :
   ```env
   STEAM_API_KEY=votre_cle_api_steam_ici
   # Si vous utilisez NextAuth pour la connexion :
   NEXTAUTH_SECRET=votre_cle_secrete_generee_ici
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Lancer l'application**
   Démarrez le serveur en mode développement :
   ```bash
   npm run dev
   ```

### Accès à l'application
Ouvrez votre navigateur et allez sur : 🌐 **[http://localhost:3000](http://localhost:3000)**

---

## 🏗️ Structure du projet

* `app/` : Contient les routes, les pages et l'API de l'application (Next.js App Router).
* `lib/` : Contient la logique métier partagée, les utilitaires et la configuration externe (appels Steam).
* `public/` : Contient les ressources statiques (images, icônes).
* `next.config.ts` : Fichier de configuration du framework Next.js.

---

## 📜 Licence

Ce projet est sous licence MIT.
