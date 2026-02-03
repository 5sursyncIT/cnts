export type DemoPatientUser = {
  id: string;
  email: string;
  displayName: string;
  password: string;
};

export function getDemoPatientByEmail(email: string): DemoPatientUser | null {
  const demoEmail = process.env.PORTAL_DEMO_PATIENT_EMAIL ?? "patient@cnts.local";
  if (email.toLowerCase() !== demoEmail.toLowerCase()) return null;

  return {
    id: "patient_demo",
    email: demoEmail,
    displayName: process.env.PORTAL_DEMO_PATIENT_NAME ?? "Patient Démo",
    password: process.env.PORTAL_DEMO_PATIENT_PASSWORD ?? "patient"
  };
}

export function verifyPassword(user: DemoPatientUser, password: string): boolean {
  return user.password === password;
}

