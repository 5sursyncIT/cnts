/* ============================================================
   CNTS Sénégal — Données de présentation (portées du design kit)
   ============================================================ */

export const BLOOD = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"] as const;

export type StockStatus = "ok" | "warn" | "crit";

export const stock: { type: string; units: number; days: number; status: StockStatus }[] = [
  { type: "O+", units: 412, days: 5.2, status: "ok" },
  { type: "A+", units: 268, days: 3.1, status: "warn" },
  { type: "B+", units: 190, days: 4.0, status: "ok" },
  { type: "AB+", units: 64, days: 6.8, status: "ok" },
  { type: "O-", units: 38, days: 1.1, status: "crit" },
  { type: "A-", units: 52, days: 2.0, status: "warn" },
  { type: "B-", units: 29, days: 1.6, status: "crit" },
  { type: "AB-", units: 17, days: 5.0, status: "ok" },
];

export type Center = {
  id: string;
  name: string;
  city: string;
  area: string;
  hours: string;
  type: "fixe" | "mobile";
  /** Siège national (repère distinct sur les cartes). */
  siege?: boolean;
  lat: number;
  lng: number;
};

// Lieux de don confirmés par cnts.gouv.sn. Les collectes mobiles ne sont pas
// publiées sur le site officiel : elles seront ajoutées ici (ou via l'API
// /collectes/calendrier) dès qu'elles sont annoncées.
export const centers: Center[] = [
  { id: "dakar-cnts", name: "CNTS — Siège national", city: "Dakar", area: "Avenue Cheikh Anta Diop, Fann-Résidence", hours: "Lun–Ven · 08h00–17h00 · Sam · 08h00–13h00", type: "fixe", siege: true, lat: 14.692, lng: -17.462 },
  { id: "crts-kaolack", name: "CRTS de Kaolack", city: "Kaolack", area: "Centre Régional de Transfusion Sanguine (inauguré fin 2025)", hours: "Horaires : renseignez-vous auprès du CNTS", type: "fixe", lat: 14.146, lng: -16.073 },
];

export const donor = {
  name: "Aminata Diallo",
  initials: "AD",
  bloodType: "O-",
  donorId: "SN-CNTS-0048217",
  since: "2021",
  totalDonations: 9,
  livesImpacted: 27,
  lastDonation: "2026-04-14",
  nextEligible: "2026-06-09",
  streak: 4,
  nextTierAt: 10,
  tier: "Argent",
};

export const history = [
  { date: "2026-04-14", center: "CNTS — Siège Dakar", type: "Sang total", volume: "450 ml", status: "Validé" },
  { date: "2025-12-02", center: "Collecte mobile — UCAD", type: "Sang total", volume: "450 ml", status: "Validé" },
  { date: "2025-08-19", center: "CNTS — Siège Dakar", type: "Plasma", volume: "600 ml", status: "Validé" },
  { date: "2025-04-05", center: "Antenne Guédiawaye", type: "Sang total", volume: "450 ml", status: "Validé" },
  { date: "2024-11-21", center: "CNTS — Siège Dakar", type: "Sang total", volume: "450 ml", status: "Validé" },
];

export const badges = [
  { id: "first", name: "Première goutte", desc: "Votre tout premier don", earned: true, icon: "drop" },
  { id: "regular", name: "Donneur régulier", desc: "3 dons en 12 mois", earned: true, icon: "repeat" },
  { id: "universal", name: "Donneur universel", desc: "Groupe O négatif", earned: true, icon: "globe" },
  { id: "plasma", name: "Don de plasma", desc: "1 don de plasma", earned: true, icon: "flask" },
  { id: "lifesaver", name: "Sauveteur", desc: "10 dons cumulés", earned: false, icon: "shield" },
  { id: "ambassador", name: "Ambassadeur", desc: "Parrainer 5 donneurs", earned: false, icon: "users" },
];

export type Alert = { type: string; level: StockStatus; region: string; msg: string };

export const alerts: Alert[] = [
  { type: "O-", level: "crit", region: "Dakar", msg: "Réserve critique — moins de 2 jours" },
  { type: "B-", level: "crit", region: "Thiès", msg: "Besoin urgent pour le bloc opératoire" },
  { type: "A+", level: "warn", region: "Dakar", msg: "Stock en baisse" },
];

export const admin = {
  donationsToday: 86,
  donationsTarget: 120,
  newDonors: 19,
  pendingTests: 34,
  expiringSoon: 12,
  weeklyCollections: [62, 78, 71, 90, 84, 110, 86],
  regionStock: [
    { region: "Dakar", pct: 71 },
    { region: "Thiès", pct: 44 },
    { region: "Saint-Louis", pct: 58 },
    { region: "Ziguinchor", pct: 33 },
    { region: "Kaolack", pct: 62 },
  ],
  activity: [
    { time: "10:42", text: "Don validé — poche #A+ 0093421", who: "Poste Pikine", kind: "ok" },
    { time: "10:31", text: "Alerte O− déclenchée (réserve < 2j)", who: "Système", kind: "crit" },
    { time: "10:18", text: "Nouveau donneur enregistré", who: "Siège Dakar", kind: "info" },
    { time: "09:54", text: "12 poches arrivent à expiration (48h)", who: "Système", kind: "warn" },
    { time: "09:30", text: "Collecte mobile UCAD démarrée", who: "Équipe mobile 2", kind: "info" },
  ],
};

