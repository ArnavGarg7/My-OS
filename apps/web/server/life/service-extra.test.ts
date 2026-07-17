import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  insertMedication: vi.fn(),
  insertSupplement: vi.fn(),
  insertAppointment: vi.fn(),
  updateAppointmentRow: vi.fn(),
  updateInjuryRow: vi.fn(),
  updateHabitRow: vi.fn(),
  listHabits: vi.fn(),
  listMedications: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import {
  createAppointment,
  createMedication,
  createSupplement,
  listHabits,
  listMedications,
  updateAppointment,
  updateHabit,
  updateInjury,
} from "./service";

const db = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  h.insertMedication.mockImplementation((_db, x) => Promise.resolve({ id: "m1", ...x }));
  h.insertSupplement.mockImplementation((_db, x) => Promise.resolve({ id: "s1", ...x }));
  h.insertAppointment.mockImplementation((_db, x) => Promise.resolve({ id: "a1", ...x }));
  h.updateAppointmentRow.mockImplementation((_db, id, p) => Promise.resolve({ id, ...p }));
  h.updateInjuryRow.mockImplementation((_db, id, p) => Promise.resolve({ id, ...p }));
  h.updateHabitRow.mockImplementation((_db, id, p) => Promise.resolve({ id, ...p }));
  h.listHabits.mockResolvedValue([]);
  h.listMedications.mockResolvedValue([]);
});

describe("life service extra", () => {
  it("creates a medication", async () => {
    await createMedication(db, { name: "Vit D" });
    expect(h.insertMedication).toHaveBeenCalledWith(db, { name: "Vit D" });
  });
  it("creates a supplement", async () => {
    await createSupplement(db, { name: "Creatine" });
    expect(h.insertSupplement).toHaveBeenCalled();
  });
  it("creates + completes an appointment", async () => {
    await createAppointment(db, { title: "Physical", date: "2026-07-16" });
    expect(h.insertAppointment).toHaveBeenCalled();
    await updateAppointment(db, "a1", { completed: true });
    expect(h.updateAppointmentRow).toHaveBeenCalledWith(db, "a1", { completed: true });
  });
  it("marks an injury healed", async () => {
    await updateInjury(db, "i1", { status: "healed" });
    expect(h.updateInjuryRow).toHaveBeenCalledWith(db, "i1", { status: "healed" });
  });
  it("archives a habit", async () => {
    await updateHabit(db, "h1", { archived: true });
    expect(h.updateHabitRow).toHaveBeenCalledWith(db, "h1", { archived: true });
  });
  it("delegates list reads", async () => {
    await listHabits(db);
    await listMedications(db);
    expect(h.listHabits).toHaveBeenCalled();
    expect(h.listMedications).toHaveBeenCalled();
  });
});
