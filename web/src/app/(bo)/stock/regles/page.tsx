"use client";

import { useProductRules } from "@cnts/api";
import type { ProductRule } from "@cnts/api";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

export default function ProductRulesPage() {
  const { data: rules, refetch, status } = useProductRules(apiClient);
  const [editingRule, setEditingRule] = useState<ProductRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (rule: ProductRule) => {
    setEditingRule({ ...rule });
    setError(null);
  };

  const handleCancel = () => {
    setEditingRule(null);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.stock.upsertProductRule(editingRule.type_produit, {
        shelf_life_days: editingRule.shelf_life_days,
        default_volume_ml: editingRule.default_volume_ml || undefined,
        min_volume_ml: editingRule.min_volume_ml || undefined,
        max_volume_ml: editingRule.max_volume_ml || undefined,
      });
      await refetch();
      setEditingRule(null);
      toast.success("Règle enregistrée");
    } catch (err) {
      setError(apiErrorMessage(err, "Erreur lors de la sauvegarde"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    field: keyof ProductRule,
    value: string | number | null
  ) => {
    if (!editingRule) return;

    // Convert inputs to numbers or null
    let numValue: number | null = null;
    if (value !== "" && value !== null) {
      numValue = Number(value);
    }

    setEditingRule({
      ...editingRule,
      [field]: numValue,
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ST: "Sang total (ST)",
      CGR: "Concentré de globules rouges (CGR)",
      PFC: "Plasma frais congelé (PFC)",
      CP: "Concentré plaquettaire (CP)",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Règles produits"
        description="Durées de vie et volumes par type de produit"
        back={{ href: "/stock", label: "Stock" }}
      />

      <Card>
        {status === "loading" && <LoadingState rows={4} />}

        {status === "error" && (
          <ErrorState message="Une erreur est survenue lors du chargement des règles." onRetry={() => refetch()} />
        )}

        {status === "success" && (!rules || rules.length === 0) && (
          <EmptyState title="Aucune règle produit" description="Aucune règle n’est configurée pour le moment." />
        )}

        {status === "success" && rules && rules.length > 0 && (
          <Table>
            <THead>
              <tr>
                <Th>Type de produit</Th>
                <Th align="right">Durée de vie (jours)</Th>
                <Th align="right">Volume par défaut (mL)</Th>
                <Th align="right">Volume min. (mL)</Th>
                <Th align="right">Volume max. (mL)</Th>
                <Th align="right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {rules.map((rule) => (
                <Tr key={rule.type_produit}>
                  <Td className="whitespace-nowrap">
                    <div className="font-medium text-gray-900">{rule.type_produit}</div>
                    <div className="text-xs text-gray-600">{getTypeLabel(rule.type_produit)}</div>
                  </Td>
                  <Td align="right" className="tabular-nums">{rule.shelf_life_days}</Td>
                  <Td align="right" className="tabular-nums">{rule.default_volume_ml || "—"}</Td>
                  <Td align="right" className="tabular-nums">{rule.min_volume_ml || "—"}</Td>
                  <Td align="right" className="tabular-nums">{rule.max_volume_ml || "—"}</Td>
                  <Td align="right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                      icon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
                      aria-label={`Modifier la règle ${rule.type_produit}`}
                    >
                      Modifier
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal
        open={editingRule !== null}
        onClose={handleCancel}
        title={`Modifier la règle ${editingRule?.type_produit ?? ""}`}
        description={editingRule ? getTypeLabel(editingRule.type_produit) : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
              Annuler
            </Button>
            <Button type="submit" form="regle-form" loading={isSaving}>
              Enregistrer
            </Button>
          </>
        }
      >
        {editingRule && (
          <form id="regle-form" onSubmit={handleSave} className="space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}

            <Field label="Durée de vie (jours)" required>
              <Input
                type="number"
                min="1"
                max="3650"
                value={editingRule.shelf_life_days}
                onChange={(e) => handleChange("shelf_life_days", e.target.value)}
              />
            </Field>

            <Field label="Volume par défaut (mL)">
              <Input
                type="number"
                min="0"
                max="2000"
                value={editingRule.default_volume_ml || ""}
                onChange={(e) => handleChange("default_volume_ml", e.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Volume min. (mL)">
                <Input
                  type="number"
                  min="0"
                  max="2000"
                  value={editingRule.min_volume_ml || ""}
                  onChange={(e) => handleChange("min_volume_ml", e.target.value)}
                />
              </Field>
              <Field label="Volume max. (mL)">
                <Input
                  type="number"
                  min="0"
                  max="2000"
                  value={editingRule.max_volume_ml || ""}
                  onChange={(e) => handleChange("max_volume_ml", e.target.value)}
                />
              </Field>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
