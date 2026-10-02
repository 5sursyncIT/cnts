import { expect, test } from "@playwright/test";

// Parcours de l'espace patient, à lancer contre un portail ouvert (ESPACE_PATIENT_OUVERT = true)
// relié à une API de test. Les tests connectés exigent un compte donneur confirmé :
//   E2E_PATIENT_EMAIL=… E2E_PATIENT_PASSWORD=… npm run e2e
const email = process.env.E2E_PATIENT_EMAIL;
const password = process.env.E2E_PATIENT_PASSWORD;

test("une page protégée renvoie vers la connexion en gardant la destination", async ({ page }) => {
  await page.goto("/espace-patient/rendez-vous");
  await expect(page).toHaveURL(/\/espace-patient\/connexion\?next=%2Fespace-patient%2Frendez-vous/);
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
});

test("la redirection après connexion reste dans l'espace patient", async ({ page }) => {
  await page.goto("/espace-patient/connexion?next=https://exemple.invalide");
  await expect(page.locator('input[name="next"]')).toHaveValue("/espace-patient/tableau-de-bord");
});

test("mot de passe oublié : réponse identique pour une adresse inconnue", async ({ page }) => {
  await page.goto("/espace-patient/mot-de-passe-oublie");
  await page.getByLabel("Email du compte").fill("adresse-inconnue@exemple.sn");
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByText("Si un compte correspond à cette adresse")).toBeVisible();
});

test.describe("donneur connecté", () => {
  test.skip(!email || !password, "E2E_PATIENT_EMAIL / E2E_PATIENT_PASSWORD non définis");

  test("connexion, navigation et déconnexion", async ({ page }) => {
    await page.goto("/espace-patient/connexion");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Mot de passe").fill(password!);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/espace-patient\/tableau-de-bord/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Bonjour");

    await page.getByRole("link", { name: "Rendez-vous" }).first().click();
    await expect(page.getByRole("heading", { name: "Mes rendez-vous" })).toBeVisible();

    await page.getByRole("button", { name: /Se déconnecter|Déconnexion/ }).click();
    await expect(page).toHaveURL(/\/espace-patient\/connexion\?logout=1/);
    await page.goto("/espace-patient/tableau-de-bord");
    await expect(page).toHaveURL(/\/espace-patient\/connexion/);
  });

  test("prise puis annulation d'un rendez-vous", async ({ page }) => {
    await page.goto("/espace-patient/connexion?next=/espace-patient/rendez-vous");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Mot de passe").fill(password!);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/espace-patient\/rendez-vous/);

    // Un RDV laissé par un passage précédent empêcherait d'en prendre un autre.
    await expect(page.getByRole("heading", { name: "Prendre rendez-vous" })).toBeVisible();
    while (await page.getByRole("button", { name: /Annuler le rendez-vous du/ }).count()) {
      await page.getByRole("button", { name: /Annuler le rendez-vous du/ }).first().click();
      await page.getByRole("button", { name: "Oui, annuler" }).click();
      await expect(page.getByRole("button", { name: "Confirmer le rendez-vous" })).toBeVisible();
    }

    // Prochain jour de semaine (lun–ven), au moins demain.
    const d = new Date();
    do d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6);
    const jour = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    await page.getByLabel("Date").fill(jour);
    const heure = page.getByLabel("Heure");
    await expect(heure).toBeEnabled();
    await expect(heure.locator("option").first()).toContainText("place");
    await page.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
    await expect(page).toHaveURL(/\/espace-patient\/rendez-vous\?ok=1/);
    await expect(page.getByText("Rendez-vous enregistré")).toBeVisible();
    await expect(page.getByText("Vous avez déjà un rendez-vous à venir")).toBeVisible();

    await page.getByRole("button", { name: /Annuler le rendez-vous du/ }).click();
    await page.getByRole("button", { name: "Oui, annuler" }).click();
    await expect(page.getByRole("button", { name: "Confirmer le rendez-vous" })).toBeVisible();
    await expect(page.getByText("Annulé par le donneur").first()).toBeVisible();
  });
});
