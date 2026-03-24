export const DEPARTMENTS = [
  "পদার্থবিদ্যা", "গণিত", "রসায়ন", "পরিসংখ্যান", "ভূতাত্ত্বিক বিজ্ঞান",
  "ভূগোল ও পরিবেশ", "কম্পিউটার সায়েন্স ও ইঞ্জিনিয়ারিং", "ইনফরমেশন টেকনোলজি",
  "ফার্মেসি", "জীববিজ্ঞান", "জৈবরসায়ন ও আণবিক জীববিজ্ঞান", "মাইক্রোবায়োলজি",
  "বায়োটেকনোলজি ও জেনেটিক ইঞ্জিনিয়ারিং", "পরিবেশ বিজ্ঞান",
  "বাংলা", "ইংরেজি", "ইতিহাস", "দর্শন", "নাটক ও নাট্যতত্ত্ব",
  "চারুকলা", "আর্কিওলজি", "জার্নালিজম ও মিডিয়া স্টাডিজ",
  "অর্থনীতি", "লোক প্রশাসন", "নৃবিজ্ঞান", "সরকার ও রাজনীতি",
  "আইন ও বিচার", "নগর ও অঞ্চল পরিকল্পনা", "শিক্ষা ও গবেষণা",
  "বঙ্গবন্ধু তুলনামূলক সাহিত্য ও সংস্কৃতি", "আল-কুরআন অ্যান্ড ইসলামিক স্টাডিজ"
] as const;

export const HALLS = [
  "আল-বেরুনী হল",
  "মীর মশাররফ হোসেন হল",
  "শহীদ সালাম-বরকত হল",
  "বঙ্গবন্ধু শেখ মুজিবুর রহমান হল",
  "মওলানা ভাসানী হল",
  "শহীদ রফিক-জব্বার হল",
  "প্রীতিলতা হল",
  "জাহানারা ইমাম হল",
  "ফজিলাতুন্নেছা মুজিব হল",
  "বেগম খালেদা জিয়া হল",
  "নওয়াব ফয়জুন্নেসা চৌধুরানী হল",
] as const;

export const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export const PAYMENT_NUMBERS = {
  bkash: "01XXXXXXXXX",
  nagad: "01XXXXXXXXX",
} as const;

// Mock leaderboard data (Default Fallbacks)
const DEFAULT_DEPT = [
  { name: "কম্পিউটার সায়েন্স ও ইঞ্জিনিয়ারিং", total: 120, registered: 98 },
  { name: "ফার্মেসি", total: 80, registered: 61 },
  { name: "অর্থনীতি", total: 100, registered: 72 },
  { name: "ইংরেজি", total: 90, registered: 58 },
  { name: "গণিত", total: 110, registered: 63 },
  { name: "বাংলা", total: 95, registered: 50 },
  { name: "রসায়ন", total: 85, registered: 42 },
  { name: "পদার্থবিদ্যা", total: 75, registered: 35 },
];

const DEFAULT_HALL = [
  { name: "আল-বেরুনী হল", total: 300, registered: 245 },
  { name: "মীর মশাররফ হোসেন হল", total: 280, registered: 210 },
  { name: "প্রীতিলতা হল", total: 250, registered: 182 },
  { name: "বঙ্গবন্ধু শেখ মুজিবুর রহমান হল", total: 320, registered: 220 },
  { name: "শহীদ সালাম-বরকত হল", total: 260, registered: 165 },
];

export const getLeaderboardData = (type: 'dept' | 'hall') => {
  try {
    const local = localStorage.getItem(`ju52_leaderboard_${type}`);
    if (local) {
      const parsed = JSON.parse(local);
      return parsed.sort((a: any, b: any) => (b.registered / b.total) - (a.registered / a.total));
    }
  } catch (e) {
    console.error("Failed to parse leaderboard from storage", e);
  }
  const defaultData = type === 'dept' ? DEFAULT_DEPT : DEFAULT_HALL;
  return [...defaultData].sort((a, b) => (b.registered / b.total) - (a.registered / a.total));
};

export const setLeaderboardData = (type: 'dept' | 'hall', data: any[]) => {
  localStorage.setItem(`ju52_leaderboard_${type}`, JSON.stringify(data));
};
