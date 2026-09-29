/* ============================================================
   CNTS Sénégal — Mock data (window.CNTS)
   ============================================================ */
(function () {
  const BLOOD = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"];

  // National stock barometer. level = jours de réserve. status derived.
  const stock = [
    { type: "O+",  units: 412, days: 5.2, status: "ok"   },
    { type: "A+",  units: 268, days: 3.1, status: "warn" },
    { type: "B+",  units: 190, days: 4.0, status: "ok"   },
    { type: "AB+", units: 64,  days: 6.8, status: "ok"   },
    { type: "O-",  units: 38,  days: 1.1, status: "crit" },
    { type: "A-",  units: 52,  days: 2.0, status: "warn" },
    { type: "B-",  units: 29,  days: 1.6, status: "crit" },
    { type: "AB-", units: 17,  days: 5.0, status: "ok"   },
  ];

  const centers = [
    { id: "dakar-cnts", name: "CNTS — Siège Dakar", city: "Dakar", area: "Avenue Pasteur, Plateau",
      hours: "Lun–Sam · 08h00–18h00", dist: 1.2, slots: 14, type: "fixe", lat: 14.668, lng: -17.438 },
    { id: "pikine", name: "Poste de Pikine", city: "Pikine", area: "Rue 10, Pikine Nord",
      hours: "Lun–Ven · 08h30–16h00", dist: 8.4, slots: 6, type: "fixe", lat: 14.755, lng: -17.39 },
    { id: "guediawaye", name: "Antenne Guédiawaye", city: "Guédiawaye", area: "Cité Comico",
      hours: "Lun–Sam · 09h00–17h00", dist: 11.0, slots: 9, type: "fixe", lat: 14.78, lng: -17.40 },
    { id: "collecte-ucad", name: "Collecte mobile — UCAD", city: "Dakar", area: "Campus universitaire",
      hours: "Aujourd'hui · 09h00–15h00", dist: 3.6, slots: 22, type: "mobile", lat: 14.689, lng: -17.46 },
    { id: "collecte-thies", name: "Collecte mobile — Thiès", city: "Thiès", area: "Place de France",
      hours: "Jeu 12 juin · 09h00–16h00", dist: 70, slots: 30, type: "mobile", lat: 14.79, lng: -16.93 },
    { id: "saint-louis", name: "Centre régional Saint-Louis", city: "Saint-Louis", area: "Hôpital régional",
      hours: "Lun–Ven · 08h00–15h00", dist: 264, slots: 5, type: "fixe", lat: 16.03, lng: -16.49 },
  ];

  const donor = {
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

  const history = [
    { date: "2026-04-14", center: "CNTS — Siège Dakar", type: "Sang total", volume: "450 ml", status: "Validé" },
    { date: "2025-12-02", center: "Collecte mobile — UCAD", type: "Sang total", volume: "450 ml", status: "Validé" },
    { date: "2025-08-19", center: "CNTS — Siège Dakar", type: "Plasma", volume: "600 ml", status: "Validé" },
    { date: "2025-04-05", center: "Antenne Guédiawaye", type: "Sang total", volume: "450 ml", status: "Validé" },
    { date: "2024-11-21", center: "CNTS — Siège Dakar", type: "Sang total", volume: "450 ml", status: "Validé" },
  ];

  const badges = [
    { id: "first", name: "Première goutte", desc: "Votre tout premier don", earned: true, icon: "drop" },
    { id: "regular", name: "Donneur régulier", desc: "3 dons en 12 mois", earned: true, icon: "repeat" },
    { id: "universal", name: "Donneur universel", desc: "Groupe O négatif", earned: true, icon: "globe" },
    { id: "plasma", name: "Don de plasma", desc: "1 don de plasma", earned: true, icon: "flask" },
    { id: "lifesaver", name: "Sauveteur", desc: "10 dons cumulés", earned: false, icon: "shield" },
    { id: "ambassador", name: "Ambassadeur", desc: "Parrainer 5 donneurs", earned: false, icon: "users" },
  ];

  const alerts = [
    { type: "O-", level: "crit", region: "Dakar", msg: "Réserve critique — moins de 2 jours" },
    { type: "B-", level: "crit", region: "Thiès", msg: "Besoin urgent pour le bloc opératoire" },
    { type: "A+", level: "warn", region: "Dakar", msg: "Stock en baisse" },
  ];

  // Admin
  const admin = {
    donationsToday: 86,
    donationsTarget: 120,
    newDonors: 19,
    pendingTests: 34,
    expiringSoon: 12,
    weeklyCollections: [62, 78, 71, 90, 84, 110, 86], // Lun→Dim
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

  const statusLabel = { ok: "Suffisant", warn: "En baisse", crit: "Critique" };
  const statusColor = { ok: "var(--ok)", warn: "var(--warn)", crit: "var(--crit)" };

  const org = {
    address: "Avenue Cheikh Anta Diop, Dakar, Sénégal",
    phone: "+221 33 821 82 72",
    email: "contact@cnts.sn",
    years: "80",
    stats: [
      { value: "16+", label: "Banques régionales" },
      { value: "3", label: "Vies sauvées par don" },
      { value: "24/7", label: "Service disponible" },
      { value: "100%", label: "Sécurisé & gratuit" },
    ],
    missions: [
      { icon: "flask", t: "Laboratoire d'analyses", d: "Analyses médicales spécialisées et plateau technique de référence." },
      { icon: "shield", t: "Qualification biologique", d: "Dépistage systématique de chaque don pour des produits sûrs." },
      { icon: "award", t: "Formation & recherche", d: "Centre de formation et de recherche en transfusion sanguine." },
      { icon: "activity", t: "Hémovigilance", d: "Surveillance et sécurité transfusionnelle sur toute la chaîne." },
    ],
    regions: ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Diourbel",
      "Tambacounda", "Kolda", "Louga", "Fatick", "Matam", "Kédougou", "Sédhiou", "Kaffrine"],
    partners: ["Ministère de la Santé", "OMS", "CICR", "UCAD", "Hôpitaux nationaux", "Croix-Rouge"],
  };

  const products = [
    { name: "Sang total", desc: "Prélèvement standard utilisé en urgence et pour la préparation des autres produits.", icon: "drop", life: "35 jours" },
    { name: "Concentrés de globules rouges", desc: "Anémies sévères, hémorragies, interventions chirurgicales.", icon: "drop", life: "42 jours" },
    { name: "Plasma frais congelé", desc: "Troubles de la coagulation, grands brûlés, déficits en facteurs.", icon: "flask", life: "1 an" },
    { name: "Concentrés plaquettaires", desc: "Patients en chimiothérapie, leucémies, thrombopénies.", icon: "activity", life: "5 jours" },
  ];

  const research = [
    { t: "Sécurité transfusionnelle", d: "Amélioration continue du dépistage et de la qualification biologique des dons." },
    { t: "Immuno-hématologie", d: "Étude des groupes sanguins et compatibilités au sein des populations sénégalaises." },
    { t: "Drépanocytose", d: "Prise en charge transfusionnelle des patients drépanocytaires, enjeu majeur de santé publique." },
    { t: "Formation des professionnels", d: "Programmes de formation continue pour le personnel médical et paramédical." },
  ];

  const news = [
    { cat: "Mobilisation", date: "2026-05-28", title: "Campagne nationale du don de sang : objectif 10 000 poches", excerpt: "Le CNTS lance sa grande campagne de l'hivernage pour renforcer les réserves avant la saison des urgences.", tag: "ph1" },
    { cat: "Événement", date: "2026-05-14", title: "Journée mondiale du donneur de sang à Dakar", excerpt: "Cérémonie de reconnaissance des donneurs fidèles à la Place de l'Indépendance.", tag: "ph2" },
    { cat: "Institution", date: "2026-04-30", title: "Inauguration de la banque régionale de Kaffrine", excerpt: "Une 16e banque régionale pour rapprocher la transfusion des populations.", tag: "ph3" },
    { cat: "Recherche", date: "2026-04-12", title: "Partenariat scientifique avec l'UCAD sur la drépanocytose", excerpt: "Un protocole conjoint pour optimiser la prise en charge transfusionnelle.", tag: "ph4" },
  ];

  const donConditions = {
    ok: ["Avoir entre 18 et 65 ans", "Peser au moins 50 kg", "Être en bonne santé", "Être muni d'une pièce d'identité"],
    wait: ["Don récent (< 3 mois pour les hommes, 4 pour les femmes)", "Tatouage ou piercing (< 4 mois)", "Épisode infectieux ou fièvre récente", "Grossesse en cours ou récente"],
  };

  const parcours = [
    { t: "Accueil & inscription", d: "Enregistrement et vérification de votre identité.", icon: "idcard", min: "5 min" },
    { t: "Entretien médical", d: "Échange confidentiel avec un médecin pour valider l'éligibilité.", icon: "user", min: "10 min" },
    { t: "Le don", d: "Prélèvement réalisé par un personnel qualifié, en toute sécurité.", icon: "drop", min: "8–10 min" },
    { t: "Collation & repos", d: "Une pause avec collation avant de repartir.", icon: "heart", min: "15 min" },
  ];

  window.CNTS = {
    BLOOD, stock, centers, donor, history, badges, alerts, admin,
    statusLabel, statusColor, org, products, research, news, donConditions, parcours,
  };
})();
