"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Phone, Lock, User, AlertCircle, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [method, setMethod] = useState<"email" | "phone">("email");

  return (
    <main className="bg-zinc-50 min-h-screen py-12">
      <div className="mx-auto max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Créer un compte</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Rejoignez la communauté des donneurs et gérez vos rendez-vous.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-zinc-200">
            <button
              onClick={() => setMethod("email")}
              className={`p-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                method === "email"
                  ? "bg-white text-primary border-b-2 border-primary"
                  : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              onClick={() => setMethod("phone")}
              className={`p-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                method === "phone"
                  ? "bg-white text-primary border-b-2 border-primary"
                  : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Phone className="h-4 w-4" />
              Téléphone
            </button>
          </div>

          <div className="p-6">
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstname" className="block text-sm font-medium text-zinc-700 mb-1">
                    Prénom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      id="firstname"
                      type="text"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-md border border-zinc-300 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Jean"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastname" className="block text-sm font-medium text-zinc-700 mb-1">
                    Nom
                  </label>
                  <input
                    id="lastname"
                    type="text"
                    required
                    className="w-full px-3 py-2 rounded-md border border-zinc-300 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Diop"
                  />
                </div>
              </div>

              {method === "email" ? (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                    Adresse Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-md border border-zinc-300 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="jean.diop@exemple.com"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 mb-1">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      id="phone"
                      type="tel"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-md border border-zinc-300 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="77 000 00 00"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-zinc-300 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-500">Au moins 8 caractères</p>
              </div>

              <div className="bg-blue-50 p-3 rounded-md flex gap-2 text-blue-700 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  En créant un compte, vous acceptez de recevoir des communications du CNTS concernant vos rendez-vous et les urgences.
                </p>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
              >
                Créer mon compte
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
          
          <div className="bg-zinc-50 px-6 py-4 text-center border-t border-zinc-200">
            <p className="text-sm text-zinc-600">
              Vous avez déjà un compte ?{" "}
              <Link href="/espace-patient/connexion" className="font-medium text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
