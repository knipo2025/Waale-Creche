# WAALE — Socle Design

> Fichier à déposer dans chaque repo WAALE (ou à coller dans ton `CLAUDE.md`).
> Règle pour Claude Code : **tout écran WAALE suit ce document.** Couleurs, typo,
> espacements, composants et règles de simplicité viennent d'ici — on ne réinvente rien.
>
> Ce socle couvre la **famille WAALE** (School, Crédit, Santé, Business…). MAK YAW garde
> sa propre identité (marque grand public, séparée).

---

## 1. Principe directeur

**Simple, rassurant, orienté argent.** Les utilisateurs sont au Sénégal, souvent peu à
l'aise avec la tech, sur des téléphones Android bas/milieu de gamme et une connexion
faible. Une app **claire et évidente** bat une app « belle et maligne ». À chaque écran,
demande-toi : *est-ce qu'un commerçant/une directrice qui découvre l'app comprend en 3
secondes ce qu'il doit faire ?*

Les 6 règles non négociables :

1. **Une seule action principale par écran** (un gros bouton vert évident).
2. **Cibles tactiles ≥ 48px** de haut. Doigts, pas souris.
3. **L'argent est toujours gros, gras, et formaté** : `50 000 FCFA` (espace tous les 3 chiffres).
4. **Toute action sur l'argent = une confirmation claire** avant de valider.
5. **Tolérant à la mauvaise connexion et léger** : pas d'images lourdes, ça doit charger vite.
6. **Rassurer sur l'argent** : l'app ne touche jamais l'argent, c'est un carnet intelligent.
   Le dire dans les textes quand c'est pertinent.

---

## 2. Couleurs (tokens)

```css
:root {
  /* Marque — vert WAALE (confiance, argent) */
  --wa-green-50:  #E7F4EF;
  --wa-green-600: #0E7C5A;  /* actions principales, liens */
  --wa-green-700: #0B5E45;  /* survol / appui, en-têtes */

  /* Sémantique */
  --wa-money:   #0E7C5A;    /* montants positifs / encaissé */
  --wa-danger:  #D92D20;    /* impayés, erreurs */
  --wa-warning: #F79009;    /* à relancer, alertes */

  /* Neutres */
  --wa-ink:     #101828;    /* texte principal */
  --wa-muted:   #667085;    /* texte secondaire */
  --wa-line:    #EAECF0;    /* bordures, séparateurs */
  --wa-bg:      #F7F8F7;    /* fond de l'app (blanc cassé) */
  --wa-surface: #FFFFFF;    /* cartes */
}
```

Équivalent **Tailwind** (`tailwind.config.js` → `theme.extend.colors`) :

```js
colors: {
  wa: {
    green:  { 50:'#E7F4EF', 600:'#0E7C5A', 700:'#0B5E45' },
    money:  '#0E7C5A',
    danger: '#D92D20',
    warning:'#F79009',
    ink:    '#101828',
    muted:  '#667085',
    line:   '#EAECF0',
    bg:     '#F7F8F7',
    surface:'#FFFFFF',
  }
}
```

Usage : le **vert** = actions et argent gagné. Le **rouge** = impayés/erreur uniquement.
L'**ambre** = à relancer/alerte. Jamais de rouge « décoratif ».

---

## 3. Typographie

- **Police** : `Inter` (fallback `system-ui, -apple-system, sans-serif`). Une seule police.
- **Chiffres/argent** : gras (700–800) et alignés (`font-variant-numeric: tabular-nums`).
- **Taille de base 16px minimum** sur mobile (jamais en dessous, sinon illisible).

| Rôle              | Taille | Graisse |
|-------------------|--------|---------|
| Argent (héros)    | 40–48  | 800     |
| Titre écran (H1)  | 24     | 700     |
| Sous-titre (H2)   | 18     | 700     |
| Corps             | 16     | 400     |
| Petit / label     | 14     | 500     |
| Label majuscule   | 12     | 600 (uppercase, muted) |

---

## 4. Espacements, coins, ombres

