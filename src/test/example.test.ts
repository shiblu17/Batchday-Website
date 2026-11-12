import { describe, it, expect } from "vitest";
import { getCanonicalHall, getCanonicalDepartment } from "@/utils/academicDataNormalizer";
import { isSuperAdminEmail, JU_52_HALLS, JU_52_DEPARTMENTS } from "@/lib/constants";

describe("Academic data normalizer", () => {
  it("normalizes Bangla and variant hall names to canonical hall names", () => {
    expect(getCanonicalHall("রফিক-জব্বার হল")).toBe("Shaheed Rafiq-Jabbar Hall");
    expect(getCanonicalHall("কামালউদ্দিন হল")).toBe("A F M Kamaluddin Hall");
    expect(getCanonicalHall("ফজিলাতুন্নেসা হল")).toBe("Fazilatunnesa Hall");
    expect(getCanonicalHall("JULY-24 JAGORONI HALL")).toBe("JULY-24 JAGORONI HALL");
    expect(getCanonicalHall("")).toBe("");
  });

  it("normalizes Bangla, English, and acronym department names", () => {
    expect(getCanonicalDepartment("CSE")).toBe("Computer Science and Engineering");
    expect(getCanonicalDepartment("কম্পিউটার সায়েন্স")).toBe("Computer Science and Engineering");
    expect(getCanonicalDepartment("IIT")).toBe("Institute of Information Technology (IIT)");
    expect(getCanonicalDepartment("IBA-JU")).toBe("Institute of Business Administration (IBA-JU)");
    expect(getCanonicalDepartment("অর্থনীতি")).toBe("Economics");
    expect(getCanonicalDepartment(null)).toBe("");
  });

  it("keeps non-empty canonical hall and department lists", () => {
    expect(JU_52_HALLS.length).toBeGreaterThanOrEqual(15);
    expect(JU_52_DEPARTMENTS.length).toBeGreaterThanOrEqual(30);
  });
});

describe("Admin email helper", () => {
  it("matches super admin email case-insensitively with whitespace trimmed", () => {
    expect(isSuperAdminEmail("  ATIQUZZAMAN116592@gmail.com  ")).toBe(true);
    expect(isSuperAdminEmail("someone@example.com")).toBe(false);
    expect(isSuperAdminEmail(undefined)).toBe(false);
  });
});
