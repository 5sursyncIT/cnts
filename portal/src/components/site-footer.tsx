export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-zinc-600">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} SGI-CNTS — Portail patient</p>
          <p className="text-xs">
            Données de santé : traitement soumis au consentement explicite et aux obligations GDPR.
          </p>
        </div>
      </div>
    </footer>
  );
}

