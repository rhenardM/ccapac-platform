# Backend Dons — Grand Tambour · Contrat d'API

Backend Symfony **dédié au paiement** de la collecte de dons de la Biblio-Librairie du
Grand Tambour. Il dialogue avec la passerelle **Makuta Cash** ; le frontend **Next.js**
ne parle qu'à ce backend (jamais à Makuta, jamais aux clés).

- Devise : **USD** (Makuta convertit automatiquement vers la devise de l'opérateur).
- Toutes les réponses sont en JSON et enveloppées dans `{ "data": ... }` (ou `{ "error": ... }`).
- **Base URL (prod)** : `https://api-fundraising.centreculturel.cd`
- **Préfixe** : toutes les routes sont sous `/api/fundraising/` (namespace dédié pour cohabiter
  avec l'autre service sur la même IP/hébergement Hostinger).
- **📖 Doc interactive (Swagger UI)** : `https://api-fundraising.centreculturel.cd/api/doc`
  — testable depuis le navigateur (« Try it out »). Spéc OpenAPI brute : `/api/doc.json`.

---

## 1. Créer un don et initier le paiement

```
POST /api/fundraising/donations
Content-Type: application/json
```

### Corps de la requête

| Champ        | Type             | Requis | Description |
|--------------|------------------|--------|-------------|
| `donorName`  | string           | ✅ | Nom complet **ou** raison sociale |
| `donorEmail` | string (email)   | ✅ | Sert au reçu et au suivi |
| `donorPhone` | string           | ⬜ | Téléphone (optionnel) |
| `amount`     | number           | ✅ | Montant en USD (> 0) |
| `tier`       | string           | ✅ | Palier (voir §5) |
| `operator`   | string           | ✅ | Code opérateur (voir §6) |
| `payNumber`  | string           | ⚠️ | Numéro Mobile Money — **requis** pour les opérateurs Mobile Money. Format `+243…` accepté. |
| `email`      | string (email)   | ⚠️ | E-mail de paiement carte — utilisé pour `DRC_VISA_CNP` (sinon `donorEmail`). |

Exemple :

```json
{
  "donorName": "Parfait Munongo",
  "donorEmail": "rhenardmunongo@gmail.com",
  "donorPhone": "+243821441909",
  "amount": 50,
  "tier": "ami_citoyen",
  "operator": "DRC_MPESA",
  "payNumber": "+243821441909"
}
```

### Réponse `201 Created`

```json
{
  "data": {
    "reference": "GT-DON-2026-AB7K9P",
    "status": "pending",
    "amount": "50.00",
    "currency": "USD",
    "tier": "ami_citoyen",
    "tierLabel": "Ami & Citoyen",
    "operator": "DRC_MPESA",
    "operatorLabel": "M-Pesa",
    "makutaTransactionId": "test-txn-123",
    "redirectUrl": null,
    "requiresOtp": false,
    "message": null,
    "createdAt": "2026-06-19T14:30:00+00:00",
    "confirmedAt": null
  }
}
```

### Ce que le frontend doit faire selon la réponse

- **Mobile Money** (`redirectUrl` = null, `requiresOtp` = false) → afficher « Validez la demande
  sur votre téléphone », puis **poller** `/api/fundraising/donations/status/{reference}`.
- **Rakkacash** (`requiresOtp` = true) → demander le code OTP reçu par SMS, puis appeler §3.
- **Carte Visa** (`redirectUrl` ≠ null) → **rediriger** le navigateur vers `redirectUrl`
  (page carte sécurisée Makuta). Le retour se fait via §4, puis poller le statut.

### Erreurs

- `422` validation / métier : `{ "error": "...", "code": "AMOUNT_OUT_OF_TIER", "field": "amount" }`
  (codes : `AMOUNT_OUT_OF_TIER`, `PAYNUMBER_REQUIRED`, `EMAIL_REQUIRED`, `PAYMENT_REFUSED`,
  `PAYMENT_GATEWAY_UNAVAILABLE`).
- `400` JSON invalide · `429` trop de tentatives (10 / 5 min par IP) · `500` erreur interne.

---

## 2. Suivre le statut d'un don (polling)

```
GET /api/fundraising/donations/status/{reference}
```

Si le don est encore `pending`, le backend interroge Makuta en direct (rattrape un callback
perdu). Réponse identique à §1 (`{ "data": { … } }`). Statuts possibles :

| `status`  | Signification |
|-----------|---------------|
| `pending` | En attente (continuer à poller, ~ toutes les 3 s) |
| `paid`    | Don confirmé ✅ (un reçu e-mail est envoyé) |
| `failed`  | Paiement échoué/refusé |
| `expired` | Expiré faute de confirmation |

`404` si la référence est inconnue.

---

## 3. Confirmer un code OTP (Rakkacash)

```
POST /api/fundraising/donations/{reference}/confirm-otp
Content-Type: application/json

{ "otpCode": "256532" }
```

Réponse `{ "data": { … } }` (statut rafraîchi). `422` avec `code: OTP_INVALID` si le code est
mauvais/expiré, `404` si référence inconnue.

---

## 4. Retour de paiement carte (Visa CNP)

```
GET|POST /api/fundraising/paiement/retour
```

Point d'atterrissage du navigateur après la page carte Makuta. Le backend redirige (302) le
donateur vers `{{APP_PUBLIC_URL}}/don/{reference}`. Le frontend y affiche le statut (via §2).
La **confirmation réelle** du paiement arrive par webhook (§7), pas par ce retour.

---

## 5. Paliers de contribution (`tier`)

| Code                   | Libellé                        | Bornes (USD)        |
|------------------------|--------------------------------|---------------------|
| `ami_citoyen`          | Ami & Citoyen                  | 1 – 4 999           |
| `parrain`              | Parrain de Rayon / Collection  | 5 000 – 24 999      |
| `mecene`               | Mécène Biblio-Librairie        | 25 000 – 49 999     |
| `grand_mecene`         | Grand Mécène                   | 50 000 – 99 999     |
| `partenaire_fondateur` | Partenaire Fondateur           | 100 000 +           |
| `libre`                | Montant libre                  | 1 +                 |

Le backend **valide** que `amount` respecte les bornes du `tier` (sinon `422`).

## 6. Opérateurs (`operator`) — activés

`DRC_MPESA`, `DRC_AIRTEL_MONEY`, `DRC_ORANGE_MONEY`, `DRC_AFRIMONEY`, `DRC_RAKKACASH`
(Mobile Money), `DRC_VISA_CNP` (carte Visa web).

> ⚠️ **Mastercard** n'est pas supporté par Makuta (seul Visa l'est). À retirer du formulaire.
> **Virement bancaire** (First Bank / Ecobank / FINCA) : flux non encore documenté côté Makuta.

---

## 7. Statistiques de la collecte

```
GET /api/fundraising/campaign/stats
```

```json
{
  "data": {
    "currency": "USD",
    "goal": 517251,
    "collected": 12450.0,
    "progress": 2.41,
    "donationsCount": 37
  }
}
```

(`collected`/`donationsCount` ne comptent que les dons `paid`.)

---

## 8. Webhook Makuta (interne, à configurer à l'onboarding)

```
POST /api/fundraising/webhooks/makuta
```

Reçoit `{ scope, status, message, txnId, callbackReference }`, re-vérifie le statut réel auprès
de Makuta (requête signée — c'est elle qui fait foi, pas le callback), met à jour le don de façon
idempotente, répond toujours `200`. Pas de secret dans l'URL (demande Makuta : chemin trop long) ;
la sécurité vient de la re-vérification serveur. **Cette URL doit être communiquée à Makuta.**

---

## 9. Mise en service

1. `composer install`
2. Renseigner `.env.local` :
   - `DATABASE_URL` (MySQL/MariaDB Hostinger)
   - `MAKUTA_ENV` (`dev` puis `prod`), `MAKUTA_CLIENT_ID`, `MAKUTA_CLIENT_SECRET`,
     `MAKUTA_X_EXTENSION`, `MAKUTA_PRIVATE_KEY_PEM` (ou `MAKUTA_PRIVATE_KEY_PATH`)
   - `CORS_ALLOW_ORIGIN` (domaine du site Next.js), `APP_PUBLIC_URL`
   - `MAILER_DSN`, `MAILER_FROM_ADDRESS`, `MAILER_FROM_NAME`
3. `php bin/console doctrine:database:create` puis `php bin/console doctrine:migrations:migrate`
4. Générer la paire RSA, envoyer **la clé publique** + l'URL de callback à `support@makuta.cash`.
5. Vérifier la connexion : `php bin/console app:makuta:test`
6. Cron : `app:donations:reconcile` (~2 min) et `app:donations:expire` (~10 min).

> Passage en prod : il suffit de changer les valeurs `MAKUTA_*` (et `MAKUTA_ENV=prod`) dans
> `.env.local` — aucun changement de code.
