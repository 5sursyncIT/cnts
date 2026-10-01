"use client";

import type { ReactNode } from "react";
import { useKPIs } from "@cnts/api";
import { apiClient } from "@/lib/api-client";
import {
    TrendingUp, TrendingDown, Minus, Activity, CheckCircle, AlertTriangle,
    Package, Truck, Droplet, BarChart3, Info, type LucideIcon
} from "lucide-react";
import { Card, CardBody, EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/ui";

// Carte indicateur détaillée avec comparaison à la période précédente
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
    icon: LucideIcon;
    color: string;
    description: string;
}) {
    const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

    // Déterminer si la tendance est bonne ou mauvaise selon le contexte
    const isGoodTrend = (category === "wastage" && trend === "down") ||
        (category !== "wastage" && trend === "up");
    const trendTone = trend === "stable"
        ? "bg-gray-50 text-gray-700"
        : isGoodTrend ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800";

    return (
        <Card>
            <CardBody className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-600">{description}</p>
                    </div>
                </div>

                <p className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tabular-nums text-gray-900">
                        {value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-base text-gray-600">{unit}</span>
                </p>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-600">Période précédente</span>
                        <span className="font-medium tabular-nums text-gray-900">
                            {previousValue.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {unit}
                        </span>
                    </div>

                    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${trendTone}`}>
                        <TrendIcon className="h-4 w-4" aria-hidden="true" />
                        <span className="font-semibold tabular-nums">
                            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)} %
                        </span>
                        <span className="text-gray-600">sur 30 jours</span>
                        {isGoodTrend ? (
                            <CheckCircle className="ml-auto h-4 w-4 text-emerald-600" aria-label="Tendance favorable" />
                        ) : (
                            <AlertTriangle className="ml-auto h-4 w-4 text-amber-600" aria-label="Tendance à surveiller" />
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

// Section regroupant les indicateurs d'une catégorie
function KPICategory({
    title,
    description,
    icon: Icon,
    color,
    children
}: {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {children}
            </div>
        </section>
    );
}

export default function KPIPage() {
    const { collection, wastage, liberation, stock, isLoading, isError } = useKPIs(apiClient);

    const header = (
        <PageHeader
            title="Indicateurs de performance"
            description="Suivi détaillé des métriques clés avec comparaisons et tendances."
            back={{ href: "/analytics", label: "Analytique" }}
        />
    );

    if (isLoading) {
        return (
            <div>
                {header}
                <Card>
                    <LoadingState rows={6} label="Chargement des indicateurs…" />
                </Card>
            </div>
        );
    }

    if (isError) {
        const retry = () => {
            collection.refetch();
            wastage.refetch();
            liberation.refetch();
            stock.refetch();
        };
        return (
            <div>
                {header}
                <Card>
                    <ErrorState message="Les indicateurs n'ont pas pu être chargés." onRetry={retry} />
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {header}

            {collection.data && (
                <KPICategory
                    title="Collecte de sang"
                    description="Performance de la collecte et mobilisation des donneurs"
                    icon={Droplet}
                    color="bg-red-50 text-red-600"
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
                        color="bg-red-50 text-red-600"
                        description="Nombre moyen de dons collectés par jour"
                    />
                </KPICategory>
            )}

            {liberation.data && wastage.data && (
                <KPICategory
                    title="Qualité & conformité"
                    description="Taux de libération et gestion des pertes"
                    icon={CheckCircle}
                    color="bg-emerald-50 text-emerald-600"
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
                        color="bg-emerald-50 text-emerald-600"
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
                        color="bg-amber-50 text-amber-600"
                        description="Pourcentage de poches périmées ou non distribuables"
                    />
                </KPICategory>
            )}

            {stock.data && (
                <KPICategory
                    title="Gestion du stock"
                    description="Disponibilité et rotation des produits sanguins"
                    icon={Package}
                    color="bg-blue-50 text-blue-600"
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
                        color="bg-blue-50 text-blue-600"
                        description="Nombre de poches disponibles pour distribution"
                    />
                </KPICategory>
            )}

            <KPICategory
                title="Distribution & livraison"
                description="Efficacité de la distribution aux établissements de santé"
                icon={Truck}
                color="bg-violet-50 text-violet-600"
            >
                <Card className="col-span-full">
                    <EmptyState
                        icon={<BarChart3 className="h-6 w-6" aria-hidden="true" />}
                        title="Métriques de distribution"
                        description="Les indicateurs de distribution seront ajoutés dans une prochaine version."
                    />
                </Card>
            </KPICategory>

            <Card>
                <CardBody className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                    <div className="flex-1">
                        <h2 className="mb-2 text-sm font-semibold text-gray-900">Comment interpréter les tendances</h2>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                                <span><strong>Tendance favorable :</strong> amélioration par rapport à la période précédente.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                                <span><strong>Tendance à surveiller :</strong> dégradation nécessitant une attention (ex. : hausse du gaspillage).</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-gray-700" aria-hidden="true" />
                                <span><strong>En hausse :</strong> augmentation de 5 % ou plus.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-700" aria-hidden="true" />
                                <span><strong>En baisse :</strong> diminution de 5 % ou plus.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Minus className="mt-0.5 h-4 w-4 shrink-0 text-gray-700" aria-hidden="true" />
                                <span><strong>Stable :</strong> variation comprise entre -5 % et +5 %.</span>
                            </li>
                        </ul>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
