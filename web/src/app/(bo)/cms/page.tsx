import { ExternalLink, FileText, HelpCircle, Users, Handshake, Download } from "lucide-react";
import { ContentNav } from "@/components/content-nav";

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
    <div className="space-y-8">
      <ContentNav />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Contenus du portail</h1>
          <p className="text-zinc-500 mt-1">
            Le contenu éditorial du portail public est géré dans le CMS Strapi. Les modifications publiées
            y apparaissent immédiatement sur le portail.
          </p>
        </div>
        <a
          href={CMS_ADMIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Ouvrir le CMS <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ icon: Icon, label, desc, type }) => (
          <a
            key={type}
            href={`${CMS_ADMIN_URL}/content-manager/collection-types/api::${type}.${type}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-400"
          >
            <Icon className="h-6 w-6 text-zinc-500 group-hover:text-zinc-900" />
            <div className="mt-3 font-semibold text-zinc-900">{label}</div>
            <div className="mt-1 text-sm text-zinc-500">{desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
