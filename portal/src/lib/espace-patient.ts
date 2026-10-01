// Interrupteur de l'espace patient. Tant qu'il vaut `false`, toutes les pages
// /espace-patient/* redirigent vers /espace-patient (message « en construction »)
// et les Server Actions de connexion / inscription / RDV / profil sont refusées.
export const ESPACE_PATIENT_OUVERT = false;

export const ESPACE_PATIENT_FERME_MSG = "L'espace patient est en construction et n'est pas encore accessible.";
