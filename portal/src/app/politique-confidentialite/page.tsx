import React from 'react';

export default function PolitiqueConfidentialite() {
  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        <h1 className="text-3xl font-bold text-zinc-900 mb-8">Politique de Confidentialité</h1>
      
      <div className="prose prose-zinc max-w-none space-y-8 text-zinc-600">
        <p>
          Le Centre National de Transfusion Sanguine (CNTS) s'engage à protéger la vie privée de ses donneurs et des utilisateurs de son site web. Cette politique détaille la manière dont nous collectons, utilisons et protégeons vos données personnelles.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">1. Collecte des données</h2>
          <p>
            Nous collectons les informations que vous nous fournissez directement, notamment lorsque :
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Vous créez un compte donneur sur notre portail.</li>
            <li>Vous prenez rendez-vous pour un don de sang.</li>
            <li>Vous remplissez des formulaires médicaux (pré-don).</li>
            <li>Vous nous contactez via le formulaire de contact.</li>
          </ul>
          <p className="mt-2">
            Les données collectées peuvent inclure : nom, prénom, date de naissance, coordonnées (email, téléphone, adresse), groupe sanguin, et informations de santé strictement nécessaires à la qualification du don.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">2. Utilisation des données</h2>
          <p>
            Vos données sont utilisées pour :
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Gérer votre dossier de donneur et l'historique de vos dons.</li>
            <li>Organiser et confirmer vos rendez-vous.</li>
            <li>Assurer la sécurité transfusionnelle (traçabilité, vigilances).</li>
            <li>Vous contacter en cas de besoin urgent ou d'anomalie sur un don.</li>
            <li>Réaliser des statistiques anonymes pour la santé publique.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">3. Protection et Partage</h2>
          <p>
            Le CNTS met en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre l'accès non autorisé, la perte ou l'altération.
          </p>
          <p className="mt-2">
            Vos données de santé sont strictement confidentielles et ne sont accessibles qu'au personnel médical habilité du CNTS. Elles ne sont jamais vendues ni louées à des tiers. Elles peuvent être transmises aux autorités de santé compétentes uniquement dans les cas prévus par la loi.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">4. Vos droits</h2>
          <p>
            Conformément à la législation en vigueur sur la protection des données personnelles au Sénégal (Loi n° 2008-12 du 25 janvier 2008), vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition au traitement de vos données personnelles.
          </p>
          <p className="mt-2">
            Pour exercer ces droits, vous pouvez nous contacter à l'adresse suivante :<br />
            <strong>Email :</strong> dpo@cnts.sn<br />
            <strong>Adresse postale :</strong> CNTS, Avenue Cheikh Anta Diop, Dakar.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">5. Durée de conservation</h2>
          <p>
            Vos données personnelles sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, et conformément aux obligations légales de conservation des dossiers médicaux en matière de transfusion sanguine.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">6. Modifications</h2>
          <p>
            Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications seront publiées sur cette page.
          </p>
        </section>
      </div>
    </div>
    </div>
  );
}
