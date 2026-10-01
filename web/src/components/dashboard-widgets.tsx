"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, Heart, Package, Truck, Users } from "lucide-react";

import { Card, CardHeader, EmptyState, StatCard, StatusBadge, Table, TBody, THead, Td, Th, Tr } from "@/components/ui";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { SenegalMap } from "@/components/senegal-map";

export type DashboardData = {
    kpis: {
        donneurs_total: number;
        dons_30j: number;
        poches_disponibles: number;
        poches_peremption_proche: number;
        commandes_en_cours: number;
    };
    stock: { type_produit: string; groupe_sanguin: string; count: number }[];
    commandes_par_statut: Record<string, number>;
    commandes_recentes: {
        id: string;
        statut: string;
        date_demande: string;
        hopital: string;
        lignes: { type_produit: string; groupe_sanguin: string | null; quantite: number }[];
    }[];
    donneurs_par_region: Record<string, number>;
    collectes_a_venir: {
        id: string;
        nom: string;
        lieu: string | null;
        date_debut: string;
        date_fin: string;
        statut: string;
        objectif_dons: number | null;
    }[];
    peremption_alerte_jours: number;
};

const dateFr = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const heureFr = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

function WidgetCard(props: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <Card className="h-full overflow-hidden">
            <CardHeader title={props.title} actions={props.action} />
            {props.children}
        </Card>
    );
}

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <Link href={href} className="text-sm font-medium text-blue-700 hover:underline">{children}</Link>;
}

export function KpiRow({ kpis, alertDays }: { kpis: DashboardData["kpis"]; alertDays: number }) {
    const icon = "h-5 w-5";
    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Donneurs enregistrés" value={kpis.donneurs_total.toLocaleString("fr-FR")} href="/donneurs" tone="info" icon={<Users className={icon} />} />
            <StatCard label="Dons (30 jours)" value={kpis.dons_30j.toLocaleString("fr-FR")} href="/dons" tone="danger" icon={<Heart className={icon} />} />
            <StatCard label="Poches disponibles" value={kpis.poches_disponibles.toLocaleString("fr-FR")} href="/stock" tone="success" icon={<Package className={icon} />} />
            <StatCard
                label={`Péremption ≤ ${alertDays} jours`}
                value={kpis.poches_peremption_proche.toLocaleString("fr-FR")}
                hint={kpis.poches_peremption_proche > 0 ? "À distribuer en priorité (FEFO)" : "Aucune poche concernée"}
                href="/stock"
                tone={kpis.poches_peremption_proche > 0 ? "warning" : "neutral"}
                icon={<AlertTriangle className={icon} />}
            />
            <StatCard label="Commandes à traiter" value={kpis.commandes_en_cours.toLocaleString("fr-FR")} href="/distribution/commandes" tone="neutral" icon={<Truck className={icon} />} />
        </div>
    );
}

