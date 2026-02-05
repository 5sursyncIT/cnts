import type { Metadata } from "next";
import Link from "next/link";
import { Target, Building2, Users, Globe, HandHeart, GraduationCap, Building, FileText, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Qui sommes-nous — SGI-CNTS",
  description: "Mission, organisation et partenaires du Centre National de Transfusion Sanguine"
};

export default function AboutPage() {
  return (
    <main className="bg-zinc-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-zinc-900 text-white py-16 md:py-24 relative overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl"></div>
        
        <div className="mx-auto max-w-7xl px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Le CNTS
            </h1>
            <p className="text-xl text-zinc-300 leading-relaxed">
              Le Centre National de Transfusion Sanguine est l'établissement de référence garantissant la sécurité transfusionnelle au Sénégal. Découvrez notre mission, notre organisation et nos partenaires.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-16 md:py-24 bg-white border-b border-zinc-100" id="mission">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="md:w-1/3">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 mb-4">Notre Mission</h2>
              <div className="h-1 w-20 bg-primary rounded-full"></div>
            </div>
            <div className="md:w-2/3 space-y-6 text-lg text-zinc-600 leading-relaxed">
              <p>
                Le Centre National de Transfusion Sanguine (CNTS) a pour mission principale d'assurer la disponibilité et l'accessibilité de produits sanguins de qualité sur toute l'étendue du territoire national.
              </p>
              <p>
                En tant qu'établissement public de référence, nous veillons à la sécurité transfusionnelle depuis la collecte jusqu'à la distribution, en passant par la qualification biologique rigoureuse de chaque don. Notre objectif ultime est de sauver des vies en garantissant l'autosuffisance en sang sécurisé pour tous les patients du Sénégal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Organisation Section */}
      <section className="py-16 md:py-24 bg-zinc-50 border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row-reverse gap-12 items-start">
            <div className="md:w-1/3">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 mb-4">Direction et Organisation</h2>
              <div className="h-1 w-20 bg-blue-600 rounded-full"></div>
            </div>
            <div className="md:w-2/3 space-y-6 text-lg text-zinc-600 leading-relaxed">
              <p>
                Le CNTS est dirigé par un Directeur, assisté d'une équipe de coordination. Ensemble, ils veillent à la mise en œuvre des orientations nationales en matière de transfusion sanguine, à la gestion des ressources et au pilotage des activités scientifiques et médicales.
              </p>
              <p>
                Structuré en divisions techniques, médicales et administratives, cette organisation garantit la coordination efficace et la sécurité optimale des activités transfusionnelles à travers le réseau national.
              </p>
              <div className="pt-4">
                <Link 
                  href="/equipe" 
                  className="inline-flex items-center text-primary font-semibold hover:underline"
                >
                  Découvrir notre équipe de direction
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory Framework Section */}
      <section className="py-16 md:py-24 bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Textes de référence et cadre <span className="text-primary">réglementaire</span>
            </h2>
            <div className="h-1 w-20 bg-primary rounded-full mx-auto mb-6"></div>
            <p className="text-zinc-600 text-lg leading-relaxed">
              Le fonctionnement du Centre National de Transfusion Sanguine est réglementé par un ensemble de textes nationaux et internationaux visant à garantir la qualité, la sécurité et l'accessibilité du sang pour tous les patients.
            </p>
            <p className="text-zinc-600 text-lg mt-4 leading-relaxed">
              Ces références juridiques définissent le rôle du CNTS dans la politique de santé publique du Sénégal et confirment son statut d'établissement public de santé à caractère scientifique et technique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Textes nationaux */}
            <div className="bg-primary text-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <FileText className="h-12 w-12 text-white/90" />
                </div>
                <h3 className="text-2xl font-bold mb-6">Textes nationaux</h3>
                <ul className="space-y-4 text-white/90 flex-1">
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white shrink-0"></span>
                    <span>Décret n° 2002-611 du 17 juillet 2002 portant création du CNTS comme établissement public de santé.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white shrink-0"></span>
                    <span>Arrêté ministériel n° 252 du 12 août 2003 fixant l'organisation et le fonctionnement du CNTS.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white shrink-0"></span>
                    <span>Plan national de sécurité transfusionnelle (PNST) – 2005 à 2025.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white shrink-0"></span>
                    <span>Loi n° 98-08 sur la santé publique au Sénégal et ses décrets d'application.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Textes internationaux */}
            <div className="bg-primary text-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <Globe className="h-12 w-12 text-white/90" />
                </div>
                <h3 className="text-2xl font-bold mb-6">Textes internationaux</h3>
                <ul className="space-y-4 text-white/90 flex-1">
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white shrink-0"></span>
                    <span>Directives de l'OMS sur la sécurité transfusionnelle (dernière mise à jour 2021).</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white shrink-0"></span>
                    <span>Recommandations de la Société Internationale de Transfusion Sanguine (ISBT).</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white shrink-0"></span>
                    <span>Principes éthiques du don volontaire et non rémunéré du sang.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <p className="text-zinc-600 italic leading-relaxed">
              À travers ce cadre réglementaire, le CNTS inscrit ses actions dans les standards internationaux et dans les orientations du Ministère de la Santé et de l'Hygiène Publique Sociale, garantissant ainsi la sécurité transfusionnelle au niveau national.
            </p>
          </div>
        </div>
      </section>

      {/* Partenaires Section */}
      <section className="py-16 md:py-24 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">Nos Partenaires</h2>
            <p className="text-zinc-600 text-lg">
              La réussite de notre mission repose sur un réseau solide de partenaires nationaux et internationaux engagés à nos côtés.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Partenaires Nationaux */}
            <div className="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-700" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900">Partenaires Nationaux</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <Building className="h-6 w-6 text-zinc-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-zinc-900">Ministère de la Santé et de l’Action Sociale</h4>
                    <p className="text-zinc-600 text-sm">Tutelle du CNTS et appui institutionnel permanent.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Building2 className="h-6 w-6 text-zinc-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-zinc-900">Hôpitaux publics et privés</h4>
                    <p className="text-zinc-600 text-sm">Bénéficiaires du réseau transfusionnel.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <GraduationCap className="h-6 w-6 text-zinc-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-zinc-900">Universités et centres de recherche</h4>
                    <p className="text-zinc-600 text-sm">Appui scientifique et formation continue.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <HandHeart className="h-6 w-6 text-zinc-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-zinc-900">Associations de donneurs</h4>
                    <p className="text-zinc-600 text-sm">Acteurs essentiels de la promotion du don de sang.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Partenaires Internationaux */}
            <div className="bg-white rounded-2xl p-8 border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Globe className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900">Partenaires Internationaux</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1 font-bold text-xs text-blue-700">OM</div>
                  <div>
                    <h4 className="font-semibold text-zinc-900">Organisation Mondiale de la Santé (OMS)</h4>
                    <p className="text-zinc-600 text-sm">Accompagnement technique et programmes de sécurité.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-1 font-bold text-xs text-red-700">EF</div>
                  <div>
                    <h4 className="font-semibold text-zinc-900">Établissement Français du Sang (EFS)</h4>
                    <p className="text-zinc-600 text-sm">Coopération en matière de formation et de bonnes pratiques.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-1 font-bold text-xs text-purple-700">IS</div>
                  <div>
                    <h4 className="font-semibold text-zinc-900">Société Internationale de Transfusion Sanguine</h4>
                    <p className="text-zinc-600 text-sm">Participation aux programmes internationaux.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-1 font-bold text-xs text-amber-700">NG</div>
                  <div>
                    <h4 className="font-semibold text-zinc-900">ONG et agences de développement</h4>
                    <p className="text-zinc-600 text-sm">Soutien logistique, financier et matériel.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
