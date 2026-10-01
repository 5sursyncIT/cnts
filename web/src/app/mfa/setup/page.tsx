import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { AuthLayout } from "@/components/auth-layout";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, Input } from "@/components/ui";
import { preAuthCookieName, verifyPreAuthToken } from "@/lib/auth/preauth";

export default async function MfaSetupPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const error = searchParams.error === "1";
  const next = typeof searchParams.next === "string" ? searchParams.next : "/dashboard";

  const token = (await cookies()).get(preAuthCookieName)?.value;
  const preAuth = token ? await verifyPreAuthToken(token) : null;
  if (!preAuth?.setup || !preAuth.setupSecret || !preAuth.otpauthUri) redirect("/login");

  const qrDataUrl = await QRCode.toDataURL(preAuth.otpauthUri, { margin: 1, width: 200 });
  const groupedSecret = preAuth.setupSecret.match(/.{1,4}/g)?.join(" ") ?? preAuth.setupSecret;

  return (
    <AuthLayout
      title="Activez la double authentification"
      description="Obligatoire pour accéder au Back Office. Cette étape ne se fait qu’une fois."
    >
      {error ? (
        <Alert className="mb-5">Code invalide. Vérifiez que l’heure de votre téléphone est exacte, puis saisissez le code suivant.</Alert>
      ) : null}

      <ol className="space-y-6 text-sm text-gray-700">
        <li>
          <p className="font-medium text-gray-900">1. Installez une application d’authentification</p>
          <p className="mt-1">Google Authenticator, Microsoft Authenticator ou FreeOTP.</p>
        </li>
        <li>
          <p className="font-medium text-gray-900">2. Scannez ce QR code</p>
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- data: URL générée côté serveur */}
            <img src={qrDataUrl} width={120} height={120} alt="QR code d’enrôlement" className="shrink-0" />
            <div className="min-w-0 text-xs text-gray-600">
              Impossible de scanner ? Saisissez cette clé :
              <code className="mt-1 block break-all rounded bg-gray-100 px-2 py-1 font-mono text-[13px] text-gray-900">{groupedSecret}</code>
            </div>
          </div>
        </li>
        <li>
          <p className="font-medium text-gray-900">3. Saisissez le code affiché</p>
          <form className="mt-3 space-y-4" action="/admin/api/auth/mfa/setup" method="post">
            <input type="hidden" name="next" value={next} />
            <Field label="Code à 6 chiffres">
              <Input
                name="token"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]{6,7}"
                required
                placeholder="123 456"
                className="h-12 text-center font-mono text-lg tracking-[0.3em]"
              />
            </Field>
            <SubmitButton pendingLabel="Activation…">Activer et se connecter</SubmitButton>
          </form>
        </li>
      </ol>
      <p className="mt-6 text-xs text-gray-500">Cette étape expire après 5 minutes : reconnectez-vous si nécessaire.</p>
    </AuthLayout>
  );
}
