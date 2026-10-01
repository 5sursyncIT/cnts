import { ExternalLink, FileText, HelpCircle, Users, Handshake, Download } from "lucide-react";
import { ContentNav } from "@/components/content-nav";
import { PageHeader, buttonClasses } from "@/components/ui";

// Le contenu éditorial du portail est géré dans le CMS Strapi (service `cms`),
// servi sous /cms. Cette page oriente les éditeurs vers son administration.
const CMS_ADMIN_URL = process.env.NEXT_PUBLIC_CMS_ADMIN_URL || "https://cnts.gouv.sn/cms/admin";

const SECTIONS = [
  { icon: FileText, label: "Articles", desc: "Actualités, événements et communiqués (/actualites, /presse)", type: "article" },
  { icon: HelpCircle, label: "Questions FAQ", desc: "Page /faq, groupées par catégorie", type: "faq-item" },
  { icon: Users, label: "Membres de l’équipe", desc: "Page /equipe", type: "team-member" },
  { icon: Handshake, label: "Partenaires", desc: "Page /qui-sommes-nous/partenaires", type: "partner" },
  { icon: Download, label: "Ressources presse", desc: "Médiathèque téléchargeable de /presse", type: "ressource" },
];

export default function CmsPage() {
  return (
    <div className="space-y-6">
      <ContentNav />
      <PageHeader
        title="Contenus du portail"
        description="Le contenu éditorial du portail public est géré dans le CMS Strapi. Les modifications publiées y apparaissent immédiatement sur le portail."
        actions={
          <a href={CMS_ADMIN_URL} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary")}>
            Ouvrir le CMS
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ icon: Icon, label, desc, type }) => (
          <a
            key={type}
            href={`${CMS_ADMIN_URL}/content-manager/collection-types/api::${type}.${type}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 font-semibold text-gray-900 group-hover:text-blue-700">
                {label}
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                <span className="sr-only">(nouvel onglet)</span>
              </span>
              <span className="mt-1 block text-sm text-gray-600">{desc}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
