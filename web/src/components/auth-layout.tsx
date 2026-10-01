import { Droplet, ShieldCheck } from "lucide-react";

/** Mise en page des écrans d'authentification (connexion, MFA, codes de secours). */
export function AuthLayout({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <main id="contenu-principal" className="flex min-h-screen bg-background">
      <div className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
            <Droplet className="h-5 w-5" fill="currentColor" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <div className="font-semibold">SGI-CNTS</div>
            <div className="text-sm text-slate-400">Centre National de Transfusion Sanguine</div>
          </div>
        </div>
        <div className="relative">
          <p className="text-3xl font-semibold leading-snug">
            De la veine du donneur
            <br />à la veine du receveur.
          </p>
          <p className="mt-4 max-w-sm text-sm text-slate-400">
            Traçabilité complète des dons, du laboratoire, du stock et de la distribution, conforme ISBT 128.
          </p>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Accès réservé au personnel autorisé — toutes les actions sont tracées.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Droplet className="h-4 w-4" fill="currentColor" aria-hidden="true" />
            </span>
            <span className="font-semibold text-gray-900">SGI-CNTS · Back Office</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
          {description ? <div className="mt-2 text-sm text-gray-600">{description}</div> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
