"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import {
    FileText, Download, Calendar, Clock, CheckCircle, XCircle,
    Loader, Filter, RefreshCw
} from "lucide-react";

type ReportType = "monthly" | "compliance" | "kpi" | "activity" | "stock";
type ReportFormat = "pdf" | "excel" | "csv";

// Composant pour générer un rapport
function ReportGenerator() {
    const [reportType, setReportType] = useState<ReportType>("activity");
    const [format, setFormat] = useState<ReportFormat>("pdf");
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        // Simuler la génération
        setTimeout(() => {
            apiClient.analytics.exportReport({ format, report_type: reportType as "activity" | "stock" });
            setIsGenerating(false);
        }, 500);
    };

    const reportTypes = [
        { value: "activity", label: "Rapport d'Activité", description: "Dons, qualifications, rejets" },
        { value: "stock", label: "État du Stock", description: "Inventaire, péremptions" },
        { value: "monthly", label: "Rapport Mensuel", description: "Synthèse complète du mois" },
        { value: "compliance", label: "Conformité", description: "Respect des normes et procédures" },
        { value: "kpi", label: "Tableau de Bord KPI", description: "Indicateurs de performance" },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Générer un Nouveau Rapport</h2>

            <div className="space-y-4">
                {/* Type de rapport */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Type de rapport</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {reportTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setReportType(type.value as ReportType)}
                                className={`p-4 rounded-lg border-2 text-left transition ${reportType === type.value
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <div className="font-medium text-gray-900">{type.label}</div>
                                <div className="text-sm text-gray-700 mt-1">{type.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Période */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Date de début</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Date de fin</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                        />
                    </div>
                </div>

                {/* Format */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Format d'export</label>
                    <div className="flex gap-3">
                        {(["pdf", "excel", "csv"] as ReportFormat[]).map((fmt) => (
                            <button
                                key={fmt}
                                onClick={() => setFormat(fmt)}
                                className={`flex-1 px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition ${format === fmt
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-gray-200 text-gray-900 hover:border-gray-300"
                                    }`}
                            >
                                {fmt.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bouton Générer */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <Loader className="h-5 w-5 animate-spin" />
                            Génération en cours...
                        </>
                    ) : (
                        <>
                            <Download className="h-5 w-5" />
                            Générer le rapport
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// Composant pour l'historique des rapports
function ReportHistory() {
    // Données de démonstration
    const reports = [
        {
            id: "1",
            type: "Rapport d'Activité",
            period: "01/01/2026 - 31/01/2026",
            format: "PDF",
            generatedAt: "05/02/2026 14:23",
            status: "ready" as const,
        },
        {
            id: "2",
            type: "État du Stock",
            period: "15/01/2026 - 15/02/2026",
            format: "Excel",
            generatedAt: "04/02/2026 09:15",
            status: "ready" as const,
        },
        {
            id: "3",
            type: "Rapport Mensuel",
            period: "01/12/2025 - 31/12/2025",
            format: "PDF",
            generatedAt: "02/01/2026 16:45",
            status: "ready" as const,
        },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Historique des Rapports</h2>
                    <button className="text-sm text-blue-700 hover:text-blue-800 font-medium flex items-center gap-1">
                        <RefreshCw className="h-4 w-4" />
                        Actualiser
                    </button>
                </div>
                <p className="text-sm text-gray-700 mt-1">30 derniers jours</p>
            </div>

            <div className="divide-y divide-gray-200">
                {reports.map((report) => (
                    <div key={report.id} className="p-6 hover:bg-gray-50 transition">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-blue-700" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900">{report.type}</h3>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-700">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {report.period}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {report.generatedAt}
                                        </div>
                                        <div className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-800">
                                            {report.format}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                {report.status === "ready" ? (
                                    <>
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition">
                                            <Download className="h-4 w-4" />
                                            Télécharger
                                        </button>
                                    </>
                                ) : report.status === "failed" ? (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                ) : (
                                    <Loader className="h-5 w-5 text-gray-400 animate-spin" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {reports.length === 0 && (
                <div className="p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun rapport</h3>
                    <p className="text-gray-700">
                        Générez votre premier rapport pour commencer
                    </p>
                </div>
            )}
        </div>
    );
}

export default function RapportsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Rapports & Exports</h1>
                <p className="text-gray-700 mt-1">Générez et téléchargez des rapports personnalisés</p>
            </div>

            {/* Générateur */}
            <ReportGenerator />

            {/* Historique */}
            <ReportHistory />
        </div>
    );
}