export const statusLabel: Record<StockStatus, string> = { ok: "Suffisant", warn: "En baisse", crit: "Critique" };
export const statusColor: Record<StockStatus, string> = { ok: "var(--ok)", warn: "var(--warn)", crit: "var(--crit)" };

export const org = {
  // Coordonnées officielles (bloc contact de cnts.gouv.sn)
  name: "Centre National de Transfusion Sanguine",
  tutelle: "Ministère de la Santé et de l'Hygiène Publique",
  address: "Avenue Cheikh Anta Diop, Fann-Résidence, Dakar, Sénégal",
  bp: "BP 5002, Dakar",
  phone: "+221 33 815 17 62",
  email: "communication@cnts.gouv.sn",
  emailCommunication: "communication@cnts.gouv.sn",
  hours: "Lun–Ven · 08h00–17h00 · Sam · 08h00–13h00",
  founded: "1951",
  years: String(new Date().getFullYear() - 1951),
  structures: 33,
  director: {
    name: "Dr Daouda Seck",
    title: "Directeur du CNTS",
    photo: "/images/directeur.jpg",
    message: [
      "Chers visiteurs, le Centre National de Transfusion Sanguine (CNTS) œuvre chaque jour pour garantir à chaque patient du Sénégal un sang sûr, disponible et de qualité. Cette mission vitale repose sur l'engagement de milliers de donneurs et de professionnels dévoués à sauver des vies.",
      "Dans une dynamique de modernisation, nous renforçons notre réseau transfusionnel, digitalisons nos processus et plaçons l'innovation au cœur de nos priorités. Ce site s'inscrit dans cette dynamique d'ouverture et de transparence : une porte d'entrée vers nos services, nos innovations et nos actions, mais aussi un outil d'information et de sensibilisation pour encourager le don de sang.",
      "Ensemble, faisons du don de sang un réflexe de solidarité et un acte de vie.",
    ],
    quote: "Le sang n'a pas de substitut. Chaque poche collectée représente une vie sauvée.",
  },
  mission:
    "Assurer la disponibilité du sang sur tout le territoire national, promouvoir le don volontaire et régulier, et garantir la qualité et la sécurité transfusionnelle à chaque étape.",
  vision:
    "Promouvoir une culture du don volontaire et régulier, atteindre l'autosuffisance nationale en sang, et renforcer la confiance du public envers la transfusion sanguine.",
  values: ["Solidarité", "Qualité", "Sécurité", "Transparence", "Innovation"],
  stats: [
    { value: "33", label: "Structures de transfusion sur tout le territoire" },
    { value: "3", label: "Vies sauvées par don de sang" },
    { value: "1951", label: "Au service des Sénégalais depuis" },
    { value: "100%", label: "Dons bénévoles, anonymes et gratuits" },
  ],
  missions: [
    { icon: "drop", t: "PPCD — Prélèvement & Distribution", d: "Collecte, préparation, conservation et distribution des produits sanguins sur toute la chaîne transfusionnelle." },
    { icon: "flask", t: "Laboratoires", d: "Qualification biologique des dons (VIH, hépatites B et C, syphilis) et examens spécialisés pour les patients." },
    { icon: "activity", t: "Hématologie clinique", d: "Prise en charge médicale des maladies du sang : drépanocytose, hémophilie, anémies et leucémies." },
    { icon: "users", t: "Promotion du don", d: "Sensibilisation, unités mobiles régionales et partenariats pour mobiliser les donneurs volontaires." },
  ],
  regions: ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Diourbel", "Tambacounda", "Kolda", "Louga", "Fatick", "Matam", "Kédougou", "Sédhiou", "Kaffrine"],
  partners: [
    "Ministère de la Santé et de l'Hygiène Publique",
    "OMS",
    "Établissement Français du Sang",
    "ISBT",
    "Université Cheikh Anta Diop",
    "Institut Pasteur de Dakar",
    "Hôpitaux publics et privés",
    "Associations de donneurs volontaires",
  ],
};

// Organisation interne (page « Le CNTS » de cnts.gouv.sn) : un Directeur, une équipe
// de coordination et cinq services. Le nouvel organigramme officiel n'est pas encore publié.
export const organisation = {
  intro:
    "Le CNTS est un établissement public de santé placé sous la tutelle du Ministère de la Santé et de l'Hygiène Publique. Il est dirigé par un Directeur, entouré d'une équipe de coordination, et structuré en services et divisions techniques, médicales et administratives.",
  services: [
    { icon: "flask", t: "Service des Laboratoires", d: "Assure la qualification biologique et le contrôle de la qualité du sang.", href: "/services/laboratoires" },
    { icon: "activity", t: "Service d'Hématologie Clinique", d: "Prend en charge les pathologies sanguines et assure un suivi médical.", href: "/services/hematologie" },
    { icon: "drop", t: "Service Préparation & Distribution (PPCD)", d: "Organise la collecte, le stockage et la livraison des poches de sang.", href: "/services/produits-sanguins" },
    { icon: "plus", t: "Service Pharmacie", d: "Gère les produits médicaux et le matériel pour les activités transfusionnelles." },
    { icon: "users", t: "Service Promotion du Don", d: "Coordonne la communication et les campagnes pour le don volontaire régulier.", href: "/services/promotion-don" },
  ],
};

