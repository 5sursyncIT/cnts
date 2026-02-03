import { redirect } from "next/navigation";

import { PatientNav } from "@/components/patient-nav";
import { getCurrentPatient } from "@/lib/auth/current-user";

export default async function PatientAppLayout(props: { children: React.ReactNode }) {
  const patient = await getCurrentPatient();
  if (!patient) redirect("/espace-patient/connexion");

  return (
    <div className="bg-zinc-50 text-zinc-900">
      <PatientNav patient={patient} />
      <div className="mx-auto max-w-6xl px-4 py-6">{props.children}</div>
    </div>
  );
}

