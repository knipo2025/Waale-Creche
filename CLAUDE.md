# Waale Crèche

Application mobile-first de gestion de crèche (React + TypeScript + Vite + Tailwind + Supabase), en français. Monnaie : **franc CFA (FCFA)**, montants entiers, jamais d'euro. Affichage : `60 000 FCFA` (espace comme séparateur de milliers, suffixe " FCFA").

> **DESIGN : pour tout écran/composant/modif visuelle, applique STRICTEMENT
> WAALE-DESIGN.md. Relis-le avant de coder du visuel.**

## Règles métier

### Groupe d'âge (calculé depuis `date_naissance`, en mois)

| Groupe | Âge |
|---|---|
| Bébés | 0 à 12 mois |
| Moyens | 13 à 24 mois |
| Grands | 25 mois et plus |

### Tarif mensuel de base (FCFA), selon groupe × service

| Groupe | Journée complète | Demi-journée matin | Demi-journée après-midi |
|---|---|---|---|
| Bébés | 60 000 | 35 000 | 35 000 |
| Moyens | 50 000 | 30 000 | 30 000 |
| Grands | 45 000 | 25 000 | 25 000 |

### Options (ajoutées au tarif de base)

- Option repas : + 8 000 / mois
- Option garderie soir : + 10 000 / mois

```
tarif_mensuel = tarif_de_base(groupe, service)
              + (option_repas ? 8000 : 0)
              + (option_garderie ? 10000 : 0)
```

### Frais d'inscription

25 000 FCFA, une seule fois (jamais inclus dans la mensualité).

### Solde impayé d'un enfant

```
solde_impaye = (mois_ecoules_depuis_inscription × tarif_mensuel)
             + frais_inscription
             − somme(paiements au statut « Reçu » de cet enfant)
```

`mois_ecoules_depuis_inscription` = nombre de mois pleins entre `date_inscription` et aujourd'hui (même méthode que le calcul d'âge en mois : différence de mois, décrémentée de 1 si le jour du mois courant est antérieur au jour de la date de départ). Implémenté une seule fois dans `src/lib/tariffs.ts` (`monthsBetween`), réutilisé pour l'âge et pour l'ancienneté d'inscription — ne pas dupliquer cette logique ailleurs.

Le groupe et le tarif mensuel ne sont **jamais stockés en base** : ils sont dérivés de `date_naissance` / `service` / options et recalculés à chaque affichage, car l'âge change avec le temps (un enfant peut changer de groupe). Seule la donnée brute (date de naissance, service, options) est persistée.

## Conventions du projet

- Toutes les requêtes de données métier (`enfants`, `paiements`, ...) sont filtrées par `creche_id`, dérivé du profil de l'utilisateur connecté (`profiles.creche_id`), jamais saisi manuellement dans un formulaire.
- RLS Supabase : chaque table métier restreint l'accès aux lignes dont `creche_id` correspond à celui du profil de l'utilisateur authentifié.
- Le schéma SQL de référence vit dans `schema.sql` à la racine (à coller dans le SQL Editor de Supabase).
- Tout écran suit strictement WAALE-DESIGN.md (couleurs, typo, composants, règles de simplicité, responsive).
