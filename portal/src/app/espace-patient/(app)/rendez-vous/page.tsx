import Link from "next/link";
import { cookies } from "next/headers";
import { Calendar, MapPin, Clock } from "lucide-react";

import { ConsentCard } from "@/components/consent-card";
import { AppointmentForm } from "@/components/appointment-form";
import { getGdprConsent } from "@/lib/consent";
import { sessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export const metadata = {
  title: "Rendez-vous — Espace patient"
};

async function getAppointments() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(sessionCookieName)?.value;
    
    let accessToken = null;
    if (sessionToken) {
        const session = await verifySessionToken(sessionToken);
        if (session) {
            accessToken = session.accessToken;
        }
    }
    
    // Use env var or default to localhost for local dev
    const apiUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${apiUrl}/api/me/appointments`, {
      headers,
      cache: 'no-store'
    });
    
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    logger.error({ err: e }, "Failed to fetch appointments");
    return [];
  }
}

export default async function AppointmentsPage() {
  const consent = await getGdprConsent();
  const appointments = await getAppointments();
  
  // Sort by date (already sorted by backend but good to be safe) and get upcoming
  const upcomingAppointments = appointments.filter((rdv: any) => 
    new Date(rdv.date_prevue) >= new Date() && rdv.statut !== 'ANNULE'
  );

  const nextAppointment = upcomingAppointments[0];

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Rendez-vous</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Prise de rendez-vous en ligne et rappels. Préférences :{" "}
        <Link className="underline" href="/espace-patient/preferences">
          notifications
        </Link>
        .
      </p>

      {consent !== "accepted" ? (
        <div className="mt-6">
          <ConsentCard />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Upcoming Appointments Section */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-base font-bold text-zinc-900 mb-4">Prochain rendez-vous</h2>
            
            {nextAppointment ? (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {new Date(nextAppointment.date_prevue).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-zinc-600">
                      <Clock className="h-3 w-3" />
                      {new Date(nextAppointment.date_prevue).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-zinc-600">
                      <MapPin className="h-3 w-3" />
                      {nextAppointment.lieu || "Centre Principal"}
                    </div>
                    <div className="mt-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {nextAppointment.statut}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>Aucun rendez-vous planifié.</p>
              </div>
            )}

            {/* List of other appointments could go here */}
            {upcomingAppointments.length > 1 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-zinc-900 mb-2">À venir également</h3>
                <ul className="space-y-2">
                  {upcomingAppointments.slice(1).map((rdv: any) => (
                    <li key={rdv.id} className="text-sm border-t border-zinc-100 pt-2 flex justify-between">
                       <span>{new Date(rdv.date_prevue).toLocaleDateString('fr-FR')}</span>
                       <span className="text-zinc-500">{new Date(rdv.date_prevue).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Booking Form Section */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-zinc-900 mb-1">Prendre rendez-vous</h2>
            <p className="text-sm text-zinc-500 mb-4">Sélectionnez un créneau pour votre prochain don.</p>
            <AppointmentForm />
          </section>
        </div>
      )}
    </main>
  );
}
