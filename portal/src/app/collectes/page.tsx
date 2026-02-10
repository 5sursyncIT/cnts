import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Clock, Users, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Collectes de sang à venir — SGI-CNTS",
  description:
    "Calendrier des collectes de sang fixes et mobiles organisées par le CNTS à travers le Sénégal.",
};

export default function CollectesPage() {
  const collectesFixes = [
    {
      lieu: "CNTS Dakar — Siège",
      adresse: "Avenue Cheikh Anta Diop, Dakar",
      horaires: "Lundi au Vendredi : 8h - 16h | Samedi : 8h - 13h",
      type: "Permanent",
    },
    {
      lieu: "CTS de Thiès",
      adresse: "Centre Hospitalier Régional de Thiès",
      horaires: "Lundi au Vendredi : 8h - 15h",
      type: "Permanent",
    },
    {
      lieu: "CTS de Saint-Louis",
      adresse: "Hôpital Régional de Saint-Louis",
      horaires: "Lundi au Vendredi : 8h - 15h",
      type: "Permanent",
    },
    {
      lieu: "CTS de Kaolack",
      adresse: "Hôpital Régional de Kaolack",
      horaires: "Lundi au Vendredi : 8h - 15h",
      type: "Permanent",
    },
  ];

  const collectesMobiles = [
    {
      nom: "Collecte UCAD — Campus social",
      date: "15 Février 2026",
      horaires: "9h - 16h",
      lieu: "Université Cheikh Anta Diop, Dakar",
      places: 150,
      statut: "PLANIFIEE",
    },
    {
      nom: "Collecte entreprise — Sonatel",
      date: "22 Février 2026",
      horaires: "10h - 15h",
      lieu: "Siège Sonatel, Dakar",
      places: 80,
      statut: "PLANIFIEE",
    },
    {
      nom: "Collecte communautaire — Pikine",
      date: "1er Mars 2026",
      horaires: "8h - 14h",
      lieu: "Centre communautaire de Pikine",
      places: 100,
      statut: "PLANIFIEE",
    },
    {
      nom: "Collecte Garnison — Camp Dial Diop",
      date: "8 Mars 2026",
      horaires: "8h - 16h",
      lieu: "Camp militaire Dial Diop, Dakar",
      places: 200,
      statut: "PLANIFIEE",
    },
    {
      nom: "Journée mondiale du donneur",
      date: "14 Juin 2026",
      horaires: "8h - 18h",
      lieu: "Place de l'Indépendance, Dakar",
      places: 500,
      statut: "PLANIFIEE",
    },
  ];

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Hero */}
      <div className="bg-zinc-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm border border-white/20 mb-6">
                <Calendar className="h-4 w-4 mr-2" />
                Donnez près de chez vous
              </div>
              <h1 className="text-4xl font-bold md:text-5xl mb-4">
                Collectes de sang
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg">
                Retrouvez les lieux et dates des prochaines collectes de sang
                organisées par le CNTS à travers le Sénégal.
              </p>
            </div>
            <div className="hidden md:block w-80 h-64 relative shrink-0">
              <Image src="/images/illustration-collecte.svg" alt="Illustration collecte mobile" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-20">
        {/* Prochaines collectes mobiles */}
        <section>
          <h2 className="text-3xl font-bold text-zinc-900 mb-2">
            Prochaines collectes mobiles
          </h2>
          <p className="text-zinc-600 mb-8">
            Le CNTS se déplace dans les entreprises, universités et communes pour
            faciliter l'accès au don.
          </p>

          <div className="space-y-4">
            {collectesMobiles.map((collecte, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Date */}
                  <div className="shrink-0 w-28 text-center">
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-xs text-primary font-medium uppercase">
                        {collecte.date.split(" ").slice(1).join(" ")}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {collecte.date.split(" ")[0]}
                      </p>
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-zinc-900">
                      {collecte.nom}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-zinc-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        {collecte.lieu}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-primary" />
                        {collecte.horaires}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary" />
                        {collecte.places} places
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    <Link
                      href="/espace-patient"
                      className="inline-flex items-center justify-center rounded-md bg-primary text-white font-medium px-4 py-2 text-sm hover:bg-primary/90 transition-colors"
                    >
                      S'inscrire
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Centres de collecte fixes */}
        <section>
          <h2 className="text-3xl font-bold text-zinc-900 mb-2">
            Centres de collecte permanents
          </h2>
          <p className="text-zinc-600 mb-8">
            Vous pouvez vous présenter sans rendez-vous dans nos centres de
            collecte fixes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collectesFixes.map((centre, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                    {centre.type}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mt-2">
                  {centre.lieu}
                </h3>
                <div className="space-y-2 mt-3 text-sm text-zinc-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {centre.adresse}
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {centre.horaires}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA organiser */}
        <section className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center">
          <Calendar className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Organisez une collecte
          </h2>
          <p className="text-zinc-600 max-w-xl mx-auto mb-6">
            Entreprise, université, association ou collectivité : le CNTS met à
            disposition une équipe mobile pour organiser une collecte sur votre
            site.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
          >
            Demander une collecte
          </Link>
        </section>
      </div>
    </div>
  );
}
