import React from 'react';

export default function MentionsLegales() {
  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        <h1 className="text-3xl font-bold text-zinc-900 mb-8">Mentions Légales</h1>
      
      <div className="prose prose-zinc max-w-none space-y-8 text-zinc-600">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">1. Éditeur du site</h2>
          <p>
            Le présent site est la propriété du <strong>Centre National de Transfusion Sanguine (CNTS)</strong> du Sénégal.<br />
            Établissement public de santé.<br />
            <strong>Adresse :</strong> Avenue Cheikh Anta Diop, Dakar, Sénégal<br />
            <strong>Téléphone :</strong> +221 33 821 38 67<br />
            <strong>Email :</strong> contact@cnts.sn
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">2. Directeur de la publication</h2>
          <p>
            Le Directeur de la publication est le Directeur du CNTS.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">3. Hébergement</h2>
          <p>
            Ce site est hébergé sur les serveurs du CNTS ou de son prestataire agréé.<br />
            <strong>Adresse de l'hébergeur :</strong> Dakar, Sénégal
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">4. Propriété intellectuelle</h2>
          <p>
            L'ensemble de ce site relève de la législation sénégalaise et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
          </p>
          <p className="mt-2">
            La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">5. Liens hypertextes</h2>
          <p>
            Le site du CNTS peut contenir des liens hypertextes vers d'autres sites présents sur le réseau Internet. Les liens vers ces autres ressources vous font quitter le site du CNTS. Le CNTS ne peut être tenu responsable du contenu de ces sites tiers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">6. Responsabilité</h2>
          <p>
            Les informations fournies sur le site du CNTS le sont à titre informatif. Le CNTS ne saurait garantir l'exactitude, la complétude, l'actualité des informations diffusées sur le site. En conséquence, l'utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive.
          </p>
        </section>
      </div>
    </div>
    </div>
  );
}