- **Échelle d'espacement (base 4px)** : `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40`. Rien entre.
- **Coins arrondis** : cartes `16px` · boutons/champs `12px` · pastilles `9999px`.
- **Ombres** : discrètes seulement. Carte = `0 1px 3px rgba(16,24,40,.08)`. Pas d'ombres lourdes.
- **Marge d'écran** : `16px` de chaque côté sur mobile.

---

## 5. Composants (conventions)

**Bouton principal** — fond `--wa-green-600`, texte blanc, hauteur `≥52px`, coins `12px`,
graisse 600, **pleine largeur sur mobile**. Survol/appui → `--wa-green-700`.

**Bouton secondaire** — fond blanc, texte vert, bordure `1px --wa-line`.

**Carte** — fond `--wa-surface`, coins `16px`, padding `20px`, ombre discrète.

**Bloc « argent »** (le plus important) — label majuscule muted `12px` au-dessus, montant
`40px/800` en vert (ou rouge si impayé), une ligne de contexte en dessous. Ex :
`AUJOURD'HUI` → **2 501 FCFA** → « Récupère cette somme en relançant 1 client ».

**Ligne de liste** (client, enfant, paiement) — pastille de statut + nom (gras) à gauche,
montant à droite, bouton d'action (souvent WhatsApp). Hauteur `≥64px`, séparateur `--wa-line`.

**Champ de saisie** — label au-dessus, hauteur `≥48px`, coins `12px`, texte `16px`, bordure
`--wa-line`, focus en vert.

**Barre de navigation basse** — **3 à 4 items maximum**, icône + label, item actif en vert.
Pas de menus profonds.

**État vide** — une phrase chaleureuse + le bouton d'action principal. Jamais un écran nu.
Ex : « Aucun crédit pour l'instant. Note ton premier ! » + bouton.

**Alerte** — bandeau ambre (info/relance) ou rouge (impayé/erreur), icône + texte court.

---

## 6. Argent & confiance (spécifique WAALE)

- Format : `1 234 567 FCFA` — espace comme séparateur de milliers, `FCFA` après, jamais collé.
- Les montants **encaissés** en vert, **impayés/dettes** en rouge. Cohérent partout.
- Avant toute écriture qui touche à l'argent (noter un crédit, enregistrer un paiement) :
  un récap + bouton **Confirmer**. L'utilisateur doit toujours pouvoir vérifier avant de valider.
- Un microtexte de réassurance là où c'est utile : *« WAALE ne touche jamais ton argent —
  c'est ton carnet, en plus intelligent. »*

---

## 7. Ton & textes (UX copy)

- Français **simple et direct**, chaleureux, comme un grand frère. Pas de jargon.
- Phrases courtes. Boutons = un verbe d'action (`Noter un crédit`, `Relancer`, `Enregistrer`).
- Rassurant sur l'argent, valorisant sur le gain (« tu récupères », « déjà encaissé »).

---

## 8. Accessibilité (minimum)

- Contraste texte/fond suffisant (le muted `#667085` sur blanc passe ; ne descends pas plus clair pour du texte utile).
- Cibles tactiles `≥48px`. Espace entre deux boutons cliquables.
- Ne jamais coder une info **uniquement** par la couleur (ajoute un mot ou une icône : « Impayé », pas juste du rouge).

---

## 9. Comment l'utiliser avec Claude Code

1. Dépose ce fichier à la racine de chaque repo WAALE (`WAALE-DESIGN.md`).
2. Dans ton `CLAUDE.md`, ajoute une ligne : *« Tout écran suit WAALE-DESIGN.md (couleurs, typo, composants, règles de simplicité). »*
3. Au démarrage d'un nouvel écran, dis à Claude Code : *« Construis cet écran en suivant WAALE-DESIGN.md. »*
4. Base-toi sur **shadcn/ui + Tailwind** pour les composants (boutons, champs, cartes) — tu pars de patterns éprouvés, tu ne réinventes rien.
5. Après un écran : relis-le contre ce socle (ici avec `design:design-critique`, ou demande à Claude Code de s'auto-vérifier).

> Rappel de discipline : ce socle sert à **construire mieux et plus cohérent**, pas à polir
> avant d'avoir des utilisateurs. Le focus reste l'adoption (WAALE School d'abord).
