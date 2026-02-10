/**
 * Mock de la base de données SQLite pour la plateforme web.
 * Sur le web, on utilise un stockage en mémoire simplifié.
 */

const noopDb = {
  execAsync: async () => {},
  getFirstAsync: async () => null,
  getAllAsync: async () => [],
  runAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
  closeAsync: async () => {},
};

let _ready = false;

export async function openDatabase() {
  _ready = true;
  return noopDb as any;
}

export function getDatabase() {
  if (!_ready) throw new Error("Base de données non initialisée.");
  return noopDb as any;
}
