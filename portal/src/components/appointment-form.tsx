"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "@/lib/logger";

export function AppointmentForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Combine date and time to ISO string
      const dateTime = new Date(`${date}T${time}:00`);
      
      const res = await fetch("/api/me/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date_prevue: dateTime.toISOString(),
          type_rdv: "DON_SANG",
          lieu: "Centre Principal - Dakar"
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || "Erreur lors de la prise de rendez-vous");
      }

      setSuccess(true);
      setDate("");
      setTime("");
      router.refresh(); // Refresh server components to show new appointment
    } catch (err: any) {
      logger.error({ err }, "Appointment error");
      setError(err.message || "Impossible de prendre le rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-green-50 border-green-100">
        <CardContent className="p-6 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
          <h3 className="text-sm font-medium text-green-800">Rendez-vous confirmé !</h3>
          <p className="mt-1 text-sm text-green-700">
            Votre demande a bien été enregistrée.
          </p>
          <Button 
            variant="link"
            onClick={() => setSuccess(false)}
            className="mt-4 text-green-800 hover:text-green-900"
          >
            Prendre un autre rendez-vous
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-zinc-900 mb-1" htmlFor="date">
          Date souhaitée
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            id="date"
            type="date"
            required
            min={new Date().toISOString().split('T')[0]}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-900 mb-1" htmlFor="time">
          Heure souhaitée
        </label>
        <div className="relative">
          <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            id="time"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Les dons sont possibles de 8h00 à 17h00.
        </p>
      </div>

      <div>
        <div className="block text-sm font-medium text-zinc-900 mb-1">
          Lieu
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200 text-sm text-zinc-600">
          <MapPin className="h-4 w-4" />
          Centre Principal - Dakar
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Traitement...
          </>
        ) : (
          "Confirmer le rendez-vous"
        )}
      </Button>
    </form>
  );
}
