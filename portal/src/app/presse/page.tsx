import Link from "next/link";
import { Download, Mail, Phone, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";

export const metadata = {
  title: "Espace Presse — SGI-CNTS",
  description: "Ressources et contacts pour les journalistes et médias.",
};

export const dynamic = 'force-dynamic';

export default async function PressePage() {
  let pressReleases: any[] = [];
  let cmsResources: any[] = [];
  
  try {
    // Récupération parallèle des communiqués et des ressources
    const [releasesData, resourcesData] = await Promise.all([
      apiClient.articles.list({ category: "COMMUNIQUE", published_only: true }),
      apiClient.articles.list({ category: "Ressource", published_only: true })
    ]);
    
    pressReleases = releasesData;
    cmsResources = resourcesData;
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch press data");
  }

  // Transformation des ressources CMS pour l'affichage
  // On utilise :
  // - title -> Titre
  // - tags[0] -> Type (PDF, ZIP, etc.)
  // - excerpt -> Taille (ex: "2.5 MB")
  // - image_url -> Lien de téléchargement
  const resources = cmsResources.map(res => ({
    title: res.title,
    type: res.tags?.[0] || "DOC",
    size: res.excerpt || "-",
    link: res.image_url || "#",
    icon: (res.tags?.[0]?.toUpperCase() === "ZIP" || res.tags?.[0]?.toUpperCase() === "IMAGE") 
      ? <ImageIcon className="h-6 w-6 text-primary" /> 
      : <FileText className="h-6 w-6 text-primary" />
  }));

  return (
    <main className="bg-zinc-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-zinc-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Espace Presse</h1>
          <p className="mt-4 text-zinc-300 max-w-2xl mx-auto text-lg">
            Bienvenue dans l'espace dédié aux journalistes et professionnels des médias.
            Retrouvez ici nos communiqués, dossiers de presse et ressources graphiques.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content - Communiqués */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Derniers communiqués
              </h2>
              <div className="space-y-4">
                {pressReleases.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-200">
                    Aucun communiqué de presse disponible pour le moment.
                  </div>
                ) : (
                  pressReleases.map((pr, index) => (
                    <article key={pr.slug || index} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-sm text-zinc-500 mb-2">{new Date(pr.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      <h3 className="text-xl font-bold text-zinc-900 mb-2">
                        <Link href={`/actualites/${pr.slug}`} className="hover:text-primary transition-colors">
                          {pr.title}
                        </Link>
                      </h3>
                      <p className="text-zinc-600 mb-4">{pr.excerpt}</p>
                      <Link href={`/actualites/${pr.slug}`} className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                        Lire le communiqué <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </article>
                  ))
                )}
              </div>
              <div className="mt-6 text-center">
                <button className="text-sm font-medium text-zinc-600 hover:text-zinc-900 border border-zinc-300 rounded-md px-4 py-2 hover:bg-zinc-50 transition-colors">
                  Voir toutes les archives
                </button>
              </div>
            </div>

            {/* Ressources Téléchargeables */}
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <Download className="h-6 w-6 text-primary" />
                Médiathèque & Ressources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.length === 0 ? (
                  <div className="col-span-full p-6 text-center text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-200">
                    Aucune ressource disponible pour le moment.
                  </div>
                ) : (
                  resources.map((res, index) => (
                    <a 
                      key={index} 
                      href={res.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-zinc-50 p-2 rounded-md group-hover:bg-primary/5 transition-colors">
                          {res.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 group-hover:text-primary transition-colors">{res.title}</div>
                          <div className="text-xs text-zinc-500">{res.type} • {res.size}</div>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors" />
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Contact & Chiffres */}
          <div className="space-y-8">
            {/* Contact Presse Card */}
            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Contact Presse</h3>
              <p className="text-zinc-600 text-sm mb-6">
                Pour toute demande d'interview, de reportage ou d'information complémentaire, notre service communication est à votre disposition.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-red-50 p-2 rounded-full shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-500 uppercase">Email</div>
                    <a href="mailto:presse@cnts.sn" className="text-zinc-900 font-medium hover:text-primary">presse@cnts.sn</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-red-50 p-2 rounded-full shrink-0">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-500 uppercase">Téléphone</div>
                    <a href="tel:+221338000000" className="text-zinc-900 font-medium hover:text-primary">+221 33 821 82 72</a>
                  </div>
                </div>
              </div>

              <hr className="my-6 border-zinc-100" />

              <h4 className="font-semibold text-zinc-900 mb-2">Responsable Communication</h4>
              <p className="text-sm text-zinc-600">Mme. Aminata Diallo</p>
            </div>

            {/* Chiffres Clés Card */}
            <div className="bg-zinc-900 text-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-4">Le CNTS en bref</h3>
              <ul className="space-y-4">
                <li className="flex justify-between items-center border-b border-zinc-700 pb-2">
                  <span className="text-zinc-400 text-sm">Création</span>
                  <span className="font-semibold">1951</span>
                </li>
                <li className="flex justify-between items-center border-b border-zinc-700 pb-2">
                  <span className="text-zinc-400 text-sm">Banques de sang</span>
                  <span className="font-semibold">16 régionales</span>
                </li>
                <li className="flex justify-between items-center border-b border-zinc-700 pb-2">
                  <span className="text-zinc-400 text-sm">Dons par an</span>
                  <span className="font-semibold">~110 000</span>
                </li>
                <li className="flex justify-between items-center pb-2">
                  <span className="text-zinc-400 text-sm">Missions</span>
                  <span className="font-semibold text-right text-xs">Collecte, Qualification,<br/>Distribution, Recherche</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
