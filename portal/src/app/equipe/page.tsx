import { User, Award, Stethoscope } from "lucide-react";

export const metadata = {
  title: "Équipe médicale — SGI-CNTS"
};

type Practitioner = {
  name: string;
  role: string;
  specialty?: string;
  bio: string;
};

const team: Practitioner[] = [
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

export default function TeamPage() {
  return (
    <main className="bg-zinc-50 min-h-screen">
      {/* Header */}
      <div className="bg-zinc-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Notre Équipe</h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg">
            Des professionnels engagés et passionnés qui œuvrent chaque jour pour la sécurité transfusionnelle au Sénégal.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((p) => (
            <div key={p.name} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-4 border-2 border-primary/20">
                <User className="h-10 w-10 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">{p.name}</h2>
              <div className="text-primary font-medium text-sm mt-1 mb-2">{p.role}</div>
              {p.specialty && (
                <div className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded text-xs text-zinc-600 mb-4">
                  <Stethoscope className="h-3 w-3" />
                  {p.specialty}
                </div>
              )}
              <p className="text-zinc-600 text-sm leading-relaxed">
                {p.bio}
              </p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Join Us CTA */}
      <section className="bg-white border-t border-zinc-200 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Award className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Rejoignez l'équipe</h2>
          <p className="text-zinc-600 mb-8">
            Le CNTS recrute régulièrement des profils médicaux, paramédicaux et administratifs.
            Consultez nos offres ou envoyez une candidature spontanée.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            Nous contacter
          </a>
        </div>
      </section>
    </main>
  );
}
