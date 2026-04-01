# 🎮 Backlog Killer

**Petit outil pour découvrir aléatoirement une pépite de sa collection STEAM.**

Fini le syndrome de la page blanche devant votre bibliothèque de jeux ! Backlog Killer se connecte à votre compte Steam pour vous proposer un jeu au hasard parmi ceux que vous possédez, afin de vous aider à vider votre pile de jeux en attente.

---

## 🛠️ Stack Technique

* **Framework :** [Next.js](https://nextjs.org/) (App Router)
* **Langage :** TypeScript
* **Styling :** Tailwind CSS

---

## 🚀 Installation en local

### Prérequis
* Node.js (v18 ou supérieur)
* npm

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

3. **Lancer l'application**
   Démarrez le serveur en mode développement :
   ```bash
   npm run dev
   ```

### Accès à l'application
Ouvrez votre navigateur et allez sur : 🌐 **[http://localhost:3000](http://localhost:3000)**

---

## 🏗️ Structure du projet

* `app/` : Contient les routes, les pages et l'API de l'application (Next.js App Router).
* `lib/` : Contient la logique métier et les utilitaires.
* `public/` : Contient les ressources statiques (images, icônes).
* `next.config.ts` : Fichier de configuration du framework Next.js.

---

## 📜 Licence

Ce projet est sous licence MIT.
