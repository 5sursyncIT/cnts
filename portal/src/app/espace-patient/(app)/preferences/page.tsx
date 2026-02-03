import { getGdprConsent } from "@/lib/consent";

export const metadata = {
  title: "Notifications — Espace patient"
};

export default async function PreferencesPage() {
  const consent = await getGdprConsent();

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Notifications</h1>
      <p className="mt-1 text-sm text-zinc-600">Préférences pour les rappels de rendez-vous (email/SMS).</p>

      {consent !== "accepted" ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          Consentement non accepté : certaines fonctionnalités de l’espace patient peuvent être limitées.
        </div>
      ) : null}

      <section className="mt-6 max-w-xl rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Rappels</h2>
        <form className="mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <input id="emailReminders" type="checkbox" className="mt-1" defaultChecked />
            <label htmlFor="emailReminders" className="text-sm text-zinc-800">
              Recevoir un rappel par email
            </label>
          </div>
          <div className="flex items-start gap-3">
            <input id="smsReminders" type="checkbox" className="mt-1" />
            <label htmlFor="smsReminders" className="text-sm text-zinc-800">
              Recevoir un rappel par SMS
            </label>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-zinc-900">
              Numéro de téléphone (pour SMS)
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+221 ..."
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <button type="button" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            Enregistrer
          </button>
          <p className="text-xs text-zinc-600">
            À connecter à un service de notifications (email/SMS) côté backend, avec audit et consentement.
          </p>
        </form>
      </section>
    </main>
  );
}

