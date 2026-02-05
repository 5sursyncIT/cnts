import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Droplet, Clock, MapPin, Users, Calendar } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';

export default async function Home() {
  let latestNews: any[] = [];
  try {
    latestNews = await apiClient.articles.list({ published_only: true, limit: 3 });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch homepage articles");
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative bg-zinc-900 text-white overflow-hidden">
        {/* Background Image with Next/Image for LCP optimization */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.jpg"
            alt="Don de sang"
            fill
            priority
            className="object-cover object-center opacity-20 mix-blend-overlay"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 z-0 opacity-90 pointer-events-none"></div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm border border-white/20">
              <span className="flex h-2 w-2 rounded-full bg-red-400 mr-2 animate-pulse"></span>
              Urgent : Les réserves de sang sont faibles
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Donner son sang,<br />
              c'est sauver des vies.
            </h1>
            <p className="text-lg md:text-xl text-zinc-100 max-w-2xl leading-relaxed">
              Votre geste simple et solidaire permet de soigner chaque année des milliers de patients au Sénégal. Rejoignez la communauté des donneurs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/donner-sang"
                className="inline-flex items-center justify-center rounded-md bg-white text-primary font-bold px-8 py-4 text-base shadow-lg hover:bg-zinc-100 transition-all transform hover:scale-105"
              >
                Je veux donner
                <Heart className="ml-2 h-5 w-5 fill-current" />
              </Link>
              <Link
                href="/espace-patient"
                className="inline-flex items-center justify-center rounded-md border-2 border-white text-white font-semibold px-8 py-4 text-base hover:bg-white/10 transition-colors"
              >
                Espace Patient
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">16+</div>
              <div className="text-sm text-zinc-600 font-medium">Banques régionales</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">3</div>
              <div className="text-sm text-zinc-600 font-medium">Vies sauvées par don</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className="text-sm text-zinc-600 font-medium">Service disponible</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">100%</div>
              <div className="text-sm text-zinc-600 font-medium">Sécurisé & Gratuit</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Donate Section */}
      <section className="py-20 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">Pourquoi donner son sang ?</h2>
            <p className="mt-4 text-lg text-zinc-600">
              Au Sénégal, les besoins en produits sanguins sont constants. Votre engagement est vital pour répondre aux urgences et aux maladies chroniques.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Un acte solidaire</h3>
              <p className="text-zinc-600 leading-relaxed">
                En donnant votre sang, vous participez à une chaîne de solidarité nationale. C'est un acte bénévole, anonyme et gratuit qui renforce le lien social.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Sauver des vies</h3>
              <p className="text-zinc-600 leading-relaxed">
                Accidents, accouchements difficiles, maladies du sang... Les situations nécessitant une transfusion sont nombreuses. Un don peut sauver jusqu'à 3 vies.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Rapide et simple</h3>
              <p className="text-zinc-600 leading-relaxed">
                Le don de sang ne prend que 45 minutes de votre temps, de l'accueil à la collation. C'est un geste simple avec un impact immense.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Highlight */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl font-bold text-zinc-900">Le CNTS, bien plus qu'une banque de sang</h2>
              <p className="text-lg text-zinc-600">
                Outre la collecte et la distribution de produits sanguins, le CNTS est un centre d'expertise médicale et biologique de référence.
              </p>
              <ul className="space-y-4">
                {[
                  "Laboratoire d'analyses médicales spécialisées",
                  "Qualification biologique des dons",
                  "Formation et recherche en transfusion sanguine",
                  "Hémovigilance et sécurité transfusionnelle"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span className="text-zinc-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link href="/services" className="text-primary font-semibold hover:underline inline-flex items-center">
                  Découvrir tous nos services <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="flex-1 relative h-80 w-full rounded-2xl overflow-hidden bg-zinc-100">
               <Image 
                 src="/images/labo_cnts.webp" 
                 alt="Laboratoire CNTS - Centre National de Transfusion Sanguine" 
                 fill
                 className="object-cover"
               />
            </div>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-20 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900">Actualités & Événements</h2>
              <p className="mt-2 text-zinc-600">Restez informé des dernières nouvelles du CNTS.</p>
            </div>
            <Link href="/actualites" className="hidden md:flex text-primary font-semibold hover:underline items-center">
              Voir tout <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestNews.map((item) => (
              <article key={item.slug} className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="h-48 bg-zinc-200 w-full relative">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 bg-zinc-100">
                      <Calendar className="h-8 w-8 opacity-20" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-primary bg-red-50 px-2 py-1 rounded-full">{item.category}</span>
                    <span className="text-xs text-zinc-500">{new Date(item.published_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2 line-clamp-2">
                    <Link href={`/actualites/${item.slug}`} className="hover:text-primary transition-colors">
                      {item.title}
                    </Link>
                  </h3>
                  <p className="text-zinc-600 text-sm line-clamp-3 mb-4 flex-1">
                    {item.excerpt}
                  </p>
                  <Link href={`/actualites/${item.slug}`} className="text-sm font-medium text-primary hover:underline mt-auto inline-flex items-center">
                    Lire la suite <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/actualites" className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50">
              Voir toutes les actualités
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à sauver des vies ?</h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Prenez rendez-vous dès aujourd'hui dans l'un de nos centres ou lors d'une collecte mobile près de chez vous.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/espace-patient"
              className="inline-flex items-center justify-center rounded-md bg-white text-primary font-bold px-8 py-3 text-base shadow-lg hover:bg-zinc-100 transition-colors"
            >
              Prendre rendez-vous
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md border-2 border-white text-white font-semibold px-8 py-3 text-base hover:bg-white/10 transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
