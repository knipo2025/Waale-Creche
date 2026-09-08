# WAALE-DESIGN.md — Système de design (validé terrain)

Règles de design pour toute l'app. **Chaleureux mais simple** : une crèche/école, c'est
humain et vivant — jamais un tableur froid. Applique ceci à chaque écran, composant ou
modification visuelle. En cas de doute, relis ce fichier avant de coder.

## Principe directeur
Simple à utiliser (comme aujourd'hui) **+** chaleureux à regarder. On ajoute de la
couleur, des visages et des formes douces — on n'ajoute PAS de complexité d'usage.

## Couleurs (tokens)

```
--pin: #0E6659       /* vert WAALE — couleur principale */
--pin-ink: #0B4E44
--pin-soft: #E3EFE9
--terra: #D2694A     /* accent chaud — boutons d'action, "Ajouter" */
--terra-soft: #F7E7DF
--amber: #EFB13F     /* touches de chaleur, logo */
--amber-soft: #FBEFD3
--cream: #FBF7EF     /* fond de l'app (jamais blanc pur partout) */
--surface: #FFFFFF   /* cartes */
--ink: #22302B       /* texte (noir légèrement verdi, pas #000) */
--muted: #7C877F     /* texte secondaire */
--line: rgba(34,48,43,0.09)
```

**Couleurs de sens (statut, ≠ accent) :**

```
--ok: #1E9C69 bg #E1F1E9    /* encaissé, présent, à jour */
--bad: #DC4E38 bg #FBE4DF   /* impayé, absent */
--warn: #E1922B bg #FAEEDA  /* alerte, en attente */
```

Prévoir un thème sombre en réutilisant les mêmes tokens (fond ~#131E1A, texte clair).

## Typographie
Charger via Google Fonts :

`https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap`

- **Baloo 2** (arrondie, chaleureuse) → titres, gros chiffres KPI, noms d'élèves.
- **Nunito** → texte courant, labels, boutons.
- Labels en MAJUSCULES : petit, gras, letter-spacing ~0.10em.

## Formes & profondeur
- Rayons : cartes **20px**, lignes de liste **18px**, boutons/champs **12–14px**, pastilles **999px**.
- Ombres **légères** uniquement (ex. `0 8px 18px -14px rgba(20,40,32,.4)`). Pas d'ombres dures.
- Icônes : style **ligne arrondie** (stroke ~2.2, bouts ronds), dans une pastille de couleur douce.

## Composants clés
- **En-tête d'écran** : bande dégradée verte (`--pin`) avec le **nom de l'école**, sous-titre,
  logo rond (initiales sur `--amber`), cloche de notifications. C'est l'identité, sur chaque écran.
- **Cartes KPI** : colorées **par sens** (Encaissé = vert, Impayés = rouge, Remplissage = vert
  avec barre de progression). Gros chiffre en Baloo 2, label au-dessus, icône en pastille.
- **Avatars élèves** : carré arrondi 44px, **initiales** en blanc sur dégradé coloré (rotation
  de 6 couleurs chaudes). Léger, marche **sans photo** (important : connexion faible). Photo
  optionnelle plus tard.
- **Badges de statut** : pastille colorée — « À jour » (vert), « Doit 25 000 F » (rouge),
  « En attente » (ambre).
- **Bouton d'action principal** : `--terra` (ex. « Ajouter »), texte blanc, arrondi complet.
- **Chips de classe** : `CP`, `CE1`, `Petite section`… sur fond `--pin-soft`, texte vert.

## Responsive — mobile ET ordinateur (règle terrain)
La directrice utilise le **téléphone**, le secrétariat un **PC**. L'app doit être excellente
sur les deux.
- **Mobile (< 768px)** : barre de navigation **en bas** (Accueil, Élèves, Présences, Paiements),
  contenu en 1–2 colonnes, bouton « Ajouter » flottant.
- **Ordinateur (≥ 768px)** : **menu latéral fixe à gauche** (mêmes entrées), contenu large
  centré (max ~1100px). Les listes **Élèves** et **Paiements** deviennent de **vrais tableaux**
  (colonnes triables) pour la saisie et la lecture en volume. Formulaires sur **2 colonnes**.
  KPI sur une rangée de 4 cartes.
- Zones tactiles ≥ 44px, bon contraste, tout en français.

## Ton & microcopie
Humain, pas technique. « Élève enregistré 🎉 » plutôt que « Insertion réussie ».
États vides accueillants : « Aucun élève pour l'instant — Ajouter le premier ».
Les boutons disent l'action exacte (« Enregistrer le paiement »).

## À éviter
Blanc-sur-blanc partout · ombres dures · listes de texte sans visage · jargon technique ·
surcharge (chaleureux ≠ chargé : on garde de l'air).
