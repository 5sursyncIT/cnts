import { Plus, Minus, HelpCircle, Search } from "lucide-react";

export const metadata = {
  title: "Foire Aux Questions — SGI-CNTS",
  description: "Réponses aux questions fréquentes sur le don de sang, les contre-indications et le fonctionnement du CNTS.",
};

export default function FaqPage() {
  const faqs = [
    {
      category: "Le Don de Sang",
      questions: [
        {
          q: "Combien de temps dure un don de sang ?",
          a: "Le prélèvement en lui-même dure environ 8 à 10 minutes. Cependant, il faut prévoir environ 45 minutes pour l'ensemble du parcours : accueil, entretien médical, prélèvement et collation."
        },
        {
          q: "Est-ce que donner son sang fait mal ?",
          a: "Vous sentirez une légère piqûre au moment de l'insertion de l'aiguille, comparable à une prise de sang classique. Ensuite, le don est indolore."
        },
        {
          q: "À quelle fréquence puis-je donner ?",
          a: "Les hommes peuvent donner jusqu'à 6 fois par an et les femmes jusqu'à 4 fois par an. Il faut respecter un intervalle de 8 semaines minimum entre deux dons de sang total."
        },
        {
          q: "Que devient mon sang après le don ?",
          a: "Votre sang est analysé (groupe sanguin, dépistage de maladies), puis séparé en trois composants : globules rouges, plasma et plaquettes. Ces produits sont ensuite distribués aux hôpitaux pour soigner les patients."
        }
      ]
    },
    {
      category: "Conditions & Contre-indications",
      questions: [
        {
          q: "Puis-je donner si je suis sous traitement médical ?",
          a: "Cela dépend du médicament et de la pathologie. Certains traitements nécessitent un arrêt temporaire, d'autres sont compatibles. L'entretien médical confidentiel avant le don permettra au médecin de trancher."
        },
        {
          q: "J'ai fait un tatouage récemment, puis-je donner ?",
          a: "Vous devez attendre 4 mois après la réalisation d'un tatouage ou d'un piercing avant de pouvoir donner votre sang, afin d'écarter tout risque infectieux."
        },
        {
          q: "Faut-il être à jeun pour donner son sang ?",
          a: "Non, au contraire ! Il ne faut jamais venir à jeun. Nous vous recommandons de prendre un repas léger et de bien vous hydrater (eau, jus) avant de venir."
        }
      ]
    },
    {
      category: "Espace Patient & Résultats",
      questions: [
        {
          q: "Comment obtenir ma carte de donneur ?",
          a: "Votre carte de donneur vous sera remise après votre deuxième don. Elle est également disponible en version numérique dans votre Espace Patient sur ce site."
        },
        {
          q: "Suis-je informé si mon sang a un problème ?",
          a: "Oui, absolument. Si les analyses révèlent une anomalie (anémie, infection...), vous serez contacté par un médecin du CNTS pour une prise en charge et des conseils."
        }
      ]
    }
  ];

  return (
    <main className="bg-zinc-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-zinc-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold md:text-4xl">Foire Aux Questions</h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg">
            Vous avez des questions ? Nous avons les réponses. Retrouvez ici les informations essentielles sur le don de sang.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-4xl px-4 py-16">
        {/* Search Bar Placeholder */}
        <div className="relative mb-12">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-4 border border-zinc-200 rounded-xl leading-5 bg-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm shadow-sm"
            placeholder="Rechercher une question (ex: âge, poids, voyage...)"
          />
        </div>

        <div className="space-y-12">
          {faqs.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-2xl font-bold text-zinc-900 mb-6 border-b border-zinc-200 pb-2">
                {section.category}
              </h2>
              <div className="space-y-4">
                {section.questions.map((item, qIdx) => (
                  <details key={qIdx} className="group bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
                    <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-6 text-zinc-900 hover:bg-zinc-50 transition-colors">
                      <span className="text-lg">{item.q}</span>
                      <span className="transition group-open:rotate-180">
                        <Plus className="h-5 w-5 text-primary group-open:hidden" />
                        <Minus className="h-5 w-5 text-primary hidden group-open:block" />
                      </span>
                    </summary>
                    <div className="text-zinc-600 px-6 pb-6 pt-0 leading-relaxed border-t border-transparent group-open:border-zinc-100">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-primary/5 rounded-2xl p-8 text-center border border-primary/10">
          <h3 className="text-xl font-bold text-zinc-900 mb-2">Vous n'avez pas trouvé votre réponse ?</h3>
          <p className="text-zinc-600 mb-6">Notre équipe médicale est disponible pour répondre à vos questions spécifiques.</p>
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