// Réseau national (pages « Le CNTS » et « Services » de cnts.gouv.sn)
export const reseau = {
  intro:
    "Le CNTS s'appuie sur un réseau de 33 structures de transfusion sanguine implantées à travers tout le Sénégal. Ces structures assurent la disponibilité du sang dans les hôpitaux régionaux et soutiennent la mission nationale du centre.",
  map: "/images/carte-reseau-cnts.jpg",
  types: [
    {
      t: "Centres Régionaux de Transfusion Sanguine (CRTS)",
      short: "CRTS",
      d: "Relais régionaux du CNTS : collecte locale des dons, qualification biologique, préparation et distribution des produits sanguins aux hôpitaux de la région. Chaque CRTS est dirigé par un responsable régional et dispose d'une équipe formée par le CNTS.",
    },
    {
      t: "Postes de Transfusion Sanguine (PTS)",
      short: "PTS",
      d: "Implantés au sein des hôpitaux périphériques, ils assurent la délivrance rapide et sécurisée des produits sanguins, notamment en urgence, et la remontée des informations transfusionnelles vers les CRTS.",
    },
    {
      t: "Dépôts de sang & banques de sang hospitalières",
      short: "DS",
      d: "Stockage et délivrance de proximité au sein des structures hospitalières où le besoin le justifie. Depuis la loi n° 2020-26, les CRTS, PTS et DS sont placés sous la tutelle du CNTS.",
    },
  ],
  expansion:
    "Le maillage territorial est en pleine expansion : après l'inauguration du CRTS de Kaolack fin 2025, les centres de Matam et de Louga viendront prochainement compléter le dispositif, dans le cadre d'une politique de décentralisation qui vise sept CRTS à l'horizon 2028.",
};

// Textes de référence (page « Le CNTS » de cnts.gouv.sn)
export const textesReference = {
  chronologie: [
    { date: "28 avril 1951", ref: "Arrêté n° 2464", t: "Institue le Centre Fédéral de Transfusion Sanguine, chargé de collecter, traiter et distribuer le sang sur toute l'Afrique occidentale française (AOF). À l'indépendance, il devient le Centre National de Transfusion Sanguine." },
    { date: "26 octobre 1981", ref: "Arrêté n° 012450/MSP", t: "Porte création du diplôme de donneur de sang bénévole." },
    { date: "4 mai 1985", ref: "Arrêté n° 04949/MSP", t: "Place les banques de sang des régions sous la tutelle technique du CNTS." },
    { date: "8 octobre 1990", ref: "Arrêté n° 010939/MSPAS", t: "Organise le prélèvement, le conditionnement, la distribution et l'utilisation du sang humain, de son plasma et de leurs dérivés." },
    { date: "2 mars 1998", ref: "Loi n° 98-08", t: "Porte réforme hospitalière." },
    { date: "2 mars 1998", ref: "Loi n° 98-12", t: "Relative à la création, à l'organisation et au fonctionnement des établissements publics de santé." },
    { date: "26 août 1998", ref: "Décret n° 98-702", t: "Porte organisation administrative et financière des établissements publics de santé." },
    { date: "10 janvier 2002", ref: "Décret n° 2002-08", t: "Érige le CNTS en Établissement Public de Santé." },
    { date: "12 août 2003", ref: "Arrêté ministériel n° 252", t: "Fixe l'organisation et le fonctionnement du CNTS." },
    { date: "3 juillet 2021", ref: "Loi n° 2020-26", t: "Relative à la transfusion sanguine et aux médicaments dérivés du sang. Elle place notamment les CRTS, PTS et DS sous la tutelle du CNTS." },
  ],
  nationaux: [
    "Décret n° 2002-08 du 10 janvier 2002 portant érection du CNTS en Établissement Public de Santé",
    "Arrêté ministériel n° 252 du 12 août 2003 fixant l'organisation et le fonctionnement du CNTS",
    "Plan national de sécurité transfusionnelle (PNST) 2005–2025",
    "Loi n° 98-08 sur la santé publique au Sénégal et ses décrets d'application",
  ],
  internationaux: [
    "Directives de l'OMS sur la sécurité transfusionnelle (mise à jour 2021)",
    "Recommandations de la Société Internationale de Transfusion Sanguine (ISBT)",
    "Principes éthiques du don volontaire et non rémunéré du sang",
  ],
};

