"use client";

import { useKPIs } from "@cnts/api";
import { apiClient } from "@/lib/api-client";
import {
    TrendingUp, TrendingDown, Minus, Activity, CheckCircle, AlertTriangle,
    Package, Truck, Droplet, Users, BarChart3, ArrowUpRight, ArrowDownRight
} from "lucide-react";

// Composant MetricCard détaillé avec comparaison
function DetailedMetricCard({
    category,
    title,
    value,
    unit,
    trend,
    changePercent,
    previousValue,
    icon: Icon,
    color,
    description
}: {
    category: string;
    title: string;
    value: number;
    unit: string;
    trend: "up" | "down" | "stable";
    changePercent: number;
    previousValue: number;
    icon: any;
    color: string;
    description: string;
}) {
    const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
    const trendColor = trend === "up" ? "text-green-700" : trend === "down" ? "text-red-700" : "text-gray-700";
    const trendBgColor = trend === "up" ? "bg-green-50" : trend === "down" ? "bg-red-50" : "bg-gray-50";

    // Déterminer si la tendance est bonne ou mauvaise selon le contexte
    const isGoodTrend = (category === "wastage" && trend === "down") ||
        (category !== "wastage" && trend === "up");

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${color}`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-700">{description}</p>
                    </div>
                </div>
            </div>

            {/* Valeur principale */}
            <div className="mb-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                        {value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xl text-gray-700">{unit}</span>
                </div>
            </div>

            {/* Comparaison */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Période précédente</span>
                    <span className="text-sm font-medium text-gray-900">
                        {previousValue.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {unit}
                    </span>
                </div>

                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${trendBgColor}`}>
                    <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                    <span className={`text-sm font-semibold ${trendColor}`}>
                        {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-700">sur 30 jours</span>
                    {isGoodTrend ? (
                        <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                    ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-600 ml-auto" />
                    )}
                </div>
            </div>
        </div>
    );
}

// Composant pour une catégorie de KPIs
function KPICategory({
    title,
    description,
    icon: Icon,
    color,
    children
}: {
    title: string;
    description: string;
    icon: any;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-700">{description}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {children}
            </div>
        </div>
    );
}

export default function KPIPage() {
    const { collection, wastage, liberation, stock, isLoading, isError } = useKPIs(apiClient);

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="text-gray-800">Chargement des KPIs...</div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-700">Erreur lors du chargement des KPIs</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Indicateurs de Performance (KPIs)</h1>
                <p className="text-gray-700 mt-1">Suivi détaillé des métriques clés avec comparaisons et tendances</p>
            </div>

            {/* Collecte */}
            {collection.data && (
                <KPICategory
                    title="Collecte de Sang"
                    description="Performance de la collecte et mobilisation des donneurs"
                    icon={Droplet}
                    color="bg-red-500"
                >
                    <DetailedMetricCard
                        category="collection"
                        title={collection.data.name}
                        value={collection.data.value}
                        unit={collection.data.unit}
                        trend={collection.data.trend}
                        changePercent={collection.data.change_percent}
                        previousValue={collection.data.previous_value}
                        icon={Activity}
                        color="bg-red-500"
                        description="Nombre moyen de dons collectés par jour"
                    />
                </KPICategory>
            )}

            {/* Qualité */}
            {liberation.data && wastage.data && (
                <KPICategory
                    title="Qualité & Conformité"
                    description="Taux de libération et gestion des pertes"
                    icon={CheckCircle}
                    color="bg-green-500"
                >
                    <DetailedMetricCard
                        category="liberation"
                        title={liberation.data.name}
                        value={liberation.data.value}
                        unit={liberation.data.unit}
                        trend={liberation.data.trend}
                        changePercent={liberation.data.change_percent}
                        previousValue={liberation.data.previous_value}
                        icon={CheckCircle}
                        color="bg-green-600"
                        description="Pourcentage de dons validés après qualification biologique"
                    />

                    <DetailedMetricCard
                        category="wastage"
                        title={wastage.data.name}
                        value={wastage.data.value}
                        unit={wastage.data.unit}
                        trend={wastage.data.trend}
                        changePercent={wastage.data.change_percent}
                        previousValue={wastage.data.previous_value}
                        icon={AlertTriangle}
                        color="bg-orange-500"
                        description="Pourcentage de poches périmées ou non distribuables"
                    />
                </KPICategory>
            )}

            {/* Stock */}
            {stock.data && (
                <KPICategory
                    title="Gestion du Stock"
                    description="Disponibilité et rotation des produits sanguins"
                    icon={Package}
                    color="bg-blue-500"
                >
                    <DetailedMetricCard
                        category="stock"
                        title={stock.data.name}
                        value={stock.data.value}
                        unit={stock.data.unit}
                        trend={stock.data.trend}
                        changePercent={stock.data.change_percent}
                        previousValue={stock.data.previous_value}
                        icon={Package}
                        color="bg-blue-600"
                        description="Nombre de poches disponibles pour distribution"
                    />
                </KPICategory>
            )}

            {/* Distribution */}
            <KPICategory
                title="Distribution & Livraison"
                description="Efficacité de la distribution aux établissements de santé"
                icon={Truck}
                color="bg-purple-500"
            >
                <div className="col-span-full">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Métriques de distribution</h3>
                        <p className="text-gray-700">
                            Les KPIs de distribution seront ajoutés dans une prochaine version
                        </p>
                    </div>
                </div>
            </KPICategory>

            {/* Légende */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-blue-700" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-2">Comment interpréter les tendances</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                                <span><strong>Tendance positive :</strong> Amélioration par rapport à la période précédente (bon signe)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-600" />
                                <span><strong>Tendance à surveiller :</strong> Dégradation nécessitant une attention (ex: hausse du gaspillage)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-700" />
                                <span><strong>En hausse :</strong> Augmentation de +5% ou plus</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <TrendingDown className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-700" />
                                <span><strong>En baisse :</strong> Diminution de -5% ou plus</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Minus className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-700" />
                                <span><strong>Stable :</strong> Variation entre -5% et +5%</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
