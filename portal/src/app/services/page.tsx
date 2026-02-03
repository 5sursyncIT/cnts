export const metadata = {
  title: "Services — SGI-CNTS"
};

export default function ServicesPage() {
  return (
    <main className="bg-zinc-50">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Nos services</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-700">
          Présentation institutionnelle des services. Le contenu final est à valider avec l’équipe médicale.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Prise de rendez-vous</h2>
            <p className="mt-2 text-sm text-zinc-700">Planification, rappels, annulation et reprogrammation.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Accès aux documents</h2>
            <p className="mt-2 text-sm text-zinc-700">Consultation et téléchargement des comptes-rendus.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Messagerie sécurisée</h2>
            <p className="mt-2 text-sm text-zinc-700">Échanges confidentiels entre patient et praticiens.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Support & assistance</h2>
            <p className="mt-2 text-sm text-zinc-700">Accompagnement sur l’utilisation du portail.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

