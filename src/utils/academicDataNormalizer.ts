import { JU_52_DEPARTMENTS, JU_52_HALLS } from "@/lib/constants";

/**
 * Normalizes any hall name (Bangla, English, with or without extra spaces)
 * to the official canonical hall name in the halls table.
 */
export function getCanonicalHall(rawHall: string | null | undefined): string {
  if (!rawHall) return "";
  const cleaned = rawHall.trim();

  // 1. Direct exact match
  if ((JU_52_HALLS as readonly string[]).includes(cleaned)) {
    return cleaned;
  }

  const lower = cleaned.toLowerCase();

  // 2. Bilingual and partial matching
  if (lower.includes("kamaluddin") || cleaned.includes("কামালউদ্দিন")) {
    return "A F M Kamaluddin Hall";
  }
  if (lower.includes("beruni") || cleaned.includes("আল বেরুনী") || cleaned.includes("আল-বেরুনী")) {
    return "Al Beruni Hall";
  }
  if (lower.includes("khaleda") || cleaned.includes("খালেদা")) {
    return "Begum Khaleda Zia Hall";
  }
  if (lower.includes("sufia") || cleaned.includes("সুফিয়া")) {
    return "Begum Sufia Kamal Hall";
  }
  if (lower.includes("taramon") || cleaned.includes("তারামন")) {
    return "Bir Protik Taramon Bibi Hall";
  }
  if (lower.includes("tagore") || lower.includes("rabindranath") || cleaned.includes("রবীন্দ্রনাথ")) {
    return "Bishwakabi Rabindranath Tagore Hall";
  }
  if (lower.includes("fazilatunnesa") || cleaned.includes("ফজিলাতুন্নেছা") || cleaned.includes("ফজিলাতুন্নেসা")) {
    return "Fazilatunnesa Hall";
  }
  if (lower.includes("jahanara") || cleaned.includes("জাহানারা")) {
    return "Jahanara Imam Hall";
  }
  if (lower.includes("nazrul") || cleaned.includes("নজরুল")) {
    return "Jatiya Kabi Kazi Nazrul Islam Hall";
  }
  if (lower.includes("july-24") || lower.includes("jagoroni") || cleaned.includes("জাগরণী") || cleaned.includes("বঙ্গবন্ধু")) {
    return "JULY-24 JAGORONI HALL";
  }
  if (lower.includes("mosharraf") || cleaned.includes("মশাররফ")) {
    return "Mir Mosharraf Hossain Hall";
  }
  if (lower.includes("bhashani") || cleaned.includes("ভাসানী") || cleaned.includes("ভাসানি")) {
    return "Mowlana Bhashani Hall";
  }
  if (lower.includes("faizunnesa") || cleaned.includes("ফয়জুন্নেসা") || cleaned.includes("ফয়জুন্নেসা")) {
    return "Nawab Faizunnesa Hall";
  }
  if (lower.includes("salimullah") || cleaned.includes("সলিমুল্লাহ")) {
    return "NAWAB SALIMULLAH HALL";
  }
  if (lower.includes("pritilata") || cleaned.includes("প্রীতিলতা")) {
    return "Pritilata Hall";
  }
  if (lower.includes("felani") || cleaned.includes("ফেলানী") || cleaned.includes("ফেলানি")) {
    return "SHAHEED FELANI KHATUN HALL";
  }
  if (lower.includes("rafiq") || cleaned.includes("রফিক")) {
    return "Shaheed Rafiq-Jabbar Hall";
  }
  if (lower.includes("salam") || cleaned.includes("সালাম")) {
    return "Shaheed Salam-Barkat Hall";
  }
  if (lower.includes("sher-e-bangla") || lower.includes("fazlul") || cleaned.includes("শের-ই-বাংলা") || cleaned.includes("ফজলুল")) {
    return "SHER-E-BANGLA A. K. FAZLUL HUQ HALL";
  }

  // Fallback to closest match in JU_52_HALLS if any
  const matched = JU_52_HALLS.find(h => h.toLowerCase() === lower);
  return matched || cleaned;
}

/**
 * Normalizes any department name (Bangla, English, aliases)
 * to the official canonical department name in the departments table.
 */
