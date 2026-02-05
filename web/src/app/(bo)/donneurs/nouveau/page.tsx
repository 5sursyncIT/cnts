"use client";

import { useCreateDonneur } from "@cnts/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

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

  const REGIONS_SENEGAL = [
    "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou",
    "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda",
    "Thiès", "Ziguinchor"
  ];

  const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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
      // Rediriger vers la fiche du donneur créé
      router.push(`/donneurs/${donneur.id}`);
    } catch (err) {
      // L'erreur est gérée par le hook
      console.error("Erreur création donneur:", err);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/donneurs"
          className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block"
        >
          ← Retour à la liste
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau Donneur</h1>
        <p className="text-gray-700 mt-1">
          Enregistrer un nouveau donneur dans le système
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* Erreur globale */}
        {status === "error" && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm font-medium text-red-900">
              Erreur lors de la création
            </div>
            <div className="text-sm text-red-600 mt-1">
              {error.status === 409
                ? "Un donneur avec ce numéro CNI existe déjà"
                : `Erreur ${error.status}: ${JSON.stringify(error.body)}`}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CNI */}
            <div>
              <label
                htmlFor="cni"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Numéro CNI <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="cni"
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.cni ? "border-red-300" : "border-gray-300"
                  }`}
                value={formData.cni}
                onChange={(e) =>
                  setFormData({ ...formData, cni: e.target.value })
                }
              />
              {errors.cni && (
                <p className="mt-1 text-sm text-red-600">{errors.cni}</p>
              )}
            </div>

            {/* Date de naissance */}
            <div>
              <label
                htmlFor="date_naissance"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date de naissance
              </label>
              <input
                type="date"
                id="date_naissance"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                value={formData.date_naissance}
                onChange={(e) =>
                  setFormData({ ...formData, date_naissance: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prénom */}
            <div>
              <label
                htmlFor="prenom"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Prénom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="prenom"
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.prenom ? "border-red-300" : "border-gray-300"
                  }`}
                value={formData.prenom}
                onChange={(e) =>
                  setFormData({ ...formData, prenom: e.target.value })
                }
              />
              {errors.prenom && (
                <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>
              )}
            </div>

            {/* Nom */}
            <div>
              <label
                htmlFor="nom"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="nom"
                className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.nom ? "border-red-300" : "border-gray-300"
                  }`}
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
              />
              {errors.nom && (
                <p className="mt-1 text-sm text-red-600">{errors.nom}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sexe */}
            <div>
              <label
                htmlFor="sexe"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Sexe <span className="text-red-600">*</span>
              </label>
              <select
                id="sexe"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                value={formData.sexe}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sexe: e.target.value as "H" | "F",
                  })
                }
              >
                <option value="H">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>

            {/* Groupe Sanguin */}
            <div>
              <label
                htmlFor="groupe_sanguin"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Groupe Sanguin
              </label>
              <select
                id="groupe_sanguin"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                value={formData.groupe_sanguin}
                onChange={(e) =>
                  setFormData({ ...formData, groupe_sanguin: e.target.value })
                }
              >
                <option value="">Sélectionner...</option>
                {GROUPES_SANGUINS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordonnées */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Coordonnées</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Adresse */}
              <div className="md:col-span-2">
                <label
                  htmlFor="adresse"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Adresse
                </label>
                <input
                  type="text"
                  id="adresse"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                />
              </div>

              {/* Région */}
              <div>
                <label
                  htmlFor="region"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Région
                </label>
                <select
                  id="region"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                >
                  <option value="">Sélectionner...</option>
                  {REGIONS_SENEGAL.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Département */}
              <div>
                <label
                  htmlFor="departement"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Département
                </label>
                <input
                  type="text"
                  id="departement"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={formData.departement}
                  onChange={(e) =>
                    setFormData({ ...formData, departement: e.target.value })
                  }
                />
              </div>

              {/* Téléphone */}
              <div>
                <label
                  htmlFor="telephone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="telephone"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={formData.telephone}
                  onChange={(e) =>
                    setFormData({ ...formData, telephone: e.target.value })
                  }
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Informations complémentaires */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations complémentaires</h3>

            {/* Profession */}
            <div>
              <label
                htmlFor="profession"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Profession
              </label>
              <input
                type="text"
                id="profession"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                value={formData.profession}
                onChange={(e) =>
                  setFormData({ ...formData, profession: e.target.value })
                }
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Link
              href="/donneurs"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {status === "loading" ? "Création..." : "Créer le donneur"}
            </button>
          </div>
        </div>
      </form>

      {/* Informations complémentaires */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-medium text-blue-900 mb-2">
          Règles de création d'un donneur
        </h3>
        <ul className="text-sm text-blue-900 space-y-1">
          <li>• Le numéro CNI est hashé et indexé pour détecter les doublons</li>
          <li>
            • Les délais d'éligibilité sont automatiquement calculés selon le
            sexe
          </li>
          <li>
            • Après création, vous pourrez créer un don pour ce donneur
          </li>
        </ul>
      </div>
    </div>
  );
}
