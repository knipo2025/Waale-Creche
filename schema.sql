-- Waale Crèche — schéma de référence (à coller dans le SQL Editor de Supabase)
-- Monnaie : franc CFA (FCFA), montants entiers.

create extension if not exists pgcrypto;

-- ============================================================
-- creches
-- Une ligne par crèche. Utilisée notamment pour l'en-tête des reçus PDF.
-- ============================================================
create table if not exists public.creches (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  adresse text,
  telephone text,

  -- Paramètres modifiables depuis l'écran « Paramètres » de l'application.
  capacite integer not null default 100,
  objectif_remplissage integer not null default 90, -- en %
  seuil_impaye_enfant integer not null default 50000, -- FCFA, par enfant
  seuil_impaye_taux integer not null default 10, -- en %, sur le total des impayés vs CA mensuel attendu

  created_at timestamptz not null default now()
);

-- Migration douce si la table existait déjà sans ces colonnes :
alter table public.creches add column if not exists capacite integer not null default 100;
alter table public.creches add column if not exists objectif_remplissage integer not null default 90;
alter table public.creches add column if not exists seuil_impaye_enfant integer not null default 50000;
alter table public.creches add column if not exists seuil_impaye_taux integer not null default 10;

alter table public.creches enable row level security;

create policy "creches_select_own"
  on public.creches for select
  to authenticated
  using (
    id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

create policy "creches_update_own"
  on public.creches for update
  to authenticated
  using (
    id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  )
  with check (
    id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

-- Après avoir créé votre crèche ici, notez son id et utilisez-le comme
-- creche_id dans la table profiles pour vos utilisateurs, par exemple :
-- insert into public.creches (nom, adresse, telephone)
--   values ('Ma Crèche', 'Adresse...', '+225 00 00 00 00')
--   returning id;
-- Les paramètres (capacite, objectif_remplissage, seuil_impaye_enfant,
-- seuil_impaye_taux) prennent leurs valeurs par défaut ci-dessus ; ils sont
-- ensuite modifiables depuis l'écran « Paramètres » de l'application.

-- ============================================================
-- profiles
-- Un profil par utilisateur Supabase Auth, rattaché à une crèche.
-- Provisionné manuellement (ou via trigger à ajouter plus tard) après
-- la création d'un utilisateur dans Supabase Auth.
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  creche_id uuid not null,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

-- Migration douce : Supabase crée parfois déjà une table `profiles` minimale
-- (via un starter/quickstart) avant que ce script ne soit exécuté, auquel cas
-- `create table if not exists` ci-dessus ne fait rien et ces colonnes peuvent
-- manquer.
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- enfants
-- ============================================================
create table if not exists public.enfants (
  id uuid primary key default gen_random_uuid(),
  creche_id uuid not null,

  nom text not null,
  prenom text not null,
  date_naissance date not null,
  sexe text not null check (sexe in ('M', 'F')),

  service text not null check (
    service in ('journee_complete', 'demi_journee_matin', 'demi_journee_apres_midi')
  ),
  option_repas boolean not null default false,
  option_garderie boolean not null default false,

  statut text not null default 'Inscrit' check (statut in ('Inscrit', 'En attente', 'Sorti')),
  date_inscription date not null default current_date,
  date_sortie date,

  allergies text,
  medecin_nom text,
  medecin_telephone text,

  parent1_nom text not null,
  parent1_prenom text not null,
  parent1_telephone text not null,
  parent1_email text,
  parent1_adresse text,

  parent2_nom text,
  parent2_prenom text,
  parent2_telephone text,
  parent2_email text,
  parent2_adresse text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration douce : si la table `enfants` a été créée à la main (Table Editor)
-- ou par une exécution partielle de ce script, certaines colonnes peuvent
-- manquer. Ces ALTER sont sans risque à rejouer (IF NOT EXISTS).
alter table public.enfants add column if not exists nom text not null default '';
alter table public.enfants add column if not exists prenom text not null default '';
alter table public.enfants add column if not exists date_naissance date not null default current_date;
alter table public.enfants add column if not exists sexe text;
alter table public.enfants add column if not exists service text;
alter table public.enfants add column if not exists option_repas boolean not null default false;
alter table public.enfants add column if not exists option_garderie boolean not null default false;
alter table public.enfants add column if not exists statut text not null default 'Inscrit';
alter table public.enfants add column if not exists date_inscription date not null default current_date;
alter table public.enfants add column if not exists date_sortie date;
alter table public.enfants add column if not exists allergies text;
alter table public.enfants add column if not exists medecin_nom text;
alter table public.enfants add column if not exists medecin_telephone text;
alter table public.enfants add column if not exists parent1_nom text not null default '';
alter table public.enfants add column if not exists parent1_prenom text not null default '';
alter table public.enfants add column if not exists parent1_telephone text not null default '';
alter table public.enfants add column if not exists parent1_email text;
alter table public.enfants add column if not exists parent1_adresse text;
alter table public.enfants add column if not exists parent2_nom text;
alter table public.enfants add column if not exists parent2_prenom text;
alter table public.enfants add column if not exists parent2_telephone text;
alter table public.enfants add column if not exists parent2_email text;
alter table public.enfants add column if not exists parent2_adresse text;
alter table public.enfants add column if not exists updated_at timestamptz not null default now();

-- Contraintes check, ajoutées séparément (plutôt que dans le create table) au
-- cas où la table existait déjà sans elles. Valeurs alignées exactement sur
-- les <option value="..."> de src/pages/EnfantFormPage.tsx. Postgres ne
-- supporte pas "add constraint if not exists" : on passe par
-- drop ... if exists + add, ce qui est sans risque à rejouer.
alter table public.enfants drop constraint if exists enfants_sexe_check;
alter table public.enfants add constraint enfants_sexe_check
  check (sexe in ('M', 'F'));

alter table public.enfants drop constraint if exists enfants_service_check;
alter table public.enfants add constraint enfants_service_check
  check (service in ('journee_complete', 'demi_journee_matin', 'demi_journee_apres_midi'));

alter table public.enfants drop constraint if exists enfants_statut_check;
alter table public.enfants add constraint enfants_statut_check
  check (statut in ('Inscrit', 'En attente', 'Sorti'));

create index if not exists enfants_creche_id_idx on public.enfants (creche_id);

alter table public.enfants enable row level security;

create policy "enfants_select_same_creche"
  on public.enfants for select
  to authenticated
  using (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

create policy "enfants_insert_same_creche"
  on public.enfants for insert
  to authenticated
  with check (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

create policy "enfants_update_same_creche"
  on public.enfants for update
  to authenticated
  using (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  )
  with check (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

create policy "enfants_delete_same_creche"
  on public.enfants for delete
  to authenticated
  using (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

-- updated_at automatique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists enfants_set_updated_at on public.enfants;
create trigger enfants_set_updated_at
  before update on public.enfants
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- paiements
-- Nécessaire au calcul du solde impayé affiché sur la fiche enfant.
-- ============================================================
create table if not exists public.paiements (
  id uuid primary key default gen_random_uuid(),
  creche_id uuid not null,
  enfant_id uuid not null references public.enfants (id) on delete cascade,

  type text not null default 'Mensualité' check (type in ('Mensualité', 'Inscription', 'Autre')),
  mois_concerne text check (mois_concerne ~ '^\d{4}-\d{2}$'),
  montant integer not null,
  mode_paiement text not null default 'especes' check (
    mode_paiement in ('especes', 'mobile_money', 'virement', 'cheque')
  ),
  statut text not null default 'En attente' check (statut in ('Reçu', 'En attente', 'Annulé')),
  numero_recu text,
  date_paiement date not null default current_date,

  created_at timestamptz not null default now()
);

-- Migration douce si la table existait déjà avec l'ancien schéma (sans ces colonnes) :
alter table public.paiements add column if not exists type text not null default 'Mensualité';
alter table public.paiements add column if not exists mois_concerne text;
alter table public.paiements add column if not exists mode_paiement text not null default 'especes';
alter table public.paiements add column if not exists numero_recu text;

-- Contraintes check, redéfinies explicitement (drop + add, "add constraint
-- if not exists" n'existe pas en Postgres) au cas où la table existait déjà
-- avec des valeurs différentes. Valeurs alignées sur TypePaiement /
-- StatutPaiement (src/types/paiement.ts, src/types/enfant.ts) et les
-- <option value="..."> de src/pages/PaiementFormPage.tsx.
alter table public.paiements drop constraint if exists paiements_type_check;
alter table public.paiements add constraint paiements_type_check
  check (type in ('Mensualité', 'Inscription', 'Autre'));
alter table public.paiements drop constraint if exists paiements_statut_check;
alter table public.paiements add constraint paiements_statut_check
  check (statut in ('Reçu', 'En attente', 'Annulé'));
alter table public.paiements drop constraint if exists paiements_mode_paiement_check;
alter table public.paiements add constraint paiements_mode_paiement_check
  check (mode_paiement in ('especes', 'mobile_money', 'virement', 'cheque'));

create index if not exists paiements_creche_id_idx on public.paiements (creche_id);
create index if not exists paiements_enfant_id_idx on public.paiements (enfant_id);

alter table public.paiements enable row level security;

-- Numéro de reçu unique et lisible, généré côté base pour éviter toute
-- collision entre requêtes concurrentes : REC-<année>-<compteur sur 6 chiffres>.
create sequence if not exists public.paiements_numero_recu_seq;

create or replace function public.set_numero_recu()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.numero_recu is null then
    new.numero_recu := 'REC-' || to_char(current_date, 'YYYY') || '-' ||
      lpad(nextval('public.paiements_numero_recu_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists paiements_set_numero_recu on public.paiements;
create trigger paiements_set_numero_recu
  before insert on public.paiements
  for each row
  execute function public.set_numero_recu();

create unique index if not exists paiements_numero_recu_key on public.paiements (numero_recu);

create policy "paiements_select_same_creche"
  on public.paiements for select
  to authenticated
  using (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

create policy "paiements_insert_same_creche"
  on public.paiements for insert
  to authenticated
  with check (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

create policy "paiements_update_same_creche"
  on public.paiements for update
  to authenticated
  using (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  )
  with check (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

create policy "paiements_delete_same_creche"
  on public.paiements for delete
  to authenticated
  using (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

-- ============================================================
-- presences
-- Un pointage par enfant et par jour (contrainte unique enfant_id + date).
-- ============================================================
create table if not exists public.presences (
  id uuid primary key default gen_random_uuid(),
  creche_id uuid not null,
  enfant_id uuid not null references public.enfants (id) on delete cascade,

  date date not null default current_date,
  statut text not null check (statut in ('Présent', 'Absent', 'Malade', 'Congé')),
  heure_arrivee time,
  heure_depart time,
  repas boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (enfant_id, date)
);

-- Migration douce (voir la remarque équivalente sur `enfants`) :
alter table public.presences add column if not exists date date not null default current_date;
alter table public.presences add column if not exists statut text;
alter table public.presences add column if not exists heure_arrivee time;
alter table public.presences add column if not exists heure_depart time;
alter table public.presences add column if not exists repas boolean not null default false;
alter table public.presences add column if not exists updated_at timestamptz not null default now();

-- Contrainte check, redéfinie explicitement (voir remarque équivalente sur
-- `paiements`). Valeurs alignées sur StatutPresence (src/types/presence.ts)
-- et les boutons de src/components/PresenceRow.tsx.
alter table public.presences drop constraint if exists presences_statut_check;
alter table public.presences add constraint presences_statut_check
  check (statut in ('Présent', 'Absent', 'Malade', 'Congé'));

-- Contrainte unique, redéfinie explicitement pour la même raison : sans elle,
-- upsertPresence() (src/lib/presences.ts, onConflict: 'enfant_id,date') échoue
-- avec "no unique or exclusion constraint matching the ON CONFLICT specification".
-- Si cette commande échoue avec une erreur de doublon, supprimez d'abord les
-- présences en double pour un même (enfant_id, date) avant de la relancer.
alter table public.presences drop constraint if exists presences_enfant_id_date_key;
alter table public.presences add constraint presences_enfant_id_date_key
  unique (enfant_id, date);

create index if not exists presences_creche_id_idx on public.presences (creche_id);
create index if not exists presences_date_idx on public.presences (date);

alter table public.presences enable row level security;

create policy "presences_select_same_creche"
  on public.presences for select
  to authenticated
  using (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

create policy "presences_insert_same_creche"
  on public.presences for insert
  to authenticated
  with check (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

create policy "presences_update_same_creche"
  on public.presences for update
  to authenticated
  using (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  )
  with check (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

create policy "presences_delete_same_creche"
  on public.presences for delete
  to authenticated
  using (
    creche_id = (select p.creche_id from public.profiles p where p.id = auth.uid())
  );

drop trigger if exists presences_set_updated_at on public.presences;
create trigger presences_set_updated_at
  before update on public.presences
  for each row
  execute function public.set_updated_at();
