// Mock registration data for admin panel
export interface Registration {
  id: string;
  name: string;
  roll: string;
  phone: string;
  department: string;
  hall: string;
  tshirtSize: string;
  paymentMethod: "bkash" | "nagad";
  txId: string;
  senderNumber: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  attended: boolean;
}

export const MOCK_REGISTRATIONS: Registration[] = [
  { id: "1", name: "রাকিব হাসান", roll: "1234", phone: "01711111111", department: "কম্পিউটার সায়েন্স ও ইঞ্জিনিয়ারিং", hall: "আল-বেরুনী হল", tshirtSize: "L", paymentMethod: "bkash", txId: "9A3F2K1L0P", senderNumber: "01711111111", status: "verified", createdAt: "2025-03-10", attended: false },
  { id: "2", name: "নুসরাত জাহান", roll: "5678", phone: "01822222222", department: "ফার্মেসি", hall: "প্রীতিলতা হল", tshirtSize: "M", paymentMethod: "nagad", txId: "BK12345678", senderNumber: "01822222222", status: "pending", createdAt: "2025-03-11", attended: false },
  { id: "3", name: "তানভীর আহমেদ", roll: "2345", phone: "01933333333", department: "অর্থনীতি", hall: "মীর মশাররফ হোসেন হল", tshirtSize: "XL", paymentMethod: "bkash", txId: "TX98765432", senderNumber: "01933333333", status: "pending", createdAt: "2025-03-12", attended: false },
  { id: "4", name: "ফাতেমা আক্তার", roll: "3456", phone: "01644444444", department: "ইংরেজি", hall: "জাহানারা ইমাম হল", tshirtSize: "S", paymentMethod: "nagad", txId: "NG55667788", senderNumber: "01644444444", status: "verified", createdAt: "2025-03-12", attended: true },
  { id: "5", name: "মোস্তাফিজুর রহমান", roll: "4567", phone: "01555555555", department: "গণিত", hall: "শহীদ সালাম-বরকত হল", tshirtSize: "L", paymentMethod: "bkash", txId: "BK99887766", senderNumber: "01555555555", status: "rejected", createdAt: "2025-03-13", attended: false },
  { id: "6", name: "সুমাইয়া রহমান", roll: "6789", phone: "01766666666", department: "বাংলা", hall: "ফজিলাতুন্নেছা মুজিব হল", tshirtSize: "M", paymentMethod: "bkash", txId: "BK11223344", senderNumber: "01766666666", status: "pending", createdAt: "2025-03-14", attended: false },
  { id: "7", name: "আরিফুল ইসলাম", roll: "7890", phone: "01877777777", department: "পদার্থবিদ্যা", hall: "বঙ্গবন্ধু শেখ মুজিবুর রহমান হল", tshirtSize: "XXL", paymentMethod: "nagad", txId: "NG44556677", senderNumber: "01877777777", status: "verified", createdAt: "2025-03-14", attended: false },
  { id: "8", name: "তাসনিম ফেরদৌস", roll: "8901", phone: "01988888888", department: "রসায়ন", hall: "নওয়াব ফয়জুন্নেসা চৌধুরানী হল", tshirtSize: "M", paymentMethod: "bkash", txId: "BK55443322", senderNumber: "01988888888", status: "pending", createdAt: "2025-03-15", attended: false },
];
