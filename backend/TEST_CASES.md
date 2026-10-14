# Plan de test — API Dons Grand Tambour

Base : `https://api-fundraising.centreculturel.cd` · Doc interactive : `/api/doc`

> **Légende d'exécution**
> - 🟢 **Testable maintenant** : la validation se fait *avant* l'appel Makuta → indépendant de la signature.
> - 🔴 **Nécessite la signature OK** : dépend de la validation clé publique / X-Extension côté Makuta.
>
> Remplace `243XXXXXXXXX` par un **vrai numéro de test dev** fourni par Makuta. Pour les paiements réels, garde `amount: 1` (palier `ami_citoyen`).

---

## A. Cas nominaux par opérateur (`POST /api/fundraising/donations`)

### A1 — M-Pesa 🔴
```json
{ "donorName": "Test MPesa", "donorEmail": "test+mpesa@centreculturel.cd",
  "donorPhone": "243XXXXXXXXX", "amount": 1, "tier": "ami_citoyen",
  "operator": "DRC_MPESA", "payNumber": "243XXXXXXXXX" }
```
**Attendu** : `201` · `status: pending` · `requiresOtp: false` · `redirectUrl: null`.
**Suite** : push sur le téléphone → valider → poller le statut (§C1) jusqu'à `paid`.

### A2 — Airtel Money 🔴
Identique à A1 avec `"operator": "DRC_AIRTEL_MONEY"`.

### A3 — Orange Money 🔴
Identique à A1 avec `"operator": "DRC_ORANGE_MONEY"`.

### A4 — Afrimoney 🔴
Identique à A1 avec `"operator": "DRC_AFRIMONEY"`.

### A5 — Rakkacash (OTP) 🔴
```json
{ "donorName": "Test Rakkacash", "donorEmail": "test+rakka@centreculturel.cd",
  "donorPhone": "243XXXXXXXXX", "amount": 1, "tier": "ami_citoyen",
  "operator": "DRC_RAKKACASH", "payNumber": "243XXXXXXXXX" }
```
**Attendu** : `201` · `status: pending` · **`requiresOtp: true`**.
**Suite** : OTP reçu par SMS sur le `payNumber` → confirmer (§B) → poller le statut.

### A6 — Visa CNP (carte) 🔴
```json
{ "donorName": "Test Visa", "donorEmail": "test+visa@centreculturel.cd",
  "amount": 1, "tier": "ami_citoyen",
  "operator": "DRC_VISA_CNP", "email": "test+visa@centreculturel.cd" }
```
**Attendu** : `201` · `status: pending` · **`redirectUrl` renseigné**.
**Suite** : ouvrir `redirectUrl` dans le navigateur → saisir la carte → retour + webhook → poller le statut.

---

## B. Confirmation OTP (Rakkacash) 🔴
`POST /api/fundraising/donations/{reference}/confirm-otp`
```json
{ "otpCode": "123456" }
```
- **OTP correct** → `200` · `status: paid`.
- **OTP faux/expiré** → `422` · `code: OTP_INVALID`.
- **Référence inconnue** → `404`.

---

## C. Suivi & lecture

### C1 — Statut d'un don 🟢 (lecture) / 🔴 (transition)
`GET /api/fundraising/donations/status/{reference}`
- Référence existante → `200` · `{ data: { status: pending|paid|failed|expired } }`.
- Référence inconnue → `404`.

### C2 — Statistiques de la collecte 🟢
`GET /api/fundraising/campaign/stats`
→ `200` · `{ data: { currency:"USD", goal:517251, collected, progress, donationsCount } }`.

---

## D. Cas de validation / erreurs 🟢 (tous testables maintenant)

| # | Modification du corps A1 | Attendu |
|---|---|---|
| D1 | `amount: 10000` avec `tier: "ami_citoyen"` (hors bornes 1–4999) | `422` · `code: AMOUNT_OUT_OF_TIER` |
| D2 | `operator: "DRC_MPESA"` **sans** `payNumber` | `422` · `code: PAYNUMBER_REQUIRED` |
| D3 | `tier: "vip"` (inexistant) | `422` · `fields.tier: "Palier inconnu."` |
| D4 | `operator: "DRC_MTN"` (non supporté) | `422` · `fields.operator: "Moyen de paiement non supporté."` |
| D5 | `donorEmail: "pas-un-email"` | `422` · `fields.donorEmail` |
| D6 | sans `amount` | `422` · `fields.amount: "Le montant est requis."` |
| D7 | `amount: -5` | `422` · `fields.amount` (doit être > 0) |
| D8 | `donorName: ""` | `422` · `fields.donorName` |
| D9 | corps JSON malformé (`{` seul) | `400` · `"Requête JSON invalide."` |
| D10 | > 10 requêtes en 5 min depuis la même IP | `429` · trop de tentatives |

---

## E. Bornes des paliers (validation `tier` ↔ `amount`) 🟢

| `tier` | `amount` valide | `amount` rejeté (422) |
|---|---|---|
| `ami_citoyen` | 1 → 4999 | 0, 5000 |
| `parrain` | 5000 → 24999 | 4999, 25000 |
| `mecene` | 25000 → 49999 | 24999, 50000 |
| `grand_mecene` | 50000 → 99999 | 49999, 100000 |
| `partenaire_fondateur` | ≥ 100000 | 99999 |
| `libre` | ≥ 1 | 0 |

> Astuce : pour tester les bornes sans déclencher de vrai paiement, envoie un `amount` **hors bornes** → la requête est rejetée en `422` **avant** tout appel Makuta.

---

## F. Webhook Makuta (interne) 🔴
`POST /api/fundraising/webhooks/makuta` — appelé par Makuta, pas par le frontend.
Corps type reçu :
```json
{ "scope": "ctob", "status": "TS", "message": "Payment processed successfully.",
  "txnId": "0197cb6f-776f-7df0-9535-96082bbff7f9", "callbackReference": "cb-ref-001" }
```
**Attendu** : toujours `200 {"received":true}`. Le don passe à `paid`/`failed` après re-vérification signée auprès de Makuta. (Vérifiable dans `var/log/prod.log` : entrées « Callback Makuta reçu ».)

---

## G. Ordre de test recommandé
1. 🟢 **D1→D10 + E + C2** : valident toute la logique métier **immédiatement** (indépendant de Makuta).
2. 🔴 Une fois la **signature/X-Extension validée par Makuta** : A1 (M-Pesa) bout en bout → C1 → reçu e-mail.
3. 🔴 Puis A5 (Rakkacash + OTP) et A6 (Visa CNP + redirection).
