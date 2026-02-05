import { Droplet, FlaskConical, Truck, GraduationCap, Heart, Activity } from "lucide-react";

export const metadata = {
  title: "Nos Services — SGI-CNTS"
};

export default function ServicesPage() {
  const services = [
    {
      id: "don",
      title: "Collecte de Sang",
      description: "Organisation de collectes fixes et mobiles pour assurer l'autosuffisance en produits sanguins.",
      icon: <Droplet className="h-8 w-8 text-primary" />,
      features: ["Dons de sang total", "Dons de plaquettes", "Dons de plasma", "Collectes mobiles en entreprise"]
    },
    {
      id: "laboratoire",
      title: "Laboratoire de Qualification",
      description: "Analyses biologiques rigoureuses pour garantir la sécurité transfusionnelle de chaque poche.",
      icon: <FlaskConical className="h-8 w-8 text-primary" />,
      features: ["Groupage sanguin ABO/Rh", "Dépistage VIH, Hépatites B/C, Syphilis", "Tests de compatibilité", "Biologie moléculaire"]
    },
    {
      id: "distribution",
      title: "Distribution & Conseil",
      description: "Délivrance des produits sanguins labiles (PSL) aux établissements de soins 24h/24 et 7j/7.",
      icon: <Truck className="h-8 w-8 text-primary" />,
      features: ["Gestion des stocks", "Délivrance d'urgence", "Conseil transfusionnel", "Traçabilité totale"]
    },
    {
      id: "formation",
      title: "Formation & Recherche",
      description: "Centre de formation pour les professionnels de santé et pôle de recherche en transfusion.",
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      features: ["Formation continue", "Stages étudiants", "Recherche clinique", "Veille scientifique"]
    },
    {
      id: "hemovigilance",
      title: "Hémovigilance",
      description: "Surveillance de l'ensemble de la chaîne transfusionnelle, du donneur au receveur.",
      icon: <Activity className="h-8 w-8 text-primary" />,
      features: ["Suivi des donneurs", "Suivi des receveurs", "Gestion des effets indésirables", "Amélioration continue"]
    }
  ];

  return (
    <main className="bg-zinc-50 min-h-screen">
      {/* Header */}
      <div className="bg-zinc-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Nos Services</h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg">
            Le CNTS assure une mission de service public essentielle à travers ses différents départements spécialisés.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} id={service.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                {service.icon}
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">{service.title}</h2>
              <p className="text-zinc-600 mb-6 leading-relaxed">
                {service.description}
              </p>
              <ul className="space-y-2">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-zinc-700">
                    <Heart className="h-3 w-3 text-primary fill-current" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-zinc-200 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Besoin d'informations complémentaires ?</h2>
          <p className="text-zinc-600 mb-8">
            Nos équipes sont à votre disposition pour répondre à toutes vos questions concernant le don de sang et nos activités.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Contactez-nous
          </a>
        </div>
      </section>
    </main>
  );
}
