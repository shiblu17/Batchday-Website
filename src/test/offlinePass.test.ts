import { describe, it, expect, beforeEach } from "vitest";
import {
  saveOfflinePass,
  loadOfflinePass,
  clearOfflinePass,
  OFFLINE_PASS_STORAGE_KEY,
  type PassUserData,
} from "@/utils/offlinePass";

describe("Offline Digital Pass storage helper", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and restores a verified student pass cleanly", () => {
    const sampleUser: PassUserData = {
      id: "reg-123",
      name: "Test Student",
      department: "Computer Science and Engineering",
      hall: "Al Beruni Hall",
      status: "verified",
      tshirt_size: "L",
      attended: false,
    };

    saveOfflinePass(" 5201 ", sampleUser);
    const loaded = loadOfflinePass();

    expect(loaded).not.toBeNull();
    expect(loaded?.roll).toBe("5201");
    expect(loaded?.userData.name).toBe("Test Student");
    expect(loaded?.userData.tshirt_size).toBe("L");
    expect(loaded?.savedAt).toBeTruthy();
  });

  it("returns null on corrupted JSON and clears cleanly", () => {
    localStorage.setItem(OFFLINE_PASS_STORAGE_KEY, "{broken-json");
    expect(loadOfflinePass()).toBeNull();

    saveOfflinePass("5202", {
      name: "Another Student",
      department: "Physics",
      hall: "Mir Mosharraf Hossain Hall",
      status: "verified",
      tshirt_size: "M",
    });
    expect(loadOfflinePass()).not.toBeNull();

    clearOfflinePass();
    expect(loadOfflinePass()).toBeNull();
  });
});
