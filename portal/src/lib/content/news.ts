export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
};

export const news: NewsItem[] = [
  {
    slug: "nouveaux-creneaux",
    title: "Nouveaux créneaux de rendez-vous disponibles",
    date: "2026-02-01",
    excerpt: "Ouverture de nouveaux créneaux pour améliorer la disponibilité.",
    content:
      "De nouveaux créneaux de rendez-vous sont disponibles. Connectez-vous à l’espace patient pour réserver un horaire."
  },
  {
    slug: "campagne-prevention",
    title: "Campagne de prévention et sensibilisation",
    date: "2026-01-15",
    excerpt: "Une campagne d’information est lancée pour renforcer la prévention.",
    content:
      "Le CNTS renforce ses actions de sensibilisation. Retrouvez les informations et recommandations dans la rubrique Services."
  }
];

export function getNewsItem(slug: string): NewsItem | undefined {
  return news.find((n) => n.slug === slug);
}