// Partenaires (page « Le CNTS » de cnts.gouv.sn) — logos repris du site officiel
export type PartnerItem = { name: string; category: string; type?: string; description?: string; logo_url?: string; website_url?: string };
export const partenaires: PartnerItem[] = [
  { category: "Institutionnel", type: "Tutelle", name: "Ministère de la Santé et de l'Hygiène Publique", description: "Tutelle du CNTS et appui institutionnel permanent.", logo_url: "/images/partenaires/ministere-sante.png" },
  { category: "Institutionnel", type: "Soins", name: "Hôpital Principal de Dakar", description: "Partenaire hospitalier et scientifique, notamment pour l'étude nationale sur les anémies génétiques.", logo_url: "/images/partenaires/hopital-principal.jpeg" },
  { category: "Institutionnel", type: "Soins", name: "Hôpitaux publics et privés", description: "Bénéficiaires du réseau transfusionnel national." },
  { category: "Institutionnel", type: "Donneurs", name: "ANDOBES — Association nationale des donneurs bénévoles de sang", description: "Les associations de donneurs volontaires sont des acteurs essentiels de la promotion du don de sang.", logo_url: "/images/partenaires/andobes.jpeg" },
  { category: "Institutionnel", type: "Humanitaire", name: "Croix-Rouge sénégalaise", description: "Mobilisation des donneurs et appui aux collectes.", logo_url: "/images/partenaires/croix-rouge-senegalaise.jpeg" },
  { category: "Institutionnel", type: "Entreprise", name: "SOCOCIM Industries", description: "Entreprise partenaire engagée dans la promotion du don de sang.", logo_url: "/images/partenaires/sococim.jpg" },
  { category: "Académique", name: "Université Cheikh Anta Diop (UCAD)", description: "Appui scientifique, formation continue et projets de recherche (dépistage moléculaire).", logo_url: "/images/partenaires/ucad.png" },
  { category: "Académique", name: "Institut Pasteur de Dakar", description: "Partenariat scientifique, notamment pour l'étude nationale sur les anémies génétiques.", logo_url: "/images/partenaires/pasteur.png" },
  { category: "International", type: "Santé publique", name: "Organisation Mondiale de la Santé (OMS)", description: "Accompagnement technique et programmes de sécurité transfusionnelle.", logo_url: "/images/partenaires/oms.png" },
  { category: "International", type: "Santé publique", name: "OMS — Bureau régional de l'Afrique", logo_url: "/images/partenaires/oms_afro.png" },
  { category: "International", type: "Coopération technique", name: "Établissement Français du Sang (EFS)", description: "Coopération en matière de formation et de bonnes pratiques.", logo_url: "/images/partenaires/efs.png" },
  { category: "International", type: "Standards", name: "Société Internationale de Transfusion Sanguine (ISBT)", description: "Participation aux programmes internationaux et séminaires.", logo_url: "/images/partenaires/isbt.png" },
  { category: "International", type: "Réseau africain", name: "Africa Society for Blood Transfusion (AfSBT)", logo_url: "/images/partenaires/afsbt.png" },
  { category: "International", type: "Humanitaire", name: "Croix-Rouge de Belgique", logo_url: "/images/partenaires/croix-rouge-belge.jpeg" },
  { category: "International", type: "Développement", name: "UNICEF", logo_url: "/images/partenaires/unicef.jpeg" },
  { category: "International", type: "Développement", name: "Le Fonds mondial", logo_url: "/images/partenaires/fonds-mondial.png" },
  { category: "International", type: "Développement", name: "Groupe de la Banque mondiale", logo_url: "/images/partenaires/banque-mondiale.png" },
  { category: "International", type: "Développement", name: "USAID", logo_url: "/images/partenaires/usaid.png" },
];

export const products = [
  { name: "Sang total", desc: "Prélèvement standard utilisé en urgence et pour la préparation des autres produits.", icon: "drop", life: "35 jours" },
  { name: "Concentrés de globules rouges", desc: "Anémies sévères, hémorragies, interventions chirurgicales.", icon: "drop", life: "42 jours" },
  { name: "Plasma frais congelé", desc: "Troubles de la coagulation, grands brûlés, déficits en facteurs.", icon: "flask", life: "1 an" },
  { name: "Concentrés plaquettaires", desc: "Patients en chimiothérapie, leucémies, thrombopénies.", icon: "activity", life: "5 jours" },
];

// Recherche & Innovation reprise de cnts.gouv.sn — pilotée par la Cellule de recherche (créée en août 2025)
export type ProjectStatus = "en-cours" | "preparation" | "termine";
export const research: { t: string; d: string; partners: string; status: ProjectStatus }[] = [
  { t: "Renforcement du dépistage moléculaire", partners: "OMS · Université Cheikh Anta Diop · CNTS", d: "Améliorer la détection précoce des agents infectieux transmissibles par le sang grâce au renforcement du dépistage moléculaire.", status: "en-cours" },
  { t: "Étude nationale sur les anémies génétiques", partners: "CNTS · Institut Pasteur de Dakar · Hôpital Principal", d: "Mieux comprendre la prévalence et la prise en charge des anémies d'origine génétique au Sénégal.", status: "preparation" },
  { t: "Traçabilité des poches de sang par QR code", partners: "CNTS · Ministère de la Santé · OMS", d: "Moderniser le suivi des poches de sang grâce à un système de traçabilité numérique basé sur les QR codes.", status: "termine" },
];
export const projectStatusLabel: Record<ProjectStatus, string> = { "en-cours": "En cours", preparation: "En préparation", termine: "Terminé" };

