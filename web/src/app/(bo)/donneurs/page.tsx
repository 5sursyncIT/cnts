"use client";

import { useDonneurs } from "@cnts/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, RefreshCw, Users } from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  PageHeader,
  Pagination,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

const REGIONS_SENEGAL = [
  "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou",
  "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda",
  "Thiès", "Ziguinchor",
];

const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DonneursPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sexeFilter, setSexeFilter] = useState<"H" | "F" | "">("");
  const [groupeFilter, setGroupeFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Recherche debouncée : le backend fait un ILIKE '%q%' non indexable, on évite
  // donc une requête (scan complet) à chaque frappe.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, status, error, refetch } = useDonneurs(apiClient, {
    q: searchQuery || undefined,
    sexe: (sexeFilter || undefined) as "H" | "F" | undefined,
    groupe_sanguin: groupeFilter || undefined,
    region: regionFilter || undefined,
    // On demande un élément de plus que la page pour savoir s'il existe une page
    // suivante (l'API ne renvoie pas de total).
    limit: ITEMS_PER_PAGE + 1,
    offset: (page - 1) * ITEMS_PER_PAGE,
  });

  const hasNext = (data?.length ?? 0) > ITEMS_PER_PAGE;
  const donneurs = data?.slice(0, ITEMS_PER_PAGE);
  const hasFilters = Boolean(searchQuery || sexeFilter || groupeFilter || regionFilter);

  const resetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSexeFilter("");
    setGroupeFilter("");
    setRegionFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donneurs"
        description="Liste des donneurs enregistrés dans le système"
        actions={
          <ButtonLink href="/donneurs/nouveau" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Nouveau donneur
          </ButtonLink>
        }
      />

      <Card className="p-4">
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Rechercher" className="sm:col-span-2 lg:col-span-2">
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="N° carte, nom, prénom, téléphone…"
            />
          </Field>
          <Field label="Sexe">
            <Select
              value={sexeFilter}
              onChange={(e) => {
                setSexeFilter(e.target.value as "H" | "F" | "");
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              <option value="H">Homme</option>
              <option value="F">Femme</option>
            </Select>
          </Field>
          <Field label="Groupe sanguin">
            <Select
              value={groupeFilter}
              onChange={(e) => {
                setGroupeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              {GROUPES_SANGUINS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <Field label="Région" className="flex-1">
              <Select
                value={regionFilter}
                onChange={(e) => {
                  setRegionFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Toutes</option>
                {REGIONS_SENEGAL.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              variant="secondary"
              onClick={() => refetch()}
              aria-label="Actualiser la liste"
              title="Actualiser"
              className="px-3"
              icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {status === "loading" && <LoadingState rows={8} />}

        {status === "error" && (
          <ErrorState message={apiErrorMessage(error, "Impossible de charger les donneurs.")} onRetry={() => refetch()} />
        )}

        {status === "success" && donneurs && donneurs.length === 0 && (
          <EmptyState
            icon={<Users className="h-6 w-6" aria-hidden="true" />}
            title="Aucun donneur trouvé"
            description={hasFilters ? "Aucun résultat ne correspond à ces critères." : "Aucun donneur n’est encore enregistré."}
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              ) : (
                <ButtonLink href="/donneurs/nouveau" size="sm" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                  Nouveau donneur
                </ButtonLink>
              )
            }
          />
        )}

        {status === "success" && donneurs && donneurs.length > 0 && (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Nom et prénom</Th>
                  <Th>Sexe</Th>
                  <Th>Groupe</Th>
                  <Th>Région</Th>
                  <Th>N° carte</Th>
                  <Th>Téléphone</Th>
                  <Th>Dernier don</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </THead>
              <TBody>
                {donneurs.map((donneur) => (
                  <Tr key={donneur.id}>
                    <Td className="whitespace-nowrap">
                      <Link href={`/donneurs/${donneur.id}`} className="font-medium text-gray-900 hover:text-blue-700">
                        {donneur.nom}, {donneur.prenom}
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone={donneur.sexe === "H" ? "info" : "purple"}>
                        {donneur.sexe === "H" ? "Homme" : "Femme"}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap font-medium">{donneur.groupe_sanguin || "—"}</Td>
                    <Td className="whitespace-nowrap text-gray-600">{donneur.region || "—"}</Td>
                    <Td className="whitespace-nowrap">
                      {donneur.numero_carte ? (
                        <span className="font-mono text-xs text-gray-800">{donneur.numero_carte}</span>
                      ) : (
                        <span className="text-xs italic text-gray-400">Non attribuée</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-gray-600">{donneur.telephone || "—"}</Td>
                    <Td className="whitespace-nowrap text-gray-600">
                      {donneur.dernier_don ? new Date(donneur.dernier_don).toLocaleDateString("fr-FR") : "Jamais"}
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <div className="flex justify-end gap-3 text-sm font-medium">
                        <Link href={`/donneurs/${donneur.id}`} className="text-blue-600 hover:text-blue-800">
                          Voir
                        </Link>
                        <Link href={`/donneurs/${donneur.id}/eligibilite`} className="text-emerald-700 hover:text-emerald-900">
                          Éligibilité
                        </Link>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination
              page={page}
              hasNext={hasNext}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              summary={`Page ${page} · ${donneurs.length} résultat${donneurs.length > 1 ? "s" : ""} affiché${donneurs.length > 1 ? "s" : ""}`}
            />
          </>
        )}
      </Card>
    </div>
  );
}
