/**
 * Référentiel véhicules : catégories → modèles (photos optionnelles via `imageUrl` ; sinon placeholder).
 */
export interface VehicleModelVariant {
  id: string;
  modelLabel: string;
  vehiculeMarque: string;
  imageUrl?: string;
}

export interface VehiclePickItem {
  name: string;
  vehiculeType: string;
  vehiculeMarque: string;
  vehiculeGenre?: string;
  estimationHint: string;
  models: VehicleModelVariant[];
}

export interface VehicleRegionGroup {
  id: string;
  title: string;
  subtitle: string;
  items: VehiclePickItem[];
}

/** Dégâts saisis sur le schéma 4 vues (stockés avec le préremplissage rapport). */
export interface ExpertisePrefillDamage {
  view: string;
  partId: string;
  partLabel: string;
  types: string[];
  /** Montant TTC indicatif (€), chaîne pour le champ rapport */
  montantEstime?: string;
}

export interface ExpertisePrefillPayload {
  vehiculeType: string;
  vehiculeMarque: string;
  vehiculeGenre?: string;
  selectionLabel?: string;
  estimationHint?: string;
  damages?: ExpertisePrefillDamage[];
}

function m(id: string, modelLabel: string, marque: string, imageUrl?: string): VehicleModelVariant {
  return { id, modelLabel, vehiculeMarque: marque, imageUrl };
}

