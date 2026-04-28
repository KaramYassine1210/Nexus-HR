# 🏢 HRFlow — Gestion des Ressources Humaines

Une application RH moderne et multi-rôles pour gérer les demandes administratives, les congés, les absences et les documents employés.

## 📋 Table des matières

- [Caractéristiques](#caractéristiques)
- [Architecture](#architecture)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Rôles et permissions](#rôles-et-permissions)
- [Formulaires disponibles](#formulaires-disponibles)
- [Configuration des webhooks](#configuration-des-webhooks)
- [Authentification](#authentification)
- [Structure du projet](#structure-du-projet)
- [Données de démonstration](#données-de-démonstration)

---

## ✨ Caractéristiques

### 👤 Pour les employés
- **Tableau de bord personnel** : Vue d'ensemble des demandes (en attente, approuvées, refusées)
- **Formulaires de demande** :
  - 🏖️ Demande de congé (congé annuel, RTT, maladie, maternité, etc.)
  - 🏥 Justificatif d'absence
  - ✏️ Changement d'informations personnelles (adresse, téléphone, situation, RIB)
  - 📄 Demande de document administratif
- **Suivi des demandes** : Consulter l'état détaillé de chaque demande avec commentaires
- **Profil personnel** : Affichage des informations RH avec masquage sécurisé du RIB

### 👨‍💼 Pour les managers
- **Vue d'ensemble de l'équipe** : Statistiques et métriques du département
- **Gestion des demandes** : Approuver/refuser les demandes des employés
- **Commentaires** : Ajouter des justifications aux approbations/refus
- **Tableau de suivi** : Vue complète des demandes en attente

### 🛡️ Pour les administrateurs RH
- **Gestion globale** : Vue sur toutes les demandes de l'entreprise
- **Analytics** : Répartition des demandes par type et statut
- **Logs de webhooks** : Suivi de toutes les actions via les webhooks
- **Audit** : Historique complet des demandes et actions

### 🔧 Techniques
- ✅ **SPA (Single Page Application)** : Expérience utilisateur fluide sans rechargement
- 📡 **Webhook-driven** : Architecture basée sur les webhooks pour les intégrations
- 🎨 **Responsive design** : Utilise Chart.js pour les graphiques
- 🌐 **CORS activé** : Prêt pour les intégrations cross-domain
- 🔐 **Session-based** : Gestion des utilisateurs avec authentification démo

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│  (SPA vanille)  │
│   app.js        │
│  index.html     │
│  style.css      │
└────────┬────────┘
         │
┌────────▼────────┐       ┌──────────────────┐
│   Node.js       │──────▶│  Webhooks        │
│   server.js     │       │  (Fusion AI API) │
│   (Port 3000)   │       └──────────────────┘
└─────────────────┘
```

### Stack technologique
- **Frontend** : JavaScript vanilla (ES6+), HTML5, CSS3
- **Backend** : Node.js + HTTP/HTTPS
- **Graphiques** : Chart.js 4.4.0
- **Polices** : Inter (Google Fonts)
- **Environnement** : Navigateur moderne (Chrome, Firefox, Safari, Edge)

---

## 🚀 Installation

### Prérequis
- **Node.js** ≥ 14.x
- **npm** ou **yarn**
- Navigateur web moderne

### Étapes

1. **Cloner le repository**
   ```bash
   cd "c:\Users\LENOVO\Downloads\Nexus RH\Nexus-HR"
   ```

2. **Installer les dépendances** (si nécessaire)
   ```bash
   npm install
   ```

3. **Démarrer le serveur**
   ```bash
   node server.js
   ```
   Le serveur démarre sur **http://localhost:3000**

4. **Accéder à l'application**
   - Ouvrir le navigateur sur `http://localhost:3000`
   - Vous verrez l'écran de connexion

---

## 📱 Utilisation

### Connexion

Utilisez l'un des comptes de démonstration :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| alice@hrflow.io | demo | Employé |
| bob@hrflow.io | demo | Manager |
| claire@hrflow.io | demo | Administrateur RH |
| david@hrflow.io | demo | Employé |
| emma@hrflow.io | demo | Employé |
| frank@hrflow.io | demo | Manager |

### Navigation

Chaque rôle accède à des sections adaptées :

- **Tableau de bord** : Vue d'ensemble personnalisée
- **Nouvelle demande** : Accès aux formulaires
- **Suivi des demandes** : Historique personnel
- **Mon profil** : Informations personnelles et statistiques
- **Demandes (managers/RH)** : Gestion des demandes en attente
- **Analytics (RH)** : Statistiques globales de l'entreprise

---

## 👥 Rôles et permissions

### 🔹 Employé
- Soumettre des demandes (congés, absences, changement d'infos, documents)
- Consulter le statut de ses demandes
- Voir ses informations personnelles
- Accéder à son tableau de bord personnel

### 🔹 Manager
- Voir toutes les permissions de l'employé
- Approuver/Refuser les demandes de son équipe
- Ajouter des commentaires aux demandes
- Vue d'ensemble du département

### 🔹 Administrateur RH
- Accès complet à tous les rôles
- Voir toutes les demandes de l'entreprise
- Analytics et statistiques globales
- Logs des webhooks
- Gestion complète du système

---

## 📋 Formulaires disponibles

### 1️⃣ Demande de congé
- **Types** : Congé annuel, RTT, maladie, maternité/paternité, événement familial, sans solde
- **Champs** : Type, urgence, dates, motif, couverture
- **Webhook** : `leave_request`

### 2️⃣ Justificatif d'absence
- **Raisons** : Rendez-vous médical, urgence familiale, maladie, accident, autre
- **Champs** : Date, durée, motif, description, type de justificatif
- **Webhook** : `absence_justif`

### 3️⃣ Changement d'informations personnelles
- **Champs modifiables** : Adresse, Téléphone, Situation familiale, RIB
- **Champs** : Ancien valeur, nouvelle valeur, motif
- **Webhook** : `personal_change`
- **Sécurité** : RIB masqué (affiche seulement les 4 derniers caractères)

### 4️⃣ Demande de document
- **Types** : Attestation employeur, Bulletin de salaire, Certificat, Fiche de paie
- **Champs** : Type, urgence, copies, motif
- **Webhook** : `document_request`

---

## 🔌 Configuration des webhooks

L'application utilise des webhooks pour les intégrations :

```javascript
WEBHOOKS: {
  leave_request:      'https://fusion-ai-api.medifus.dev/webhooks/webhook-..',
  absence_justif:     'https://fusion-ai-api.medifus.dev/webhooks/webhook-..',
  personal_change:    'https://fusion-ai-api.medifus.dev/webhooks/webhook-...',
  document_request:   'https://fusion-ai-api.medifus.dev/webhooks/webhook-..',
  approve_request:    'https://fusion-ai-api.medifus.dev/webhooks/webhook-..',
  reject_request:     'https://fusion-ai-api.medifus.dev/webhooks/webhook-..',
  add_comment:        'https://fusion-ai-api.medifus.dev/webhooks/webhook-..',
  login:              'https://fusion-ai-api.medifus.dev/webhooks/webhook-...',
}
```

### Modifier les webhooks
1. Ouvrir `app.js`
2. Localiser l'objet `State.WEBHOOKS` (ligne ~30)
3. Remplacer les URLs par vos endpoints

### Payload webhooks
Chaque webhook reçoit le format :
```json
{
  "event": "request_submitted",
  "request_type": "leave_request",
  "timestamp": "2026-04-28T10:30:00.000Z",
  "submitted_by": {
    "id": "U001",
    "name": "Alice Martin",
    "email": "alice@hrflow.io",
    "dept": "Engineering"
  },
  "data": { ... }
}
```

---

## 🔐 Authentification

### Système de démonstration
- Login local sans backend d'authentification
- Les identifiants sont stockés dans `State.DEMO_USERS`
- Session stockée dans `State.currentUser`

### Pour une production
Modifiez la fonction `handleLogin()` pour appeler votre système d'authentification.

---

## 📂 Structure du projet

```
Nexus-HR/
├── index.html              # Page HTML principale
├── app.js                  # Logique SPA (2500+ lignes)
│   ├── STATE               # Gestion d'état global
│   ├── Webhook engine      # Système de webhooks
│   ├── Login/Auth          # Authentification
│   ├── Navigation          # Routage SPA
│   ├── Render functions    # Génération HTML
│   ├── Form submissions    # Traitement des formulaires
│   └── Utilities           # Fonctions utilitaires
├── style.css               # Styles (900+ lignes)
│   ├── Variables CSS       # Thème et couleurs
│   ├── Layout              # Grille et positionnement
│   ├── Components          # Cartes, badges, boutons
│   ├── Forms               # Styles des formulaires
│   └── Responsive          # Design mobile
├── server.js               # Serveur Node.js
│   ├── Static file serving # Fichiers statiques
│   ├── CORS proxy          # Proxy webhooks
│   └── HTTP handling       # Gestion des requêtes
└── .git/                   # Contrôle de version
```

---

## 📊 Données de démonstration

### Utilisateurs
- **Alice Martin** (Employé, Engineering)
- **Bob Dupont** (Manager, Engineering)
- **Claire Blanc** (Administrateur RH)
- **David Chen** (Employé, Design)
- **Emma Wilson** (Employé, Marketing)
- **Frank Leroy** (Manager, Marketing)

### Demandes pré-chargées
8 demandes de démonstration avec différents statuts (en attente, approuvées, refusées).

### Données personnelles
Chaque utilisateur dispose de :
- Téléphone
- Adresse postale
- Situation familiale
- RIB (masqué à l'affichage)

---

## 🎨 Design et thème

### Couleurs principales
- **Primaire** : `#6366f1` (Indigo)
- **Succès** : `#10b981` (Vert)
- **Avertissement** : `#f59e0b` (Ambre)
- **Danger** : `#ef4444` (Rouge)
- **Info** : `#3b82f6` (Bleu)

### Components
- Cartes (cards)
- Badges
- Boutons (primaires, outline, danger)
- Formulaires (inputs, selects, textareas)
- Modales
- Notifications (toasts)
- Graphiques (doughnuts, barres)

---

## 🛠️ Développement

### Ajouter une nouvelle route
1. Ajouter un item dans `navItems` (fonction `renderNav()`)
2. Ajouter les titres dans `renderPageHeader()`
3. Créer une fonction `renderXxxPage(container)`
4. Ajouter un cas dans le switch de `navigateTo()`

### Ajouter un nouveau formulaire
1. Créer `renderXxxForm(container)`
2. Ajouter une fonction `submitXxxForm()`
3. Ajouter le webhook dans `State.WEBHOOKS`
4. Ajouter le tab dans la section formulaires

### Déboguer
- Ouvrir les DevTools du navigateur (F12)
- Consulter les logs de la console
- Vérifier `State` dans la console
- Vérifier les logs des webhooks dans la section "Admin > Logs"

---

## 📈 Statistiques

| Métrique | Valeur |
|----------|--------|
| Lignes de code (app.js) | ~2500 |
| Lignes de styles (style.css) | ~900 |
| Utilisateurs de démonstration | 6 |
| Demandes pré-chargées | 8 |
| Types de demandes | 4 |
| Webhooks configurés | 8 |
| Rôles supportés | 3 |

---

## 🐛 Troubleshooting

### "Port 3000 déjà utilisé"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

---

## 📄 Licence

Projet propriétaire - Nexus RH Team

---

## 👨‍💻 Support et contributions

Pour toute question ou contribution, veuillez contacter l'équipe Nexus RH.

---

**Dernière mise à jour** : Avril 2026  
**Version** : 1.0.0  
**Statut** : Production
