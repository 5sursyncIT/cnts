import { news } from "@/components/cnts/data";
import { ActualitesList } from "@/components/cnts/actualites-list";
import { getArticles } from "@/lib/cms";

export const dynamic = "force-dynamic";

export default async function ActualitesPage() {
  return <ActualitesList news={(await getArticles()) ?? news} />;
}