export const VEHICLE_SELECTION_CATALOG: VehicleRegionGroup[] = [
  {
    id: 'europe',
    title: 'Europe',
    subtitle: 'Sedans, city cars, wagons — common bumper, wing, and light impacts',
    items: [
      {
        name: 'Citadine (A-segment)',
        vehiculeType: 'Citadine',
        vehiculeMarque: 'Renault / Peugeot / VW',
        vehiculeGenre: 'VL',
        estimationHint: 'Chocs parking, optiques avant, pare-chocs plastique.',
        models: [
          m('eu-cit-clio', 'Renault Clio V', 'Renault'),
          m('eu-cit-twingo', 'Renault Twingo III', 'Renault'),
          m('eu-cit-208', 'Peugeot 208 II', 'Peugeot'),
          m('eu-cit-e208', 'Peugeot e-208', 'Peugeot'),
          m('eu-cit-polo', 'Volkswagen Polo VI', 'Volkswagen'),
          m('eu-cit-up', 'Volkswagen up!', 'Volkswagen'),
          m('eu-cit-fabia', 'Škoda Fabia IV', 'Škoda'),
          m('eu-cit-corsa', 'Opel Corsa F', 'Opel'),
        ],
      },
      {
        name: 'Compacte / berline (C-D)',
        vehiculeType: 'Berline',
        vehiculeMarque: 'Peugeot / BMW / Mercedes',
        vehiculeGenre: 'VL',
        estimationHint: 'Structure portes, longerons légers, radars ADAS.',
        models: [
          m('eu-comp-308', 'Peugeot 308 III', 'Peugeot'),
          m('eu-comp-508', 'Peugeot 508 II', 'Peugeot'),
          m('eu-comp-320', 'BMW Série 3 (G20)', 'BMW'),
          m('eu-comp-c', 'Mercedes Classe C (W206)', 'Mercedes-Benz'),
          m('eu-comp-a4', 'Audi A4 B9', 'Audi'),
          m('eu-comp-passat', 'Volkswagen Passat B8', 'Volkswagen'),
        ],
      },
      {
        name: 'Break / SW',
        vehiculeType: 'Break',
        vehiculeMarque: 'Skoda / Audi / Volvo',
        vehiculeGenre: 'VL',
        estimationHint: 'Hayon, vitrage arrière, seuil de coffre.',
        models: [
          m('eu-br-octavia', 'Škoda Octavia Combi', 'Škoda'),
          m('eu-br-superb', 'Škoda Superb Combi', 'Škoda'),
          m('eu-br-a4av', 'Audi A4 Avant', 'Audi'),
          m('eu-br-v60', 'Volvo V60 II', 'Volvo'),
          m('eu-br-308sw', 'Peugeot 308 SW', 'Peugeot'),
        ],
      },
      {
        name: 'Monospace',
        vehiculeType: 'Monospace',
        vehiculeMarque: 'Renault Scenic / Citroën',
        vehiculeGenre: 'VL',
        estimationHint: 'Glissières portes coulissantes, montants centraux.',
        models: [
          m('eu-mo-scenic', 'Renault Scénic IV', 'Renault'),
          m('eu-mo-grand', 'Renault Grand Scénic IV', 'Renault'),
          m('eu-mo-c4', 'Citroën C4 Picasso / SpaceTourer', 'Citroën'),
          m('eu-mo-zafira', 'Opel Zafira Life', 'Opel'),
          m('eu-mo-touran', 'Volkswagen Touran', 'Volkswagen'),
        ],
      },
    ],
  },
  {
    id: 'asie',
    title: 'Asie & Pacifique',
    subtitle: 'Compact SUVs, sedans, EVs — batteries and sensors',
    items: [
      {
        name: 'SUV compact',
        vehiculeType: 'SUV',
        vehiculeMarque: 'Toyota / Honda / Hyundai',
        vehiculeGenre: 'VL',
        estimationHint: 'Pare-chocs noir plastique, caméras 360°, radar ACC.',
        models: [
          m('as-suv-rav4', 'Toyota RAV4 V', 'Toyota'),
          m('as-suv-crv', 'Honda CR-V V', 'Honda'),
          m('as-suv-tucson', 'Hyundai Tucson IV', 'Hyundai'),
          m('as-suv-sportage', 'Kia Sportage V', 'Kia'),
          m('as-suv-xtrail', 'Nissan X-Trail IV', 'Nissan'),
        ],
      },
      {
        name: 'SUV premium',
        vehiculeType: 'SUV',
        vehiculeMarque: 'Lexus / Infiniti',
        vehiculeGenre: 'VL',
        estimationHint: 'Projecteurs LED, calandre, éléments aluminium.',
        models: [
          m('as-pre-nx', 'Lexus NX II', 'Lexus'),
          m('as-pre-rx', 'Lexus RX IV / V', 'Lexus'),
          m('as-pre-qx50', 'Infiniti QX50', 'Infiniti'),
          m('as-pre-qx60', 'Infiniti QX60 II', 'Infiniti'),
        ],
      },
      {
        name: 'Berline asiatique',
        vehiculeType: 'Berline',
        vehiculeMarque: 'Toyota Camry / Mazda',
        vehiculeGenre: 'VL',
        estimationHint: 'Ailes avant, capot, phares xenon/LED.',
        models: [
          m('as-ber-camry', 'Toyota Camry XV70', 'Toyota'),
          m('as-ber-corolla', 'Toyota Corolla XII', 'Toyota'),
          m('as-ber-mazda6', 'Mazda 6 GJ', 'Mazda'),
          m('as-ber-accord', 'Honda Accord X', 'Honda'),
        ],
      },
      {
        name: 'Citadine urbaine',
        vehiculeType: 'Citadine',
        vehiculeMarque: 'Suzuki / Kia',
        vehiculeGenre: 'VL',
        estimationHint: 'Ailes plastiques, rétroviseurs, petits chocs ville.',
        models: [
          m('as-cit-swift', 'Suzuki Swift IV', 'Suzuki'),
          m('as-cit-ignis', 'Suzuki Ignis II', 'Suzuki'),
          m('as-cit-picanto', 'Kia Picanto III', 'Kia'),
          m('as-cit-rio', 'Kia Rio IV', 'Kia'),
        ],
      },
    ],
  },
  {
    id: 'americas',
    title: 'Americas',
    subtitle: 'Pickups, full-size SUVs — structural impacts and bed sides',
    items: [
      {
        name: 'Pick-up double cabine',
        vehiculeType: 'Pick-up',
        vehiculeMarque: 'Ford F-150 / RAM',
        vehiculeGenre: 'VL',
        estimationHint: 'Benne, ridelles, marchepieds, passages de roue.',
        models: [
          m('am-pu-f150', 'Ford F-150 XIV', 'Ford'),
          m('am-pu-silverado', 'Chevrolet Silverado', 'Chevrolet'),
          m('am-pu-ram', 'RAM 1500 DT', 'RAM'),
          m('am-pu-tundra', 'Toyota Tundra III', 'Toyota'),
        ],
      },
      {
        name: 'SUV pleine taille',
        vehiculeType: 'SUV',
        vehiculeMarque: 'Chevrolet Tahoe / Jeep',
        vehiculeGenre: 'VL',
        estimationHint: 'Pare-chocs massifs, barres de toit, vitres latérales.',
        models: [
          m('am-suv-tahoe', 'Chevrolet Tahoe V', 'Chevrolet'),
          m('am-suv-suburban', 'Chevrolet Suburban', 'Chevrolet'),
          m('am-suv-wrangler', 'Jeep Wrangler JL', 'Jeep'),
          m('am-suv-grand', 'Jeep Grand Cherokee WL', 'Jeep'),
        ],
      },
      {
        name: 'Berline US',
        vehiculeType: 'Berline',
        vehiculeMarque: 'Tesla / Cadillac',
        vehiculeGenre: 'VL',
        estimationHint: 'Face avant aluminium, capteurs pilote auto, batteries (EV).',
        models: [
          m('am-us-m3', 'Tesla Model 3', 'Tesla'),
          m('am-us-my', 'Tesla Model Y', 'Tesla'),
          m('am-us-ct5', 'Cadillac CT5', 'Cadillac'),
          m('am-us-escalade', 'Cadillac Escalade V', 'Cadillac'),
        ],
      },
    ],
  },
  {
    id: 'maghreb',
    title: 'North Africa & Middle East',
    subtitle: 'Popular fleets in Tunisia and nearby markets — parts and bodywork',
    items: [
      {
        name: 'Berline locale / flotte',
        vehiculeType: 'Berline',
        vehiculeMarque: 'Peugeot / Renault / Hyundai',
        vehiculeGenre: 'VL',
        estimationHint: 'Longerons, trains avant, optiques d’origine équivalentes.',
        models: [
          m('ma-ber-301', 'Peugeot 301', 'Peugeot'),
          m('ma-ber-logan', 'Dacia Logan III', 'Dacia'),
          m('ma-ber-symbol', 'Renault Symbol III', 'Renault'),
          m('ma-ber-accent', 'Hyundai Accent VI', 'Hyundai'),
          m('ma-ber-elantra', 'Hyundai Elantra VII', 'Hyundai'),
        ],
      },
      {
        name: 'SUV familial',
        vehiculeType: 'SUV',
        vehiculeMarque: 'Dacia Duster / Toyota RAV4',
        vehiculeGenre: 'VL',
        estimationHint: 'Bas de caisse, boucliers, protections plastique.',
        models: [
          m('ma-suv-duster', 'Dacia Duster II', 'Dacia'),
          m('ma-suv-sandero', 'Dacia Sandero Stepway III', 'Dacia'),
          m('ma-suv-rav4', 'Toyota RAV4 V', 'Toyota'),
          m('ma-suv-tucson', 'Hyundai Tucson IV', 'Hyundai'),
        ],
      },
      {
        name: 'Utilitaire léger',
        vehiculeType: 'Utilitaire',
        vehiculeMarque: 'Renault Kangoo / Fiat',
        vehiculeGenre: 'VU',
        estimationHint: 'Portes arrière, seuils chargement, hayon.',
        models: [
          m('ma-vu-kangoo', 'Renault Kangoo III', 'Renault'),
          m('ma-vu-partner', 'Peugeot Partner / Rifter', 'Peugeot'),
          m('ma-vu-doblo', 'Fiat Doblò III', 'Fiat'),
          m('ma-vu-citan', 'Mercedes Citan II', 'Mercedes-Benz'),
        ],
      },
    ],
  },
  {
    id: 'pro',
    title: 'Light commercial & heavy vehicles',
    subtitle: 'Side impacts, tailgates, curtains — heavy-parts costing',
    items: [
      {
        name: 'Fourgon <3,5 t',
        vehiculeType: 'Fourgon',
        vehiculeMarque: 'Mercedes Sprinter / Iveco Daily',
        vehiculeGenre: 'VU',
        estimationHint: 'Portes coulissantes, hayon, marchepieds, ailes fibre.',
        models: [
          m('pr-fg-sprinter', 'Mercedes Sprinter III', 'Mercedes-Benz'),
          m('pr-fg-daily', 'Iveco Daily VII', 'Iveco'),
          m('pr-fg-master', 'Renault Master III', 'Renault'),
          m('pr-fg-crafter', 'Volkswagen Crafter II', 'Volkswagen'),
        ],
      },
      {
        name: 'Camion plateau / PL',
        vehiculeType: 'Camion',
        vehiculeMarque: 'Volvo / Scania',
        vehiculeGenre: 'PL',
        estimationHint: 'Cabine, déflecteurs, réservoirs, ridelles — expertise lourde.',
        models: [
          m('pr-pl-fh', 'Volvo FH5', 'Volvo'),
          m('pr-pl-fm', 'Volvo FM5', 'Volvo'),
          m('pr-pl-r', 'Scania R-series', 'Scania'),
          m('pr-pl-s', 'Scania S-series', 'Scania'),
        ],
      },
      {
        name: 'Semi-remorque',
        vehiculeType: 'Semi-remorque',
        vehiculeMarque: 'Schmitz / Krone',
        vehiculeGenre: 'PL',
        estimationHint: 'Bâchage, ridelles, train arrière, twistlocks.',
        models: [
          m('pr-se-sch', 'Schmitz Cargobull S.CS', 'Schmitz'),
          m('pr-se-krone', 'Krone Profi Liner', 'Krone'),
          m('pr-se-kogel', 'Kögel SN24', 'Kögel'),
        ],
      },
    ],
  },
];

export const VEHICLE_CHOICE_STORAGE_KEY = 'salama-expertise-vehicle-choice-v1';

/** Clé `history.state` / `Router.navigate({ state })` pour préremplir le rapport sans délai. */
export const EXPERTISE_PREFILL_NAV_STATE_KEY = 'salamaExpertisePrefillV1';

export const VEHICLE_IMAGE_PLACEHOLDER = '/assets/vehicle-placeholder.svg';
