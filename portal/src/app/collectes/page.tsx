import { centers as staticCenters, type Center } from "@/components/cnts/data";
import { STRUCTURES, type Structure } from "@/components/cnts/structures";
import { getStructures } from "@/lib/cms";
import { LIEUX_RDV } from "@/lib/donneur";
import { CollectesClient } from "./collectes-client";

export const metadata = {
  title: "Où donner son sang ? — CNTS Sénégal",
  description: "Le siège du CNTS à Dakar-Fann, les centres régionaux de transfusion sanguine (CRTS) et les collectes mobiles : adresses, horaires et itinéraires.",
};

export const dynamic = "force-dynamic";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// Un lieu est réservable en ligne s'il figure dans le formulaire de rendez-vous.
const reservable = (s: Structure) => LIEUX_RDV.some((l) => norm(l).includes(norm(s.commune)));

function toCenter(s: Structure): Center {
  return {
    id: s.id,
    name: s.name,
    city: s.kind === "siege" ? "Dakar" : s.commune,
    area: [s.adresse, s.repere ? `repère : ${s.repere}` : null].filter(Boolean).join(" · ") || s.hote,
    hours: s.horaires ?? "Horaires : renseignez-vous auprès du CNTS",
    type: "fixe",
    siege: s.kind === "siege",
    rdv: reservable(s),
    lat: s.lat,
    lng: s.lng,
  };
}

export default async function CollectesPage() {
  // Centres fixes = siège + CRTS de la carte du réseau (CMS Strapi, sinon cartographie Excel) ;
  // les collectes mobiles restent dans data.ts tant qu'elles ne sont pas publiées.
  const structures = (await getStructures()) ?? STRUCTURES;
  const fixes = structures
    .filter((s) => s.kind === "siege" || s.kind === "crts")
    .sort((a, b) => Number(b.kind === "siege") - Number(a.kind === "siege") || a.name.localeCompare(b.name, "fr"))
    .map(toCenter);
  const centers = [...fixes, ...staticCenters.filter((c) => c.type === "mobile")];
  return <CollectesClient centers={centers} />;
}
