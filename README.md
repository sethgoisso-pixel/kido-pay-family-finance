# KIDO PAY

**Finance parentale & autonomie ado, synchronisées en temps réel.**
Projet réalisé pour le hackathon HyperBloom October 2026 (UI/UX & Web Design).

> 🔗 Démo : _colle ici le lien public_  ·  🎬 Vidéo : _colle ici le lien_

## Le problème

Donner du cash à un ado ne permet aucun suivi. Lui prêter une carte parentale est risqué et source de conflits. Les applications existantes verrouillent des catégories… sans expliquer, sans dialogue. Résultat : l'ado ressent un mur, le parent un rôle de gendarme.

_Point de départ : [1 ou 2 phrases sur ton propre vécu d'étudiant, par exemple une situation où tu as été bloqué sans explication, ou l'inverse]._

## L'idée

**Chaque refus devient une conversation.**

1. Le parent règle l'argent de poche et verrouille des catégories.
2. L'ado voit **pourquoi** et **comment demander** : il choisit un motif en un tap.
3. Le parent répond en un tap : _Oui, une fois_ · _Jusqu'à 10 €_ · _Pas maintenant_ (avec une raison).
4. L'ado voit la réponse, jamais un simple « refusé ».
5. Un **objectif d'épargne** montre l'effet réel d'un achat : « Ça repousse ton objectif de 2 jours ».

## Choix de design

- **Démo double vue** sur desktop : parent et ado côte à côte pour prouver la synchronisation. Sur mobile, plus de faux téléphone : l'expérience occupe tout l'écran avec un sélecteur Parent / Ado.
- **Ton bienveillant** : « Une petite limite, pour le moment », pas « Accès refusé ».
- **Autonomie encadrée** : deux profils (Léo 16 ans, Emma 13 ans) avec des règles, soldes et historiques indépendants.
- **Code couleur fonctionnel** : menthe = solde et gains, indigo = actions, rouge = restrictions.
- **Dark mode et light mode**, le thème système est respecté au premier chargement.

## Accessibilité

- Texte à 12 px minimum, contrastes AA dans les deux thèmes (menthe assombri en mode clair).
- L'information n'est jamais portée par la couleur seule : icône de cadenas + texte « Bloqué par les parents ».
- Respect de `prefers-reduced-motion` (compteur, carte 3D, transitions).
- Le solde animé est ignoré des lecteurs d'écran ; seule la valeur finale est annoncée (`role="status"`).
- Boutons à bascule avec `aria-pressed`, puces de motif en `radiogroup`, dialogues avec focus piégé.
- Cibles tactiles de 44 px minimum sur mobile, focus clavier visible.

## Limites assumées

Démo front-end uniquement : état en mémoire, aucun compte réel, aucun paiement réel.
La carte virtuelle réagit au pointeur et au toucher (pas au gyroscope).

## Lancer le projet

```sh
npm install
npm run dev     # développement
npm test        # tests de la logique métier (vitest)
npm run build   # production
```

**Stack :** React 19, TanStack Start, Tailwind, shadcn/ui, Framer Motion. Construit avec Lovable, puis retravaillé à la main.

**Structure utile :** `src/lib/wallet.ts` (logique pure en centimes, testée) · `src/routes/index.tsx` (interface).
