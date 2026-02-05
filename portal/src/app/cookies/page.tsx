import React from 'react';

export default function GestionCookies() {
  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        <h1 className="text-3xl font-bold text-zinc-900 mb-8">Gestion des Cookies</h1>
      
      <div className="prose prose-zinc max-w-none space-y-8 text-zinc-600">
        <p>
          Lors de votre consultation du site du Centre National de Transfusion Sanguine (CNTS), des informations relatives à la navigation de votre terminal (ordinateur, tablette, smartphone, etc.) sont susceptibles d'être enregistrées dans des fichiers appelés "Cookies".
        </p>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">1. Qu'est-ce qu'un cookie ?</h2>
          <p>
            Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d'un site ou de la consultation d'une publicité. Ils ont notamment pour but de collecter des informations relatives à votre navigation sur les sites et de vous adresser des services personnalisés.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">2. Les cookies utilisés sur notre site</h2>
          
          <h3 className="text-lg font-medium text-zinc-900 mt-4 mb-2">Cookies strictement nécessaires</h3>
          <p>
            Ces cookies sont indispensables au bon fonctionnement du site web. Ils vous permettent d'utiliser les principales fonctionnalités (par exemple : accès à votre Espace Patient, maintien de votre session active). Sans ces cookies, vous ne pourrez pas utiliser notre site normalement.
          </p>

          <h3 className="text-lg font-medium text-zinc-900 mt-4 mb-2">Cookies de mesure d'audience (Analytiques)</h3>
          <p>
            Il s'agit de cookies qui nous permettent de connaître l'utilisation et les performances de notre site et d'en améliorer le fonctionnement (par exemple : les pages les plus consultées, les recherches des internautes, etc.). Les données collectées sont anonymes.
          </p>

          <h3 className="text-lg font-medium text-zinc-900 mt-4 mb-2">Cookies fonctionnels</h3>
          <p>
            Ces cookies permettent d'améliorer votre expérience utilisateur en mémorisant certains de vos choix (comme la langue préférée ou la taille du texte).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">3. Vos choix concernant les cookies</h2>
          <p>
            Vous pouvez à tout moment choisir de désactiver tout ou partie des cookies. Votre navigateur peut également être paramétré pour vous signaler les cookies qui sont déposés dans votre terminal et vous demander de les accepter ou non.
          </p>
          
          <h3 className="text-lg font-medium text-zinc-900 mt-4 mb-2">Comment paramétrer votre navigateur ?</h3>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Firefox :</strong> Ouvrez le menu &gt; Options &gt; Vie privée et sécurité &gt; Cookies et données de sites.
            </li>
            <li>
              <strong>Chrome :</strong> Ouvrez le menu &gt; Paramètres &gt; Confidentialité et sécurité &gt; Cookies et autres données des sites.
            </li>
            <li>
              <strong>Safari :</strong> Ouvrez le menu &gt; Préférences &gt; Confidentialité.
            </li>
            <li>
              <strong>Edge :</strong> Ouvrez le menu &gt; Paramètres &gt; Cookies et autorisations de site.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">4. Durée de conservation</h2>
          <p>
            Les cookies déposés sur votre terminal ont une durée de vie limitée à 13 mois maximum après leur premier dépôt dans l'équipement terminal de l'utilisateur.
          </p>
        </section>
      </div>
    </div>
    </div>
  );
}
