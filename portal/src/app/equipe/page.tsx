export const metadata = {
  title: "Équipe médicale — SGI-CNTS"
};

type Practitioner = {
  name: string;
  role: string;
};

const team: Practitioner[] = [
  { name: "Dr. A. Ndiaye", role: "Médecin" },
  { name: "Dr. S. Diop", role: "Praticien" },
  { name: "Mme. M. Fall", role: "Infirmière" }
];

export default function TeamPage() {
  return (
    <main className="bg-zinc-50">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Équipe médicale</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-700">
          Page vitrine présentant l’équipe. Les informations sont à personnaliser et valider.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {team.map((p) => (
            <div key={p.name} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-zinc-900">{p.name}</div>
              <div className="mt-1 text-sm text-zinc-700">{p.role}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

