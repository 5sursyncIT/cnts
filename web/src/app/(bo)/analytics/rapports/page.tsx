"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Download, Info } from "lucide-react";
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader } from "@/components/ui";

type ReportType = "activity" | "stock";
type ReportFormat = "pdf" | "excel" | "csv";

const REPORT_TYPES: { value: ReportType; label: string; description: string; usesPeriod: boolean }[] = [
    { value: "activity", label: "Rapport d'activité", description: "Dons de la période : DIN, date, type, statut de qualification", usesPeriod: true },
    { value: "stock", label: "État du stock", description: "Poches disponibles à l'instant T, triées par date de péremption", usesPeriod: false },
];

function isoDate(d: Date) {
    return d.toISOString().split("T")[0];
}

function ReportGenerator() {
    const [reportType, setReportType] = useState<ReportType>("activity");
    const [format, setFormat] = useState<ReportFormat>("pdf");
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return isoDate(date);
    });
    const [endDate, setEndDate] = useState(() => isoDate(new Date()));

    const selected = REPORT_TYPES.find((t) => t.value === reportType)!;
    const periodError = selected.usesPeriod && startDate > endDate ? "La date de début doit précéder la date de fin." : null;

    const handleGenerate = () => {
        if (periodError) return;
        apiClient.analytics.exportReport({
            format,
            report_type: reportType,
            ...(selected.usesPeriod ? { start_date: startDate, end_date: endDate } : {}),
        });
    };

    return (
        <Card>
            <CardHeader title="Générer un rapport" />
            <CardBody className="space-y-5">
                <fieldset>
                    <legend className="mb-2 block text-sm font-medium text-gray-800">Type de rapport</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {REPORT_TYPES.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                aria-pressed={reportType === type.value}
                                onClick={() => setReportType(type.value)}
                                className={`rounded-lg border-2 p-4 text-left transition-colors ${reportType === type.value
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <div className="font-medium text-gray-900">{type.label}</div>
                                <div className="mt-1 text-sm text-gray-600">{type.description}</div>
                            </button>
                        ))}
                    </div>
                </fieldset>

                {selected.usesPeriod ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Date de début" error={periodError ?? undefined}>
                            <Input
                                id="rapport-debut"
                                type="date"
                                value={startDate}
                                max={endDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Field>
                        <Field label="Date de fin">
                            <Input
                                id="rapport-fin"
                                type="date"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Field>
                    </div>
                ) : (
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                        <Info className="h-4 w-4 text-gray-500" aria-hidden="true" />
                        Ce rapport reflète le stock au moment du téléchargement.
                    </p>
                )}

                <fieldset>
                    <legend className="mb-2 block text-sm font-medium text-gray-800">Format d&apos;export</legend>
                    <div className="flex flex-wrap gap-3">
                        {(["pdf", "excel", "csv"] as ReportFormat[]).map((fmt) => (
                            <button
                                key={fmt}
                                type="button"
                                aria-pressed={format === fmt}
                                onClick={() => setFormat(fmt)}
                                className={`min-w-20 flex-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${format === fmt
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-200 text-gray-900 hover:border-gray-300"
                                    }`}
                            >
                                {fmt.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </fieldset>

                <div className="space-y-2">
                    <Button
                        onClick={handleGenerate}
                        disabled={Boolean(periodError)}
                        className="w-full sm:w-auto"
                        icon={<Download className="h-4 w-4" aria-hidden="true" />}
                    >
                        Télécharger le rapport
                    </Button>
                    <p className="text-xs text-gray-500">
                        Les rapports sont générés à la demande et ne sont pas archivés : conservez le fichier téléchargé.
                    </p>
                </div>
            </CardBody>
        </Card>
    );
}

export default function RapportsPage() {
    return (
        <div>
            <PageHeader
                title="Rapports & exports"
                description="Téléchargez les rapports d'activité et d'état du stock."
                back={{ href: "/analytics", label: "Analytique" }}
            />
            <ReportGenerator />
        </div>
    );
}