export const celluleRecherche = {
  intro:
    "Instaurée en août 2025, la Cellule de recherche du CNTS coordonne et centralise l'ensemble des projets scientifiques et cliniques menés par le centre. Elle réunit les équipes internes, les universités, les partenaires hospitaliers et les organismes internationaux autour d'un même objectif : faire progresser la transfusion sanguine au service de la santé publique.",
  axes: [
    { icon: "search", t: "Identifier et accompagner les projets", d: "Appui aux travaux en transfusion, hématologie et sécurité biologique." },
    { icon: "award", t: "Favoriser la formation et la publication", d: "Diffusion des résultats et montée en compétence du personnel." },
    { icon: "globe", t: "Renforcer les liens avec les centres de recherche", d: "Partenariats nationaux et internationaux pour le partage des savoirs." },
  ],
  appel:
    "Le CNTS ouvre régulièrement des appels à collaboration à destination des chercheurs, étudiants et institutions désireux de participer à ses projets de recherche ou d'en proposer de nouveaux. Les demandes sont examinées par la Cellule de recherche, qui en assure le suivi scientifique et administratif.",
};

// Actualités reprises de cnts.gouv.sn (rubrique « Actualité et média ») — textes et visuels d'origine.
// Servent de repli tant que le CMS (API /articles) ne renvoie rien.
export type NewsItem = {
  slug: string;
  cat: string;
  date: string;
  title: string;
  excerpt: string;
  tag: string;
  img: string;
  body: { h?: string; p?: string[]; list?: string[]; quote?: { text: string; by?: string } }[];
  gallery?: string[];
};
export const news: NewsItem[] = [
  {
    slug: "convention-cnts-sen-csu",
    cat: "Partenariat",
    date: "2025-11-03",
    title: "Signature d'une convention de partenariat entre le CNTS et la SEN-CSU pour renforcer la couverture sanitaire universelle",
    excerpt: "Dans le cadre de la formalisation de ses relations avec les prestataires de soins, la SEN-CSU a signé une convention d'achat de soins avec le CNTS.",
    tag: "ph3",
    img: "/images/news-sen-csu.jpg",
    gallery: ["/images/actualites/ac3-1024x907.jpg"],
    body: [
      { p: [
        "Dans le cadre de la formalisation de ses relations avec les prestataires de soins, la SEN-CSU (Couverture Sanitaire Universelle) a signé une convention d'achat de soins avec le Centre National de Transfusion Sanguine (CNTS).",
        "Cette collaboration marque une étape importante dans le renforcement du dispositif national de prise en charge des bénéficiaires du programme CSU, tout en valorisant le rôle central du CNTS dans la chaîne de santé publique au Sénégal.",
      ] },
      { h: "Un partenariat au service des bénéficiaires", p: [
        "La signature de cette convention s'inscrit dans la stratégie de la SEN-CSU visant à améliorer l'accès aux prestations médicales de qualité pour tous les Sénégalais.",
        "Grâce à cet accord, les bénéficiaires de la couverture sanitaire universelle pourront bénéficier d'une meilleure disponibilité des produits sanguins labiles, d'un accès simplifié aux soins transfusionnels et d'une prise en charge mieux coordonnée entre les structures de santé et le CNTS.",
      ] },
      { h: "Le CNTS, un acteur clé du système de santé", p: [
        "Le CNTS joue un rôle essentiel dans la collecte, la qualification biologique, la préparation et la distribution du sang à l'échelle nationale. Ce partenariat avec la SEN-CSU permettra :",
      ], list: [
        "d'améliorer la traçabilité des prestations de transfusion ;",
        "de sécuriser la facturation et le remboursement des actes ;",
        "de renforcer la coordination entre les structures hospitalières et les centres régionaux de transfusion sanguine (CRTS).",
      ] },
      { h: "Engagement et vision", p: [
        "Le Directeur du CNTS, Dr Daouda Seck, a salué cette avancée et exprimé son engagement à accompagner la mise en œuvre du partenariat pour garantir son succès. Il a rappelé que la réussite de la CSU repose sur une mobilisation continue des acteurs de la santé, un suivi rigoureux des prestations et une communication transparente au service des patients.",
      ] },
      { h: "Qu'est-ce que la SEN-CSU ?", p: [
        "La SEN-CSU est un programme national visant à garantir à chaque citoyen sénégalais un accès équitable aux soins de santé essentiels sans barrière financière. En collaborant avec les structures sanitaires publiques et des partenaires comme le CNTS, la CSU met en œuvre une politique de santé solidaire et inclusive.",
      ] },
    ],
  },
  {
    slug: "teyliom-properties-don-de-sang",
    cat: "Solidarité",
    date: "2025-11-03",
    title: "Teyliom Properties s'engage pour le don de sang : un geste de solidarité qui sauve des vies",
    excerpt: "Le CNTS félicite et remercie les équipes de Teyliom Properties pour leur engagement citoyen à travers une campagne de don de sang réussie.",
    tag: "ph1",
    img: "/images/news-teyliom.jpg",
    gallery: ["/images/actualites/act2-1024x683.jpg", "/images/actualites/act4-1024x683.jpg", "/images/actualites/act5-1024x683.jpg", "/images/actualites/act6-1024x683.jpg"],
    body: [
      { p: [
        "Le Centre National de Transfusion Sanguine (CNTS) félicite et remercie les équipes de Teyliom Properties pour leur engagement citoyen à travers une campagne de don de sang réussie.",
        "Cette initiative s'inscrit dans le cadre de la Responsabilité Sociale d'Entreprise (RSE) et démontre que la solidarité peut aussi être un moteur de performance et d'humanité au sein du monde professionnel.",
      ], quote: { text: "Donner son sang, c'est donner la vie. Merci à Teyliom Properties d'avoir fait de ce geste un symbole d'engagement collectif." } },
      { h: "Une entreprise engagée pour la vie", p: [
        "L'équipe de Teyliom Properties a organisé, en partenariat avec le CNTS, une journée de don de sang qui a permis de mobiliser de nombreux collaborateurs.",
        "Dans une ambiance conviviale et citoyenne, les donneurs ont répondu présents pour soutenir la mission du CNTS : garantir la disponibilité du sang pour tous les patients, partout au Sénégal.",
      ] },
      { h: "Un modèle de partenariat à suivre", p: [
        "En collaborant avec des entreprises citoyennes comme Teyliom, le CNTS renforce la promotion du don volontaire et bénévole dans le secteur privé. Ces partenariats permettent non seulement d'augmenter les stocks disponibles, mais aussi de sensibiliser durablement les salariés à l'importance du don régulier.",
        "Le CNTS encourage toutes les entreprises à suivre cet exemple et à organiser des campagnes internes de don de sang.",
      ] },
    ],
  },
  {
    slug: "journee-don-de-sang-presidence-180-poches",
    cat: "Événement",
    date: "2025-10-30",
    title: "Journée de don de sang à la Présidence de la République du Sénégal : 180 poches collectées pour la solidarité nationale",
    excerpt: "Ce jeudi 30 octobre 2025, la Présidence de la République a organisé une journée de don de sang au Palais : 180 poches collectées.",
    tag: "ph2",
    img: "/images/news-presidence.jpg",
    gallery: ["/images/actualites/actu4-1024x768.jpg", "/images/actualites/actu6-1024x768.jpg", "/images/actualites/actu7-1024x768.jpg", "/images/actualites/actu8-768x1024.jpg"],
    body: [
      { p: [
        "Ce jeudi 30 octobre 2025, la Présidence de la République du Sénégal a organisé une journée de don de sang au Palais présidentiel, marquant un engagement exemplaire de l'État en faveur de la santé publique et du don volontaire.",
        "Aux côtés du Ministre, Directeur de Cabinet du Président de la République, le Professeur Mary Teuw Niane, ont également pris part à la cérémonie le Colonel Cheikh Diouf, Gouverneur du Palais, ainsi que le Directeur des Moyens Généraux. Le CNTS a assuré l'organisation technique de la collecte et la sensibilisation des participants.",
      ] },
      { h: "Le CNTS, partenaire de la solidarité nationale", p: [
        "Représenté par son Directeur, le Dr Daouda Seck, le CNTS a rappelé le rôle central du centre dans le système national de transfusion sanguine et souligné l'importance d'intégrer le don de sang dans la culture citoyenne sénégalaise.",
      ], quote: { text: "Le sang n'a pas de substitut. Chaque poche collectée représente une vie sauvée. La solidarité nationale se construit aussi à travers ce geste simple mais vital.", by: "Dr Daouda Seck, Directeur du CNTS" } },
      { h: "Un succès collectif : 180 poches de sang collectées", p: [
        "Grâce à la mobilisation des agents du Palais, des forces de sécurité et du personnel administratif, la journée s'est soldée par une collecte de 180 poches de sang, toutes issues de dons volontaires et anonymes.",
        "Ces poches contribueront directement à renforcer les stocks disponibles pour les hôpitaux et centres de transfusion du pays, notamment dans les situations d'urgence médicale.",
      ] },
    ],
  },
];

