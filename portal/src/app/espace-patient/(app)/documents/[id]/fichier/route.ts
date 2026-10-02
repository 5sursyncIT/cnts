import { NextResponse, type NextRequest } from "next/server";

import { getCurrentPatient } from "@/lib/auth/current-user";
import { BACKEND_URL, forwardedHeaders } from "@/lib/backend";
import { getGdprConsent } from "@/lib/consent";

// Téléchargement d'un document déposé par le centre : le portail relaie le fichier avec le
// jeton du donneur, qui ne quitte jamais le serveur.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getCurrentPatient();
  if (!patient) return NextResponse.redirect(new URL("/espace-patient/connexion", request.url));
  if (!/^[0-9a-f-]{36}$/i.test(id) || (await getGdprConsent()) !== "accepted") {
    return NextResponse.redirect(new URL("/espace-patient/documents", request.url));
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/me/documents/${id}/fichier`, {
      cache: "no-store",
      headers: { ...(await forwardedHeaders()), Authorization: `Bearer ${patient.accessToken}` },
    });
  } catch {
    return new NextResponse("Service momentanément indisponible.", { status: 503 });
  }
  if (res.status === 401) return NextResponse.redirect(new URL("/espace-patient/connexion?error=expired", request.url));
  if (!res.ok || !res.body) return new NextResponse("Document introuvable.", { status: 404 });

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": res.headers.get("content-disposition") ?? "attachment",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
