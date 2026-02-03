export const metadata = {
  title: "Contact — SGI-CNTS"
};

export default function ContactPage() {
  return (
    <main className="bg-zinc-50">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Contact</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-700">
          Formulaire de contact institutionnel. L’envoi effectif est à connecter à un service email.
        </p>

        <form className="mt-6 max-w-xl space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-900">
              Nom
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-900">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-zinc-900">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            Envoyer
          </button>
          <p className="text-xs text-zinc-600">
            Ce formulaire n’envoie pas encore d’email en environnement de dev.
          </p>
        </form>
      </section>
    </main>
  );
}

