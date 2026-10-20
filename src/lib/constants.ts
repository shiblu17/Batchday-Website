export const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export const PAYMENT_NUMBERS = {
  bkash: "01XXXXXXXXX",
  nagad: "01XXXXXXXXX",
} as const;

export const ADMIN_EMAILS = [
  "atiquzzaman116592@gmail.com",
] as const;

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email.toLowerCase().trim());
};

export const JU_52_DEPARTMENTS = [
  "Accounting and Information Systems",
  "Anthropology",
  "Archaeology",
  "Bangla",
  "Biochemistry and Molecular Biology",
  "Biotechnology and Genetic Engineering",
  "Botany",
  "Chemistry",
  "Computer Science and Engineering",
  "Drama and Dramatics",
  "Economics",
  "English",
  "Environmental Sciences",
  "Finance and Banking",
  "Fine Art",
  "Geography and Environment",
  "Geological Sciences",
  "Government and Politics",
  "History",
  "Institute of Business Administration (IBA-JU)",
  "Institute of Comparative Literature and Culture (ICLC)",
  "Institute of Information Technology (IIT)",
  "International Relations",
  "Journalism and Media Studies",
  "Law and Justice",
  "Management Studies",
  "Marketing",
  "Mathematics",
  "Microbiology",
  "Pharmacy",
  "Philosophy",
  "Physics",
  "Public Administration",
  "Public Health and Informatics",
  "Statistics and Data Science",
  "Urban and Regional Planning",
  "Zoology",
] as const;

export const JU_52_HALLS = [
  "A F M Kamaluddin Hall",
  "Al Beruni Hall",
  "Begum Khaleda Zia Hall",
  "Begum Sufia Kamal Hall",
  "Bir Protik Taramon Bibi Hall",
  "Bishwakabi Rabindranath Tagore Hall",
  "Fazilatunnesa Hall",
  "Jahanara Imam Hall",
  "Jatiya Kabi Kazi Nazrul Islam Hall",
  "JULY-24 JAGORONI HALL",
  "Mir Mosharraf Hossain Hall",
  "Mowlana Bhashani Hall",
  "Nawab Faizunnesa Hall",
  "NAWAB SALIMULLAH HALL",
  "Pritilata Hall",
  "SHAHEED FELANI KHATUN HALL",
  "Shaheed Rafiq-Jabbar Hall",
  "Shaheed Salam-Barkat Hall",
  "SHER-E-BANGLA A. K. FAZLUL HUQ HALL",
] as const;