// Communiqués / publications officiels (rubrique média) — disponibles à câbler dans /actualites ou /recherche
export const communiques = [
  { date: "2025-10-31", title: "Impact des dons volontaires réguliers sur la disponibilité du sang (2025)", source: "Département Communication & Recherche" },
  { date: "2025-10-31", title: "Étude comparative sur la sécurité transfusionnelle dans les hôpitaux régionaux (2024)", source: "Cellule de recherche du CNTS" },
  { date: "2025-10-31", title: "Prévalence des marqueurs infectieux chez les donneurs de sang du CNTS (2023)", source: "Service de Qualification Biologique du Sang" },
];

// Conditions de don reprises de cnts.gouv.sn (rubrique « Conditions / Qui peut donner »)
export const donConditions = {
  ok: ["Être âgé de 18 à 60 ans", "Peser au moins 50 kg", "Être en bonne santé générale", "Avoir un taux d'hémoglobine suffisant"],
  wait: ["Être enrhumé, fiévreux ou malade", "Avoir subi une chirurgie récente", "Suivre un traitement médical lourd", "Revenir d'un voyage à risque", "Être enceinte ou en post-accouchement"],
};

// Périodicité du don (rubrique « Périodicité »)
export const periodicite = {
  hommes: { delai: "tous les 3 mois", parAn: "jusqu'à 4 fois par an" },
  femmes: { delai: "tous les 4 mois", parAn: "jusqu'à 3 fois par an" },
  note: "Ces délais garantissent une récupération complète du volume sanguin et du taux d'hémoglobine.",
  pourquoi: "Ce délai est nécessaire pour que le corps puisse reconstituer le volume sanguin et assurer la sécurité du donneur et du receveur.",
  attention: "Il ne faut pas donner avant la fin de cette période, même si l'on se sent en forme.",
};