export function UpcomingCollectes({ collectes }: { collectes: DashboardData["collectes_a_venir"] }) {
    return (
        <WidgetCard title="Prochaines collectes" action={<MoreLink href="/collectes">Tout voir</MoreLink>}>
            {collectes.length === 0 ? (
                <EmptyState title="Aucune collecte planifiée" icon={<CalendarDays className="h-6 w-6" />} />
            ) : (
                <ul className="divide-y divide-gray-100">
                    {collectes.map((c) => {
                        const d = new Date(c.date_debut);
                        return (
                            <li key={c.id}>
                                <Link href={`/collectes/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                                        <span className="text-sm font-semibold leading-none">{d.getDate()}</span>
                                        <span className="text-[10px] uppercase">{d.toLocaleDateString("fr-FR", { month: "short" })}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">{c.nom}</p>
                                        <p className="truncate text-xs text-gray-500">{c.lieu ?? "Lieu à préciser"}</p>
                                    </div>
                                    {c.statut === "EN_COURS" ? <StatusBadge status="EN_COURS" /> : null}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </WidgetCard>
    );
}

const STATUT_LABELS: Record<string, string> = {
    BROUILLON: "En attente de validation",
    VALIDEE: "Validée — à servir",
    SERVIE: "Servie",
    ANNULEE: "Annulée",
};

export function RecentOrders({ commandes, parStatut }: { commandes: DashboardData["commandes_recentes"]; parStatut: Record<string, number> }) {
    const resume = ["BROUILLON", "VALIDEE", "SERVIE"].map((s) => ({ statut: s, count: parStatut[s] ?? 0 }));

    return (
        <WidgetCard title="Commandes à traiter" action={<MoreLink href="/distribution/commandes">Toutes les commandes</MoreLink>}>
            <div className="flex flex-wrap gap-2 border-b border-gray-100 px-5 py-3 text-xs">
                {resume.map((r) => (
                    <span key={r.statut} className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
                        {STATUT_LABELS[r.statut]} : <strong className="tabular-nums">{r.count}</strong>
                    </span>
                ))}
            </div>
            {commandes.length === 0 ? (
                <EmptyState title="Aucune commande en attente" description="Les nouvelles commandes des hôpitaux apparaîtront ici." icon={<Truck className="h-6 w-6" />} />
            ) : (
                <Table>
                    <THead>
                        <tr>
                            <Th>Date</Th>
                            <Th>Hôpital</Th>
                            <Th>Produits</Th>
                            <Th>Statut</Th>
                        </tr>
                    </THead>
                    <TBody>
                        {commandes.map((c) => {
                            const d = new Date(c.date_demande);
                            return (
                                <Tr key={c.id}>
                                    <Td className="whitespace-nowrap text-gray-600">
                                        {dateFr.format(d)} <span className="text-xs text-gray-400">{heureFr.format(d)}</span>
                                    </Td>
                                    <Td className="font-medium">
                                        <Link href={`/distribution/commandes/${c.id}`} className="hover:underline">{c.hopital}</Link>
                                    </Td>
                                    <Td className="text-gray-600">
                                        {c.lignes.map((l) => `${l.quantite} ${l.type_produit}${l.groupe_sanguin ? ` ${l.groupe_sanguin}` : ""}`).join(", ") || "—"}
                                    </Td>
                                    <Td><StatusBadge status={c.statut} /></Td>
                                </Tr>
                            );
                        })}
                    </TBody>
                </Table>
            )}
        </WidgetCard>
    );
}

const GROUP_COLORS: Record<string, string> = {
    "O+": "#3b82f6", "O-": "#1d4ed8",
    "A+": "#ef4444", "A-": "#b91c1c",
    "B+": "#22c55e", "B-": "#15803d",
    "AB+": "#eab308", "AB-": "#a16207",
};

export function StockDistribution({ stock }: { stock: DashboardData["stock"] }) {
    const byGroup = new Map<string, number>();
    for (const s of stock) byGroup.set(s.groupe_sanguin, (byGroup.get(s.groupe_sanguin) ?? 0) + s.count);
    const data = [...byGroup.entries()]
        .map(([name, value]) => ({ name, value, color: GROUP_COLORS[name] ?? "#9ca3af" }))
        .sort((a, b) => b.value - a.value);
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <WidgetCard title="Stock disponible par groupe" action={<MoreLink href="/stock">Détail</MoreLink>}>
            {total === 0 ? (
                <EmptyState title="Aucune poche disponible" description="Les poches libérées et en stock apparaîtront ici." icon={<Package className="h-6 w-6" />} />
            ) : (
                <div className="h-[250px] w-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center text-sm text-gray-500 mt-[-10px]">
                        Total : {total.toLocaleString("fr-FR")} poche{total > 1 ? "s" : ""}
                    </div>
                </div>
            )}
        </WidgetCard>
    );
}

// Noms de région tels qu'attendus par la carte (voir senegal-map.tsx).
const REGIONS = [
    "Dakar", "Thiès", "Saint-Louis", "Diourbel", "Ziguinchor", "Kaolack", "Tambacounda",
    "Louga", "Kolda", "Fatick", "Matam", "Kaffrine", "Sédhiou", "Kédougou",
];

function normalize(s: string) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[\s_-]+/g, "").toUpperCase();
}

export function MapWidget({ parRegion }: { parRegion: Record<string, number> }) {
    const canonical = new Map(REGIONS.map((r) => [normalize(r), r]));
    const data: Record<string, number> = {};
    let nonLocalises = 0;
    for (const [raw, count] of Object.entries(parRegion)) {
        const name = canonical.get(normalize(raw));
        if (name) data[name] = (data[name] ?? 0) + count;
        else nonLocalises += count;
    }
    const total = Object.values(data).reduce((a, b) => a + b, 0);

    return (
        <WidgetCard title="Répartition des donneurs par région">
            {total === 0 ? (
                <EmptyState title="Aucun donneur localisé" description="Renseignez la région des donneurs pour alimenter la carte." />
            ) : (
                <div className="p-4 h-[400px] flex flex-col items-center justify-center">
                    <SenegalMap data={data} />
                    {nonLocalises > 0 ? (
                        <p className="mt-2 text-xs text-gray-500">{nonLocalises} donneur(s) avec une région non reconnue.</p>
                    ) : null}
                </div>
            )}
        </WidgetCard>
    );
}
