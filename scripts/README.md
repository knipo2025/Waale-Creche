# Import CSV (enfants / paiements)

Importe en masse des fichiers CSV exportés depuis Excel dans les tables Supabase
`enfants` et `paiements`, pour une crèche donnée (`creche_id`).

## 1. Préparer l'accès à Supabase

Le script écrit directement dans la base, en contournant les règles RLS (accès
normalement réservé à l'utilisateur connecté d'une seule crèche) : il lui faut
donc la **clé "service_role"**, pas la clé "anon" utilisée par l'application.

1. Dans Supabase → *Project Settings* → *API*, copiez :
   - **Project URL**
   - **service_role key** (⚠️ secrète — jamais celle utilisée dans `.env` de l'app, jamais préfixée `VITE_`, jamais commitée)
2. Copiez `.env.import.example` vers `.env.import` à la racine du projet et renseignez les deux valeurs :

   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```

   `.env.import` est ignoré par git (voir `.gitignore`) — ne le partagez jamais.

## 2. Préparer les fichiers CSV

Dans Excel, utilisez **Fichier → Enregistrer sous → CSV UTF-8 (délimité par des
virgules)**, pas « CSV (délimité par des points-virgules) » simple : cela évite
que les caractères accentués (é, è, à...) soient corrompus. Le script détecte
automatiquement `,` ou `;` comme séparateur, donc les deux fonctionnent, mais
l'encodage UTF-8 est important.

Des gabarits avec les bons en-têtes sont fournis dans `scripts/templates/` :
`enfants.example.csv` et `paiements.example.csv`. Copiez-les et remplacez les
données d'exemple par les vôtres, sans changer les noms de colonnes.

### enfants.csv — colonnes attendues

| Colonne | Obligatoire | Valeurs acceptées |
|---|---|---|
| `nom`, `prenom` | oui | texte |
| `date_naissance` | oui | `AAAA-MM-JJ` ou `JJ/MM/AAAA` |
| `sexe` | oui | `M` / `F` (ou `Masculin` / `Féminin`) |
| `service` | oui | `Journée complète`, `Demi-journée matin`, `Demi-journée après-midi` |
| `option_repas`, `option_garderie` | oui | `oui` / `non` |
| `statut` | non (défaut `Inscrit`) | `Inscrit`, `En attente`, `Sorti` |
| `date_inscription` | non (défaut : aujourd'hui) | `AAAA-MM-JJ` ou `JJ/MM/AAAA` |
| `date_sortie` | requis si `statut = Sorti` | `AAAA-MM-JJ` ou `JJ/MM/AAAA` |
| `allergies`, `medecin_nom`, `medecin_telephone` | non | texte libre |
| `parent1_nom`, `parent1_prenom`, `parent1_telephone` | oui | texte |
| `parent1_email`, `parent1_adresse` | non | texte libre |
| `parent2_*` (mêmes colonnes) | non | texte libre |

### paiements.csv — colonnes attendues

Un paiement référence un enfant **par son nom**, pas par un identifiant technique
(les identifiants sont générés par Supabase à l'import des enfants, donc inconnus
à l'avance).

| Colonne | Obligatoire | Valeurs acceptées |
|---|---|---|
| `enfant_nom`, `enfant_prenom` | oui | doivent correspondre exactement à un enfant déjà dans Supabase (importé avant, ou via ce même lancement avec `--enfants`) |
| `enfant_date_naissance` | requis seulement si deux enfants portent le même nom/prénom | `AAAA-MM-JJ` ou `JJ/MM/AAAA` |
| `type` | non (défaut `Mensualité`) | `Mensualité`, `Inscription` (ou `Frais d'inscription`), `Autre` |
| `mois_concerne` | oui si `type = Mensualité` | `AAAA-MM` ou `MM/AAAA` |
| `montant` | oui | nombre entier (les espaces et « FCFA » sont tolérés, ex. `60 000 FCFA`) |
| `mode_paiement` | non (défaut `Espèces`) | `Espèces`, `Mobile Money`, `Virement bancaire`, `Chèque` |
| `statut` | non (défaut `Reçu`) | `Reçu`, `En attente`, `Annulé` |
| `date_paiement` | non (défaut : aujourd'hui) | `AAAA-MM-JJ` ou `JJ/MM/AAAA` |

Le numéro de reçu (`numero_recu`) est généré automatiquement par Supabase à
l'insertion — ne pas l'inclure dans le CSV.

## 3. Trouver le `creche_id`

Dans le SQL Editor de Supabase :

```sql
select id, nom from public.creches;
```

## 4. Lancer l'import

Toujours commencer par `--dry-run` : le script valide et affiche un résumé
**sans rien écrire** dans Supabase, pour repérer les erreurs avant d'importer
pour de vrai.

```bash
npm run import:csv -- --creche-id <uuid> --enfants enfants.csv --paiements paiements.csv --dry-run
```

Si le résumé est satisfaisant, relancez sans `--dry-run` :

```bash
npm run import:csv -- --creche-id <uuid> --enfants enfants.csv --paiements paiements.csv
```

Vous pouvez importer un seul des deux fichiers (`--enfants` seul ou `--paiements`
seul). Pour importer des paiements concernant des enfants déjà présents dans
Supabase (pas dans ce lancement), inutile de repasser `--enfants` : le script
recherche toujours les enfants existants de la crèche avant de traiter
`paiements.csv`.

### Options

| Option | Effet |
|---|---|
| `--creche-id <uuid>` | Obligatoire. Crèche cible. |
| `--enfants <fichier>` | Chemin vers enfants.csv |
| `--paiements <fichier>` | Chemin vers paiements.csv |
| `--dry-run` | Valide et affiche un résumé sans écrire dans Supabase |
| `--delimiter ";"` | Force le séparateur CSV (sinon auto-détecté) |
| `--help` | Affiche l'aide |

## 5. Lire le résultat

Le script affiche, pour chaque fichier :
- le nombre de lignes valides insérées ;
- chaque ligne ignorée avec le numéro de ligne et la raison précise (ex.
  `Ligne 4 ignorée : sexe invalide : "X"`).

Une ligne ignorée n'interrompt pas l'import des autres lignes valides. Corrigez
le CSV pour les lignes signalées et relancez — les lignes déjà importées avec
succès ne sont pas dédupliquées automatiquement, donc ne relancez pas un import
déjà réussi sans retirer les lignes concernées du fichier.