// Conseils au donneur (page « Don de sang » de cnts.gouv.sn)
export const conseils = [
  { t: "Avant le don", icon: "clock", d: "Dormez bien, hydratez-vous et évitez les repas trop gras." },
  { t: "Pendant le don", icon: "heart", d: "Respirez calmement, signalez tout malaise et suivez les instructions du personnel." },
  { t: "Après le don", icon: "check", d: "Reposez-vous, buvez de l'eau, prenez une collation et évitez les efforts physiques." },
];

// Parcours du donneur (rubrique « Parcours du donneur ») — 4 étapes
export const parcours = [
  { t: "Accueil", d: "Accueil chaleureux et enregistrement rapide par l'équipe du CNTS.", icon: "idcard", min: "5 min" },
  { t: "Entretien", d: "Vérification de l'aptitude au don lors d'un entretien confidentiel avec un professionnel de santé.", icon: "user", min: "10 min" },
  { t: "Prélèvement", d: "Don effectué en toute sécurité par un personnel qualifié, en moins de dix minutes.", icon: "drop", min: "8–10 min" },
  { t: "Collation", d: "Pause conviviale et collation offertes après le don.", icon: "heart", min: "15 min" },
];

// Services (page « Services du CNTS » de cnts.gouv.sn)
export const ppcd = {
  intro:
    "Le service PPCD (Prélèvement, Production, Conservation et Distribution) incarne le cœur technique du CNTS. Il assure la continuité de la chaîne transfusionnelle, de la collecte du sang jusqu'à sa mise à disposition dans les établissements de santé.",
  etapes: [
    { icon: "users", t: "Le prélèvement", d: "Collectes fixes et mobiles auprès de donneurs volontaires, anonymes et réguliers. Chaque don est précédé d'un entretien médical et d'un examen rapide." },
    { icon: "flask", t: "La production", d: "Le sang collecté est séparé en globules rouges, plasma et plaquettes. Aujourd'hui, 100 % des poches collectées sont séparées." },
    { icon: "shield", t: "La conservation", d: "Globules rouges à 4 °C, plasma à –30 °C, plaquettes à 22 °C sous agitation. Des systèmes automatisés garantissent la traçabilité." },
    { icon: "map", t: "La distribution", d: "Livraison quotidienne vers les hôpitaux, les CRTS et les PTS du pays, en transport frigorifique jusqu'au patient." },
  ],
  destinataires: [
    "Les hôpitaux et structures de santé publics et privés",
    "Les Centres Régionaux de Transfusion Sanguine (CRTS), sous la tutelle administrative et technique du CNTS",
    "Les Postes de Transfusion Sanguine (PTS), chargés du stockage et de la distribution locale",
  ],
  conservation: [
    { produit: "Concentrés de globules rouges", temp: "+4 °C" },
    { produit: "Plasma frais congelé", temp: "–30 °C" },
    { produit: "Concentrés plaquettaires", temp: "+22 °C sous agitation" },
  ],
};

export const laboratoires = {
  intro:
    "Les laboratoires du CNTS jouent un rôle crucial dans la sécurité transfusionnelle et le diagnostic médical. Ils se divisent en deux pôles complémentaires.",
  qualification: {
    t: "Laboratoire de Qualification Biologique",
    d: "Dépistage systématique et automatisé de chaque don de sang, conformément aux standards internationaux. L'automatisation des tests et le contrôle qualité permanent garantissent une sécurité optimale.",
    tests: ["VIH 1 et 2", "Hépatite B", "Hépatite C", "Syphilis", "Autres marqueurs selon les protocoles en vigueur"],
  },
  patients: {
    t: "Laboratoire pour Patients",
    d: "Examens spécialisés d'hématologie et d'immuno-hématologie pour les patients suivis au CNTS ou dans les structures partenaires.",
    tests: ["Groupages sanguins et phénotypages", "Tests de compatibilité (épreuve de compatibilité croisée)", "Dosages hématologiques", "Recherche d'anticorps irréguliers (RAI)"],
  },
};

export const hematologie = {
  intro:
    "Le service d'hématologie clinique du CNTS assure la prise en charge médicale des patients souffrant de maladies du sang. Il combine suivi médical, traitements spécialisés et accompagnement social.",
  chiffres: [
    { value: "≈ 5 000", label: "patients drépanocytaires suivis, enfants et adultes" },
    { value: "≈ 500", label: "hémophiles suivis en coordination avec les hôpitaux" },
  ],
  poles: [
    { icon: "user", t: "Prise en charge des drépanocytaires", d: "Suivi régulier incluant bilans biologiques, transfusions programmées, traitements préventifs et éducation thérapeutique des familles." },
    { icon: "activity", t: "Hémophilie et autres pathologies", d: "Suivi coordonné des hémophiles et prise en charge des anémies, leucémies, aplasies, en étroite collaboration avec le laboratoire pour adapter les transfusions." },
    { icon: "award", t: "Enseignement et recherche clinique", d: "Un centre d'enseignement et de recherche : formation des médecins, biologistes et infirmiers, et études cliniques sur les maladies du sang." },
  ],
};

