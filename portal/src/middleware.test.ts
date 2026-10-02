// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const flag = vi.hoisted(() => ({ ouvert: true }));
vi.mock("@/lib/espace-patient", () => ({
  get ESPACE_PATIENT_OUVERT() {
    return flag.ouvert;
  },
}));

import { signSession } from "@/lib/auth/session";
import { middleware } from "./middleware";

const req = (path: string, cookie?: string) =>
  new NextRequest(new URL(path, "https://cnts.gouv.sn"), { headers: cookie ? { cookie } : {} });

describe("middleware espace patient", () => {
  beforeEach(() => {
    flag.ouvert = true;
    process.env.PORTAL_SESSION_SECRET = "test-secret";
  });

  it("espace fermé : redirection vers la page en construction, avec en-têtes de sécurité", async () => {
    flag.ouvert = false;
    const res = await middleware(req("/espace-patient/connexion"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://cnts.gouv.sn/espace-patient");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
  });

  it("page protégée sans session : connexion avec next, cookie invalide supprimé", async () => {
    const res = await middleware(req("/espace-patient/rendez-vous", "cnts_portal_session=forge"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://cnts.gouv.sn/espace-patient/connexion?next=%2Fespace-patient%2Frendez-vous");
    expect(res.headers.get("set-cookie")).toMatch(/cnts_portal_session=;/);
    expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });

  it("pages publiques du compte accessibles sans session", async () => {
    for (const path of ["/espace-patient/inscription", "/espace-patient/verification", "/espace-patient/mot-de-passe-oublie", "/espace-patient/nouveau-mot-de-passe", "/espace-patient/verification-sms"]) {
      const res = await middleware(req(path));
      expect(res.headers.get("location"), path).toBeNull();
    }
  });

  it("session valide : accès et pas de cache partagé", async () => {
    const token = await signSession({ userId: "u", email: "a@b.sn", displayName: "A", accessToken: "t" }, 60);
    const res = await middleware(req("/espace-patient/profil", `cnts_portal_session=${token}`));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("session expirée côté backend : cookie supprimé sur la page de connexion", async () => {
    const res = await middleware(req("/espace-patient/connexion?error=expired", "cnts_portal_session=x"));
    expect(res.headers.get("set-cookie")).toMatch(/cnts_portal_session=;/);
  });

  it("anciennes pages redirigées", async () => {
    const res = await middleware(req("/espace-patient/messagerie"));
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://cnts.gouv.sn/contact");
  });
});
