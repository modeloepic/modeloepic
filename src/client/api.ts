// Sustituto estático del cliente RPC del artefacto fullstack.
//
// En el artefacto original, `api.getScores` hacía POST a `./actions` y el
// servidor de Muse consultaba ESPN. En esta versión para hosting estático
// (GitHub + Netlify/Vercel) no hay servidor: `getScores` se resuelve en el
// propio navegador contra los endpoints públicos de ESPN (ver espn.ts).
// La interfaz pública es idéntica para que App.tsx no cambie.

import { getScores, type ScoresResponse, type SportKey } from "./espn";

export const api = {
  getScores: (args: { sport: SportKey }): Promise<ScoresResponse> =>
    getScores(args),
};

// Equivalente al helper ApiResponse del SDK: extrae el tipo de respuesta de
// una acción del cliente. Solo se usa en tipos, nunca en runtime.
export type ApiResponse<
  T,
  K extends keyof T,
> = T[K] extends (args: never) => Promise<infer R> ? R : never;