export function getCanonicalDepartment(rawDept: string | null | undefined): string {
  if (!rawDept) return "";
  const cleaned = rawDept.trim();

  // 1. Direct exact match
  if ((JU_52_DEPARTMENTS as readonly string[]).includes(cleaned)) {
    return cleaned;
  }

  const lower = cleaned.toLowerCase();

  if (lower.includes("computer") || lower.includes("cse") || cleaned.includes("কম্পিউটার")) {
    return "Computer Science and Engineering";
  }
  if (lower.includes("anthropology") || cleaned.includes("নৃবিজ্ঞান")) {
    return "Anthropology";
  }
  if (lower.includes("archaeology") || cleaned.includes("প্রত্নতত্ত্ব")) {
    return "Archaeology";
  }
  if (lower === "bangla" || cleaned === "বাংলা") {
    return "Bangla";
  }
  if (lower.includes("biochemistry") || cleaned.includes("প্রাণরসায়ন")) {
    return "Biochemistry and Molecular Biology";
  }
  if (lower.includes("biotechnology") || cleaned.includes("বায়োটেকনোলজি") || cleaned.includes("বায়োটেক")) {
    return "Biotechnology and Genetic Engineering";
  }
  if (lower.includes("botany") || cleaned.includes("উদ্ভিদবিজ্ঞান")) {
    return "Botany";
  }
  if (lower.includes("chemistry") || cleaned.includes("রসায়ন")) {
    return "Chemistry";
  }
  if (lower.includes("drama") || cleaned.includes("নাটক")) {
    return "Drama and Dramatics";
  }
  if (lower.includes("economics") || cleaned.includes("অর্থনীতি")) {
    return "Economics";
  }
  if (lower.includes("english") || cleaned.includes("ইংরেজি")) {
    return "English";
  }
  if (lower.includes("environmental") || cleaned.includes("পরিবেশ বিজ্ঞান")) {
    return "Environmental Sciences";
  }
  if (lower.includes("finance") || cleaned.includes("ফিন্যান্স")) {
    return "Finance and Banking";
  }
  if (lower.includes("fine art") || cleaned.includes("চারুকলা")) {
    return "Fine Art";
  }
  if (lower.includes("geography") || cleaned.includes("ভূগোল")) {
    return "Geography and Environment";
  }
  if (lower.includes("geological") || cleaned.includes("ভূতাত্ত্বিক")) {
    return "Geological Sciences";
  }
  if (lower.includes("government") || lower.includes("politics") || cleaned.includes("সরকার ও রাজনীতি")) {
    return "Government and Politics";
  }
  if (lower.includes("history") || cleaned.includes("ইতিহাস")) {
    return "History";
  }
  if (lower.includes("iba") || cleaned.includes("আইবিএ")) {
    return "Institute of Business Administration (IBA-JU)";
  }
  if (lower.includes("iclc") || cleaned.includes("আইসিএলসি") || cleaned.includes("তুলনামূলক সাহিত্য")) {
    return "Institute of Comparative Literature and Culture (ICLC)";
  }
  if (lower.includes("iit") || cleaned.includes("আইআইটি") || cleaned.includes("তথ্য প্রযুক্তি ইনস্টিটিউট")) {
    return "Institute of Information Technology (IIT)";
  }
  if (lower.includes("international relations") || lower.includes("ir") || cleaned.includes("আন্তর্জাতিক সম্পর্ক")) {
    return "International Relations";
  }
  if (lower.includes("journalism") || lower.includes("media") || cleaned.includes("সাংবাদিকতা")) {
    return "Journalism and Media Studies";
  }
  if (lower.includes("law") || cleaned.includes("আইন")) {
    return "Law and Justice";
  }
  if (lower.includes("management") || cleaned.includes("ম্যানেজমেন্ট")) {
    return "Management Studies";
  }
  if (lower.includes("marketing") || cleaned.includes("মার্কেটিং")) {
    return "Marketing";
  }
  if (lower.includes("mathematics") || cleaned.includes("গণিত")) {
    return "Mathematics";
  }
  if (lower.includes("microbiology") || cleaned.includes("অণুজীববিজ্ঞান") || cleaned.includes("মাইক্রোবায়োলজি")) {
    return "Microbiology";
  }
  if (lower.includes("pharmacy") || cleaned.includes("ফার্মেসী") || cleaned.includes("ফার্মেসি")) {
    return "Pharmacy";
  }
  if (lower.includes("philosophy") || cleaned.includes("দর্শন")) {
    return "Philosophy";
  }
  if (lower.includes("physics") || cleaned.includes("পদার্থবিজ্ঞান")) {
    return "Physics";
  }
  if (lower.includes("public administration") || cleaned.includes("লোক প্রশাসন") || cleaned.includes("লোকপ্রশাসন")) {
    return "Public Administration";
  }
  if (lower.includes("public health") || cleaned.includes("পাবলিক হেলথ")) {
    return "Public Health and Informatics";
  }
  if (lower.includes("statistics") || lower.includes("data science") || cleaned.includes("পরিসংখ্যান")) {
    return "Statistics and Data Science";
  }
  if (lower.includes("urban") || lower.includes("urp") || cleaned.includes("নগর ও অঞ্চল")) {
    return "Urban and Regional Planning";
  }
  if (lower.includes("zoology") || cleaned.includes("প্রাণিবিদ্যা")) {
    return "Zoology";
  }
  if (lower.includes("accounting") || lower.includes("ais") || cleaned.includes("হিসাববিজ্ঞান")) {
    return "Accounting and Information Systems";
  }

  const matched = JU_52_DEPARTMENTS.find(d => d.toLowerCase() === lower);
  return matched || cleaned;
}