export const promotionDon = {
  intro:
    "La Promotion du Don est le moteur de la solidarité nationale. Ce service a pour mission de mobiliser, fidéliser et former les donneurs afin d'assurer un approvisionnement constant en sang.",
  axes: [
    { icon: "bell", t: "Sensibilisation et communication", d: "Campagnes dans les écoles, universités, entreprises et lieux publics, en partenariat avec les médias et les associations de donneurs." },
    { icon: "map", t: "Unités de collecte mobiles", d: "Des unités mobiles sillonnent le pays pour rapprocher la collecte des citoyens, dans le respect des normes sanitaires, de la confidentialité et de la sécurité des donneurs." },
    { icon: "users", t: "Coordination et partenariats", d: "Partenariats avec les institutions publiques et privées pour développer une culture durable du don régulier." },
  ],
  entreprises:
    "Entreprises, administrations, associations : organisez une collecte dans vos locaux. Le CNTS assure l'organisation technique, l'équipe médicale et la sensibilisation de vos équipes.",
};

// Équipe (page /equipe) — contenu de repli tant que le CMS est vide ou injoignable.
export type TeamItem = { name: string; role: string; specialty?: string | null; bio?: string | null; photo_url?: string | null };
export const equipe: TeamItem[] = [
  {
    name: "Pr. Saliou Diop",
    role: "Directeur Général",
    specialty: "Hématologie",
    bio: "Expert reconnu en transfusion sanguine, le Pr. Diop dirige le CNTS avec une vision axée sur la qualité et l'innovation."
  },
  {
    name: "Dr. Aissatou Ndiaye",
    role: "Responsable Laboratoire",
    specialty: "Biologie Médicale",
    bio: "Spécialiste en qualification biologique, elle supervise l'ensemble des analyses pour garantir la sécurité des dons."
  },
  {
    name: "Dr. Mamadou Fall",
    role: "Chef du service Collecte",
    specialty: "Médecine Générale",
    bio: "En charge de l'organisation des collectes mobiles et de l'accueil des donneurs au centre national."
  },
  {
    name: "Mme. Fatou Cissé",
    role: "Surveillante Générale",
    specialty: "Soins Infirmiers",
    bio: "Coordonne les équipes paramédicales et veille au bon déroulement des prélèvements."
  },
  {
    name: "Dr. Moussa Sow",
    role: "Responsable Distribution",
    specialty: "Pharmacie",
    bio: "Gère les stocks de produits sanguins et leur distribution aux hôpitaux partenaires."
  },
  {
    name: "M. Ousmane Diallo",
    role: "Responsable Qualité",
    specialty: "Assurance Qualité",
    bio: "Veille au respect des normes internationales et à l'amélioration continue des processus."
  }
];

// Foire aux questions (page /faq) — contenu de repli tant que le CMS est vide ou injoignable.
export type FaqItem = { category: string; question: string; answer: string };
export const faq: FaqItem[] = [
  { category: "Le Don de Sang", question: "Combien de temps dure un don de sang ?", answer: "Le prélèvement en lui-même dure environ 8 à 10 minutes. Cependant, il faut prévoir environ 45 minutes pour l'ensemble du parcours : accueil, entretien médical, prélèvement et collation." },
  { category: "Le Don de Sang", question: "Est-ce que donner son sang fait mal ?", answer: "Vous sentirez une légère piqûre au moment de l'insertion de l'aiguille, comparable à une prise de sang classique. Ensuite, le don est indolore." },
  { category: "Le Don de Sang", question: "À quelle fréquence puis-je donner ?", answer: "Les hommes peuvent donner leur sang tous les 3 mois (jusqu'à 4 fois par an) et les femmes tous les 4 mois (jusqu'à 3 fois par an). Ce délai permet au corps de reconstituer son volume sanguin et son taux d'hémoglobine." },
  { category: "Le Don de Sang", question: "Que devient mon sang après le don ?", answer: "Votre sang est analysé (groupe sanguin, dépistage de maladies), puis séparé en trois composants : globules rouges, plasma et plaquettes. Ces produits sont ensuite distribués aux hôpitaux pour soigner les patients." },
  { category: "Conditions & Contre-indications", question: "Puis-je donner si je suis sous traitement médical ?", answer: "Cela dépend du médicament et de la pathologie. Certains traitements nécessitent un arrêt temporaire, d'autres sont compatibles. L'entretien médical confidentiel avant le don permettra au médecin de trancher." },
  { category: "Conditions & Contre-indications", question: "J'ai fait un tatouage récemment, puis-je donner ?", answer: "Vous devez attendre 4 mois après la réalisation d'un tatouage ou d'un piercing avant de pouvoir donner votre sang, afin d'écarter tout risque infectieux." },
  { category: "Conditions & Contre-indications", question: "Faut-il être à jeun pour donner son sang ?", answer: "Non, au contraire ! Il ne faut jamais venir à jeun. Nous vous recommandons de prendre un repas léger et de bien vous hydrater (eau, jus) avant de venir." },
  { category: "Espace Patient & Résultats", question: "Comment obtenir ma carte de donneur ?", answer: "Votre carte de donneur vous sera remise après votre deuxième don. Elle est également disponible en version numérique dans votre Espace Patient sur ce site." },
  { category: "Espace Patient & Résultats", question: "Suis-je informé si mon sang a un problème ?", answer: "Oui, absolument. Si les analyses révèlent une anomalie (anémie, infection...), vous serez contacté par un médecin du CNTS pour une prise en charge et des conseils." },
];
