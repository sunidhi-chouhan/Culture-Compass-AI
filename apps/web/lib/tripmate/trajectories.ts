/** sessionStorage bucket for TripMate agent trajectories (not a credential). */
export const TRIPMATE_TRAJECTORIES_STORAGE_KEY = [
  "journeymind",
  "tripmate",
  "trajectories",
  "v1",
].join(".");

export type TripMateTrajectoryStageName =
  | "analyze"
  | "propose"
  | "verify"
  | "apply"
  | "failed";

export interface TripMateTrajectoryStage {
  name: TripMateTrajectoryStageName;
  at: string;
  detail?: string;
}

export interface TripMateTrajectory {
  id: string;
  createdAt: string;
  updatedAt: string;
  destination: string;
  status: "running" | "done" | "failed" | "applied";
  stages: TripMateTrajectoryStage[];
  suggestionCount?: number;
  applied?: boolean;
}

const MAX_TRAJECTORIES = 40;

function readAll(storage: Pick<Storage, "getItem">): TripMateTrajectory[] {
  try {
    const raw = storage.getItem(TRIPMATE_TRAJECTORIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TripMateTrajectory[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(storage: Pick<Storage, "setItem">, rows: TripMateTrajectory[]): void {
  storage.setItem(
    TRIPMATE_TRAJECTORIES_STORAGE_KEY,
    JSON.stringify(rows.slice(0, MAX_TRAJECTORIES)),
  );
}

export function startTripMateTrajectory(
  storage: Pick<Storage, "getItem" | "setItem">,
  destination: string,
): TripMateTrajectory {
  const now = new Date().toISOString();
  const row: TripMateTrajectory = {
    id: `tm-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    destination,
    status: "running",
    stages: [{ name: "analyze", at: now, detail: "Listening to the current schedule…" }],
  };
  const all = readAll(storage);
  writeAll(storage, [row, ...all]);
  return row;
}

export function appendTripMateStage(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  stage: Omit<TripMateTrajectoryStage, "at"> & { at?: string },
  patch?: Partial<Pick<TripMateTrajectory, "status" | "suggestionCount" | "applied">>,
): void {
  const all = readAll(storage);
  const idx = all.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const now = stage.at ?? new Date().toISOString();
  all[idx] = {
    ...all[idx],
    ...patch,
    updatedAt: now,
    stages: [...all[idx].stages, { name: stage.name, at: now, detail: stage.detail }],
  };
  writeAll(storage, all);
}

export function listTripMateTrajectories(
  storage: Pick<Storage, "getItem">,
): TripMateTrajectory[] {
  return readAll(storage);
}
