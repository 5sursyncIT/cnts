"use client";

import { useCreateDonneur } from "@cnts/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";

const REGIONS_SENEGAL = [
  "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou",
  "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda",
  "Thiès", "Ziguinchor",
];

const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function NouveauDonneurPage() {
  const router = useRouter();
  const { mutate: createDonneur, status, error } = useCreateDonneur(apiClient);

  const [formData, setFormData] = useState({
    cni: "",
    nom: "",
    prenom: "",
    sexe: "H" as "H" | "F",
    date_naissance: "",
    groupe_sanguin: "",
    adresse: "",
    region: "",
    departement: "",
    telephone: "",
    email: "",
    profession: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cni.trim()) {
      newErrors.cni = "Le numéro CNI est requis";
    } else if (formData.cni.length < 10) {
      newErrors.cni = "Le numéro CNI doit contenir au moins 10 caractères";
    }

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = "Le prénom est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        ...formData,
        date_naissance: formData.date_naissance || undefined,
        groupe_sanguin: formData.groupe_sanguin || undefined,
        adresse: formData.adresse || undefined,
        region: formData.region || undefined,
        departement: formData.departement || undefined,
        telephone: formData.telephone || undefined,
        email: formData.email || undefined,
        profession: formData.profession || undefined,
      };

      const donneur = await createDonneur(payload);
      toast.success("Donneur enregistré");
      // Rediriger vers la fiche du donneur créé
      router.push(`/donneurs/${donneur.id}`);
    } catch (err) {
      // L'erreur est aussi exposée par le hook (affichée au-dessus du formulaire)
      console.error("Erreur création donneur:", err);
      toast.error(
        (err as { status?: number })?.status === 409
          ? "Un donneur avec ce numéro CNI existe déjà"
          : apiErrorMessage(err, "Création du donneur impossible")
      );
    }
  };

  const set = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) =>
    setFormData({ ...formData, [key]: value });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Nouveau donneur"
        description="Enregistrer un nouveau donneur dans le système"
        back={{ href: "/donneurs", label: "Retour à la liste" }}
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {status === "error" && error && (
          <Alert tone="danger">
            <p className="font-medium">Erreur lors de la création</p>
            <p className="mt-1">
              {error.status === 409
                ? "Un donneur avec ce numéro CNI existe déjà"
                : apiErrorMessage(error, "Création du donneur impossible")}
            </p>
          </Alert>
        )}

        <Card>
          <CardHeader title="Identité" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Numéro CNI" required error={errors.cni}>
              <Input
                type="text"
                id="cni"
                autoComplete="off"
                value={formData.cni}
                onChange={(e) => set("cni", e.target.value)}
              />
            </Field>
            <Field label="Date de naissance">
              <Input
                type="date"
                id="date_naissance"
                value={formData.date_naissance}
                onChange={(e) => set("date_naissance", e.target.value)}
              />
            </Field>
            <Field label="Prénom" required error={errors.prenom}>
              <Input
                type="text"
                id="prenom"
                autoComplete="given-name"
                value={formData.prenom}
                onChange={(e) => set("prenom", e.target.value)}
              />
            </Field>
            <Field label="Nom" required error={errors.nom}>
              <Input
                type="text"
                id="nom"
                autoComplete="family-name"
                value={formData.nom}
                onChange={(e) => set("nom", e.target.value)}
              />
            </Field>
            <Field label="Sexe" required>
              <Select id="sexe" value={formData.sexe} onChange={(e) => set("sexe", e.target.value as "H" | "F")}>
                <option value="H">Homme</option>
                <option value="F">Femme</option>
              </Select>
            </Field>
            <Field label="Groupe sanguin">
              <Select
                id="groupe_sanguin"
                value={formData.groupe_sanguin}
                onChange={(e) => set("groupe_sanguin", e.target.value)}
              >
                <option value="">Sélectionner…</option>
                {GROUPES_SANGUINS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Coordonnées" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Adresse" className="sm:col-span-2">
              <Input
                type="text"
                id="adresse"
                autoComplete="street-address"
                value={formData.adresse}
                onChange={(e) => set("adresse", e.target.value)}
              />
            </Field>
            <Field label="Région">
              <Select id="region" value={formData.region} onChange={(e) => set("region", e.target.value)}>
                <option value="">Sélectionner…</option>
                {REGIONS_SENEGAL.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Département">
              <Input
                type="text"
                id="departement"
                value={formData.departement}
                onChange={(e) => set("departement", e.target.value)}
              />
            </Field>
            <Field label="Téléphone">
              <Input
                type="tel"
                id="telephone"
                autoComplete="tel"
                value={formData.telephone}
                onChange={(e) => set("telephone", e.target.value)}
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                id="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Informations complémentaires" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Profession">
              <Input
                type="text"
                id="profession"
                value={formData.profession}
                onChange={(e) => set("profession", e.target.value)}
              />
            </Field>
          </CardBody>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <ButtonLink href="/donneurs" variant="secondary">
            Annuler
          </ButtonLink>
          <Button type="submit" loading={status === "loading"}>
            {status === "loading" ? "Création…" : "Créer le donneur"}
          </Button>
        </div>
      </form>

      <Alert tone="info">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Règles de création d’un donneur</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Le numéro CNI est hashé et indexé pour détecter les doublons.</li>
              <li>Les délais d’éligibilité sont automatiquement calculés selon le sexe.</li>
              <li>Après création, vous pourrez créer un don pour ce donneur.</li>
            </ul>
          </div>
        </div>
      </Alert>
    </div>
  );
}
