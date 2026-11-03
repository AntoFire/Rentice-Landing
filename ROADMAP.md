# Rentice — Roadmap

Source : `funnel-paiement-automation_46469972.md` (tunnel de paiement & automatisation), recoupé avec l'état réel du site et les règles du projet.

## Règles à ne pas casser

- Jamais de promesse d'entretien ou d'embauche : la garantie porte sur l'effort (volume/qualité + jusqu'à 3 campagnes, 2 relances gratuites).
- Aucun chiffre, témoignage ou nom d'entreprise inventé. Donnée manquante → `TODO(antonin)`.
- Stats approuvées (Lemlist, juin–août 2026, 15 campagnes) : 1 714 emails / 177 réponses / 10 %.
- Interdit à l'affichage : taux d'ouverture, nombre d'entretiens, benchmarks non sourcés.
- Contact : rentice.contact@gmail.com. CTA → Jotform. Paiement Stripe. Légal : Antonin CREIGNOU, particulier, non assujetti TVA.

## Tunnel cible (5 étapes)

Jotform → e-mail A immédiat → ciblage sous 24 h → e-mail B (GO + lien de paiement 49 €) → Stripe → e-mail C (lancement sous 48 h). Rappels D à J+1 / J+3. Règle : aucun lead sans nouvelles plus de 48 h.

## Phase 1 — Hors repo, manuel (à faire en premier, ~3 h)

- [ ] Stripe : activer Payment Links, créer le lien modèle 49 €
- [ ] Cal.com : créneau « Onboarding Rentice » 15 min
- [ ] Jotform : champ e-mail, upload CV, lien Cal.com sur la page de confirmation, e-mail auto = template A
- [ ] Google Sheet « Pipeline » (statuts : Nouveau → Ciblage envoyé → En attente paiement → Payé → En cours → Bilan → Campagne 2/3 ou Terminé)
- [ ] Rédiger les templates A à E (voir adaptations ci-dessous)

## Phase 2 — Site (repo) : ajustements sûrs

Le site décrit déjà le bon parcours (« Onboarding gratuit → validation du ciblage → paiement 49 € → lancement sous 48 h », index.html) et la CGV dit déjà que le paiement intervient après validation du ciblage. Rien à changer pour le tunnel lui-même.

- [ ] Quand Cal.com existe : ajouter un lien de réservation de créneau sur la page de remerciement (côté Jotform, pas dans le repo)
- [ ] Garder le CTA Jotform partout ; **ne pas** mettre de bouton de paiement direct sur la landing (le paiement ne vient qu'après validation du ciblage)
- [ ] « Places limitées — 5 campagnes par semaine » : la mention existe déjà (statique). Ne passer à un compteur « places restantes » que si le Sheet est réellement tenu à jour, sinon c'est de la fausse rareté
- [ ] Politique de confidentialité : si on supprime les listings recruteurs à J+60 (recommandé dans le doc), aligner la durée affichée (aujourd'hui 3 ans) — une durée plus courte reste conforme

## Phase 3 — Automatisation (seulement au-delà de ~10–15 formulaires/semaine)

- [ ] Webhook Jotform → ligne Sheets « Nouveau » + e-mail A
- [ ] Cron quotidien : « Ciblage envoyé » sans paiement > 24 h → e-mail D (J+1 puis J+3) + notification
- [ ] Webhook Stripe `payment.succeeded` → facture + e-mail C + notification
- [ ] Bouton « Bilan » → e-mail E
- [ ] Garder l'e-mail B (ciblage validé) manuel

## Phase 4 — Preuve & parrainage

- [ ] Bilan à J+14 : demander une capture anonymisée **avec accord explicite écrit** de l'étudiant avant toute publication
- [ ] Parrainage (-10 € pour le parrain et le filleul) : décision à prendre ; si retenu, l'écrire dans les CGV (prix et remises) avant de le proposer
- [ ] Verbatims recruteurs / étudiants : uniquement réels et autorisés, sinon rester sur `TODO(antonin)`

## Adaptations obligatoires du document source

| Dans le doc | À corriger | Pourquoi |
|---|---|---|
| « 40–60 recruteurs » (e-mail A) | « nombre illimité, en moyenne 200 à 300 » | Mode 2026-2027, CGV art. 2 |
| Séquence « J0 / J3 / J9 », points J+3 / J+9 | J+0 / J+2 / J+5 (5 jours) | Séquence réelle et CGV |
| « taux de réponse vs 7 % base » (KPI) | base 10 % | Stats mises à jour |
| E-mail E : « {{y}} entretiens » dans l'objet et le tableau | « {{x}} réponses » uniquement | Pas de suivi systématique des entretiens ; interdit d'afficher un nombre d'entretiens |
| « Payment reçu 👌 », emojis | à retirer ou à garder en connaissance de cause | Ton du site sans emoji |
| « Conseils préparation » à l'entretien (E) | à retirer ou à cadrer | La CGV exclut la préparation aux entretiens |
| Garantie « relances » | OK, déjà alignée sur CGV art. 4 | Ne jamais écrire « on garantit un entretien » |
| Envois max ~20/jour par boîte froide | à respecter dans la configuration Lemlist | Délivrabilité |

## Déjà ouvert sur le site (TODO existants)

AUT-02 / EML-02 (exemple d'e-mail anonymisé), RES-01 (benchmark sourcé), RES-02 (suivi des entretiens), verbatim recruteur, pages villes (LYO-02, BDX-02), CGV-05/06, JNT-02/03, MCA-01/02/03, ESC-01/02/03, PAR-01/02.
