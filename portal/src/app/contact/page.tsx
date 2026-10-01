"use client";

import { useState, type CSSProperties } from "react";
import { Button, Card, PageBanner } from "@/components/cnts/primitives";
import { Icon } from "@/components/cnts/icon";
import { org } from "@/components/cnts/data";
import { directionsUrl, EXTERNAL_BTN } from "@/components/cnts/senegal-map";

// Siège du CNTS — Avenue Cheikh Anta Diop, Fann-Résidence, Dakar (nœud OpenStreetMap 4811485353)
const SIEGE = { lat: 14.6957, lng: -17.4657 };
const MAP_DELTA = 0.006;
const OSM_BBOX = [SIEGE.lng - MAP_DELTA, SIEGE.lat - MAP_DELTA * 0.7, SIEGE.lng + MAP_DELTA, SIEGE.lat + MAP_DELTA * 0.7]
  .map((v) => v.toFixed(4))
  .join(",");
const OSM_EMBED_URL =
  "https://www.openstreetmap.org/export/embed.html?layer=mapnik" +
  `&bbox=${OSM_BBOX}` +
  `&marker=${SIEGE.lat},${SIEGE.lng}`;

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const EMPTY_FORM: FormState = { name: "", email: "", subject: "", message: "" };

function Field({
  label,
  placeholder,
  type = "text",
  area,
  required,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  area?: boolean;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const base: CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "var(--r-sm)",
    border: "1px solid var(--line-strong)",
    fontSize: 14.5,
    fontFamily: "var(--font-sans)",
    color: "var(--ink-900)",
    background: "var(--surface)",
    outline: "none",
  };
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink-700)", marginBottom: 6 }}>{label}</span>
      {area ? (
        <textarea
          placeholder={placeholder}
          rows={4}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...base, resize: "vertical" }}
        />
      ) : (
        <input type={type} placeholder={placeholder} required={required} value={value} onChange={(e) => onChange(e.target.value)} style={base} />
      )}
    </label>
  );
}

export default function ContactPage() {
  const [sent, setSent] = useState<false | "api" | "mail">(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [website, setWebsite] = useState(""); // pot de miel anti-robots

  const openMail = () => {
    const subject = form.subject || "Demande d'information";
    const body = `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ""}`;
    window.location.href = `mailto:${org.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subject: form.subject || undefined, website }),
      });
      if (res.status === 429) {
        setError("Vous avez envoyé plusieurs messages récemment. Merci de réessayer plus tard.");
        return;
      }
      if (res.status === 422) {
        setError("Merci de vérifier votre nom, votre adresse email et votre message.");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setSent("api");
    } catch {
      // Serveur injoignable : on bascule sur la messagerie de l'utilisateur.
      openMail();
      setSent("mail");
    } finally {
      setSending(false);
    }
  };

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const infos = [
    { icon: "pin", label: "Adresse", value: org.address },
    { icon: "phone", label: "Téléphone", value: org.phone },
    { icon: "mail", label: "Email", value: org.email },
    { icon: "building", label: "Boîte postale", value: org.bp },
    { icon: "clock", label: "Horaires", value: org.hours },
  ];

  return (
    <div>
      <PageBanner
        kicker="Contact"
        title="Nous contacter"
        sub="Une question sur le don, nos services ou un partenariat ? Notre équipe vous répond."
      />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--gutter)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, alignItems: "start" }} className="two-col">
          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {infos.map((it, i) => (
              <Card key={i} pad={18}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
                      background: "var(--red-50)",
                      color: "var(--brand)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={it.icon} size={20} />
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}
                    >
                      {it.label}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-900)", marginTop: 2 }}>{it.value}</div>
                  </div>
                </div>
              </Card>
            ))}
            <Card pad={0} style={{ overflow: "hidden" }}>
              <iframe
                title="Plan de localisation du siège du CNTS à Dakar"
                src={OSM_EMBED_URL}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ display: "block", width: "100%", height: 320, border: 0 }}
              />
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  padding: "12px 16px",
                  borderTop: "1px solid var(--line)",
                  background: "var(--surface)",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--ink-600)", lineHeight: 1.4, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--ink-900)", fontSize: 14 }}>Siège du CNTS</div>
                  {org.address}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a href={directionsUrl(SIEGE.lat, SIEGE.lng)} target="_blank" rel="noopener noreferrer" style={EXTERNAL_BTN}>
                    <Icon name="pin" size={16} />
                    Itinéraire
                  </a>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${SIEGE.lat}&mlon=${SIEGE.lng}#map=17/${SIEGE.lat}/${SIEGE.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...EXTERNAL_BTN, border: "1px solid transparent", background: "transparent" }}
                  >
                    <Icon name="globe" size={16} />
                    Plan détaillé
                  </a>
                </div>
              </div>
            </Card>
          </div>

          {/* Form */}
          <Card pad={28}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    background: "var(--ok-bg)",
                    color: "var(--ok)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Icon name="check" size={32} />
                </div>
                <h3 className="font-serif" style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>
                  {sent === "api" ? "Message envoyé" : "Message prêt à l\u2019envoi"}
                </h3>
                <p style={{ color: "var(--ink-600)" }}>
                  {sent === "api"
                    ? "Merci ! Notre équipe vous répondra dans les meilleurs délais."
                    : `Votre messagerie s\u2019est ouverte avec votre message adressé à ${org.email}. Pensez à cliquer sur « Envoyer ».`}
                </p>
                <div style={{ marginTop: 20 }}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSent(false);
                      setForm(EMPTY_FORM);
                    }}
                  >
                    Envoyer un autre message
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Envoyez-nous un message</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <Field label="Nom complet" required placeholder="Votre nom" value={form.name} onChange={set("name")} />
                  <Field label="Email" required placeholder="vous@exemple.sn" type="email" value={form.email} onChange={set("email")} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <Field label="Sujet" placeholder="Objet de votre message" value={form.subject} onChange={set("subject")} />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <Field label="Message" placeholder="Votre message…" area value={form.message} onChange={set("message")} />
                </div>
                {/* Pot de miel : invisible pour les humains, rempli par les robots. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                />
                {error && (
                  <p role="alert" style={{ marginBottom: 12, fontSize: 13.5, color: "var(--crit)", fontWeight: 600 }}>
                    {error}
                  </p>
                )}
                <Button type="submit" variant="primary" full icon="share" disabled={sending}>
                  {sending ? "Envoi en cours…" : "Envoyer le message"}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
