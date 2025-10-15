# Pharmathon & marchathon — FPHM (Fullstack)

Un site d'inscription simple et joli pour le **Pharmathon (8 km)** et la **marchathon (4 km)**, organisé par la **Faculté de Pharmacie de Monastir** (50ᵉ anniversaire — 16 novembre 2025).

## Infos collectées (d'après la fiche fournie)
- Nom et prénom
- Date de naissance
- Sexe (Homme / Femme)
- Téléphone
- Email
- Lien avec la FPHM : Étudiant(e), Enseignant(e), Pharmacien(ne), Personnel, Ancien(ne) diplômé(e), Famille / accompagnant
- Choix de l’épreuve : Pharmathon (8 km) ou marchathon (4 km)

## Déploiement rapide

### Backend (Render)
1. Dans `backend/`, exécutez localement :
   ```bash
   npm install
   npm start
   ```
2. Créez un service **Web Service** sur Render, Node 18.
3. Variables d'environnement obligatoires :
   - `ADMIN_TOKEN` : un secret pour la page admin et les exports.
   - (Optionnel) `DATABASE_URL` : Postgres (sinon SQLite fichier `data.sqlite` sera utilisé).
   - `ALLOWED_ORIGIN` : l'origine CORS (mettez l'URL Vercel plus tard, `*` pour tester).
4. Commandes :
   - Build: `npm install`
   - Start: `npm start`

> SQLite peut être éphémère sur Render. Pour la prod, utilisez Postgres (Render propose un add-on gratuit).

### Frontend (Vercel)
1. Dans `frontend/` :
   ```bash
   npm install
   npm run dev
   ```
2. Sur Vercel, importez le repo et définissez `NEXT_PUBLIC_API_BASE` vers l'URL Render du backend (ex: `https://pharmathon-backend.onrender.com`).
3. Déployez.

## Admin
- Page: `/admin` (frontend). Entrez le `ADMIN_TOKEN` pour charger les inscriptions.
- Export CSV: utilisez `curl -H "x-admin-token: VOTRE_TOKEN" BACKEND_URL/api/export/csv -o inscriptions.csv`

## Sécurité & RGPD (suggestions)
- Ajoutez un captcha (hCaptcha / reCAPTCHA) si nécessaire.
- Cachet d'horodatage stocké automatiquement.
- Index d'unicité (email + épreuve) pour éviter les doublons.

## Personnalisation visuelle
- TailwindCSS, design clean (cartes, boutons arrondis, ombres douces).
- Remplacez le bloc visuel "FPHM • 50 ans" par une image officielle si vous en avez une.

Bon déploiement !


## Email de confirmation & QR code (nouveau)
- À l'inscription, un **email de confirmation** est envoyé (via SMTP configurable) avec un **QR code en pièce jointe** (PNG).
- Lien de confirmation: `GET /api/confirm?token=...` (redirection possible vers `/confirm` du frontend si `FRONTEND_BASE_URL` est défini).
- Le QR code encode un **code de pointage** (check-in). Le jour J, l'admin saisit ce code dans l'onglet **Check-in** de la page `/admin` pour **valider la présence** (horodatée).

### Configuration SMTP (Render)
Définir dans les variables d'environnement du backend :
```
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Pharmathon FPHM <no-reply@exemple.tn>"
PUBLIC_BASE_URL=https://votre-backend.onrender.com
FRONTEND_BASE_URL=https://votre-frontend.vercel.app
```
> Vous pouvez utiliser un service SMTP (Brevo/Sendinblue, Mailgun, Gmail OAuth, etc.).

### Nouveaux endpoints
- `GET /api/confirm?token=...` — confirme l'email du participant.
- `POST /api/admin/checkin` — corps `{ code }`, header `x-admin-token` — marque la présence avec horodatage.
- Export CSV inclut désormais les colonnes `confirmed` et `checkinAt`.

### Idées d'améliorations
- Scanner caméra sur `/admin` (lecteur QR), captcha, emails de rappel, désinscription.


## Scanner QR intégré (caméra)
- Rendez-vous sur `/admin`, saisissez le `ADMIN_TOKEN` puis scrollez vers **Check-in**.
- Autorisez l'accès à la caméra : le **lecteur QR** remplit automatiquement le code et valide la présence.

## Rappels email automatiques
- Un **cron** envoie des emails aux inscrits **confirmés** en J-7, J-3 et J-1 (`TIMEZONE`, `REMINDER_HOUR` configurables).
- Render : pour fiabiliser, préférez un **Render Cron Job** qui appelle périodiquement `POST /api/admin/send-reminders` (avec header `x-admin-token`). Cela évite les limites d'uptime des services gratuits.
