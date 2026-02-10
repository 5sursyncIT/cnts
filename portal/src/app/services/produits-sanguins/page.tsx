import Image from "next/image";
import Link from "next/link";
import { Droplet, Thermometer, Clock, Shield, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Produits Sanguins — SGI-CNTS",
  description:
    "Les produits sanguins labiles préparés par le CNTS : concentrés de globules rouges, plasma frais congelé, concentrés plaquettaires.",
};

export default function ProduitsSanguinsPage() {
  const produits = [
    {
      nom: "Concentré de Globules Rouges (CGR)",
      code: "CGR",
      description:
        "Produit de référence pour la transfusion. Contient les globules rouges séparés du sang total par centrifugation.",
      indications: [
        "Anémies sévères (Hb < 7 g/dL)",
        "Hémorragies aiguës",
        "Chirurgies majeures",
        "Drépanocytose (échanges transfusionnels)",
      ],
      conservation: "2 à 6°C pendant 42 jours",
      volume: "250 à 300 ml",
      couleur: "bg-red-50 border-red-200 text-red-700",
    },
    {
      nom: "Plasma Frais Congelé (PFC)",
      code: "PFC",
      description:
        "Fraction liquide du sang contenant les facteurs de coagulation. Congelé dans les 6 heures suivant le prélèvement.",
      indications: [
        "Troubles de la coagulation",
        "CIVD (coagulation intravasculaire disséminée)",
        "Échanges plasmatiques",
        "Brûlures étendues",
      ],
      conservation: "-25°C pendant 1 an",
      volume: "200 à 250 ml",
      couleur: "bg-amber-50 border-amber-200 text-amber-700",
    },
    {
      nom: "Concentré Plaquettaire (CP)",
      code: "CP",
      description:
        "Préparation riche en plaquettes sanguines, obtenue par centrifugation du sang total ou par aphérèse.",
      indications: [
        "Thrombopénies sévères (< 20 000/mm³)",
        "Chimiothérapies anticancéreuses",
        "Leucémies et aplasies médullaires",
        "Chirurgies avec risque hémorragique",
      ],
      conservation: "20 à 24°C sous agitation pendant 5 jours",
      volume: "50 à 60 ml (standard) / 200 ml (aphérèse)",
      couleur: "bg-orange-50 border-orange-200 text-orange-700",
    },
    {
      nom: "Sang Total (ST)",
      code: "ST",
      description:
        "Sang complet non fractionné. Utilisé principalement en situation d'urgence ou quand le fractionnement n'est pas disponible.",
      indications: [
        "Hémorragies massives",
        "Exsanguino-transfusions néonatales",
        "Situations d'urgence en zone reculée",
      ],
      conservation: "2 à 6°C pendant 35 jours",
      volume: "450 ml (± 10%)",
      couleur: "bg-rose-50 border-rose-200 text-rose-700",
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
                <Droplet className="h-4 w-4 mr-2 fill-current text-red-500" />
                Produits Sanguins Labiles
              </div>
              <h1 className="text-4xl font-bold md:text-5xl mb-4">
                Nos produits sanguins
              </h1>
              <p className="mt-4 text-zinc-300 max-w-xl text-lg">
                Le CNTS prépare et distribue des produits sanguins labiles (PSL) de
                qualité, conformes aux normes ISBT 128, pour l'ensemble des
                établissements de santé du Sénégal.
              </p>
            </div>
            <div className="hidden md:block w-72 h-56 relative shrink-0">
              <Image src="/images/illustration-don-sang.svg" alt="Produits sanguins" fill className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 space-y-12">
        {/* Produits */}
        {produits.map((produit, idx) => (
          <section
            key={idx}
            className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="shrink-0">
                <span
                  className={`inline-block text-lg font-bold px-4 py-2 rounded-lg border ${produit.couleur}`}
                >
                  {produit.code}
                </span>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                  {produit.nom}
                </h2>
                <p className="text-zinc-600 mb-6">{produit.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-start gap-2 p-3 bg-zinc-50 rounded-lg">
                    <Thermometer className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-zinc-500">Conservation</p>
                      <p className="text-sm font-medium text-zinc-900">
                        {produit.conservation}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-zinc-50 rounded-lg">
                    <Droplet className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-zinc-500">Volume</p>
                      <p className="text-sm font-medium text-zinc-900">
                        {produit.volume}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-zinc-50 rounded-lg">
                    <Clock className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-zinc-500">
                        Disponibilité
                      </p>
                      <p className="text-sm font-medium text-zinc-900">
                        Sur commande
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-zinc-900 mb-2">
                  Indications principales
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {produit.indications.map((indication, iidx) => (
                    <li
                      key={iidx}
                      className="flex items-start gap-2 text-sm text-zinc-700"
                    >
                      <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {indication}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}

        {/* Sécurité */}
        <section className="bg-green-50 rounded-2xl p-8 md:p-12 border border-green-100">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-green-600 shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Sécurité transfusionnelle
              </h3>
              <p className="text-zinc-700">
                Chaque don fait l'objet de 6 tests obligatoires (ABO, Rhésus,
                VIH, VHB, VHC, Syphilis) avant libération. Le CNTS applique les
                normes internationales de bonnes pratiques et assure une
                traçabilité complète de la veine du donneur à la veine du
                receveur.
              </p>
            </div>
          </div>
        </section>

        {/* Commande */}
        <section className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center">
          <AlertCircle className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Vous êtes un établissement de santé ?
          </h2>
          <p className="text-zinc-600 max-w-xl mx-auto mb-6">
            Pour commander des produits sanguins, contactez notre service de
            distribution ou passez par le système de commande en ligne.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary text-white font-bold px-8 py-3 hover:bg-primary/90 transition-colors"
          >
            Contacter la distribution
          </Link>
        </section>
      </div>
    </div>
  );
}
