export interface Announcement {
  id: string
  category: 'notice' | 'event' | 'news' | 'holiday' | 'press'
  titleEn: string
  titleAm: string
  titleOr: string
  summaryEn: string
  summaryAm: string
  summaryOr: string
  contentEn: string
  date: string
  featured: boolean
  imageUrl?: string
}

export const announcements: Announcement[] = [
  {
    id: 'ann-001',
    category: 'news',
    titleEn: 'MESOB Sululta Branch Celebrates 2nd Anniversary',
    titleAm: 'MESOB ሱሉልታ ቅርንጫፍ 2ኛ ዓመት ምስረታ አከበረ',
    titleOr: 'Dameen MESOB Sululta Guyyaa Dhalootaa 2ffaa Kabaje',
    summaryEn: 'MESOB Sululta Branch marks its second year of outstanding public service delivery with over 50,000 citizens served.',
    summaryAm: 'MESOB ሱሉልታ ቅርንጫፍ ከ50,000 በላይ ዜጎችን አገልግሏል።',
    summaryOr: 'Dameen MESOB Sululta waggaa 2ffaa tajaajila uummataaf guddaa ta\'e yaadatame.',
    contentEn: 'The MESOB Sululta Branch proudly celebrates its second anniversary, having served over 50,000 citizens with excellence and efficiency. The branch has significantly reduced waiting times and improved service delivery across all departments.',
    date: '2024-12-15',
    featured: true,
  },
  {
    id: 'ann-002',
    category: 'notice',
    titleEn: 'Extended Service Hours During Ethiopian Christmas',
    titleAm: 'በኢትዮጵያ ገናን ምክንያት የተዘረጋ የአገልግሎት ሰዓት',
    titleOr: 'Sa\'aatii Tajaajilaa Diriirfame Yeroo Booraa Itoophiyaa',
    summaryEn: 'Special extended service hours will be available from January 7–10, 2025 for National ID and passport services.',
    summaryAm: 'ከጥር 1–4, 2025 ለብሔራዊ መታወቂያ እና ፓስፖርት አገልግሎቶች ቀጠሮ።',
    summaryOr: 'Sa\'aatii tajaajilaa diriirfame Amajjii 7–10, 2025 tajaajila ID fi Paasipoortiif.',
    contentEn: 'Dear Citizens, we are pleased to announce extended working hours from January 7–10 during the Ethiopian Christmas holiday. National ID and Passport services will operate from 8:00 AM to 7:00 PM.',
    date: '2024-12-28',
    featured: true,
  },
  {
    id: 'ann-003',
    category: 'event',
    titleEn: 'Digital Literacy Workshop for Elderly Citizens',
    titleAm: 'ለሽማግሌ ዜጎች ዲጂታል ትምህርት ወርክሾፕ',
    titleOr: 'Workshopii Barnoota Dijitaalaa Lammiilee Maanguddoodhaaf',
    summaryEn: 'Free digital literacy training to help elderly citizens navigate MESOB online services.',
    summaryAm: 'ሽማግሌ ዜጎች MESOB የኦንላይን አገልግሎቶችን እንዲጠቀሙ ያስችላቸዋል።',
    summaryOr: 'Leenji\'i dijitaalaa bilisaa lammiileen maanguddoon MESOB tajaajila onlaayinii akka fayyadaman.',
    contentEn: 'MESOB Sululta is hosting a free digital literacy workshop for elderly citizens every Saturday morning. Learn how to access government services from home using smartphones and computers.',
    date: '2025-01-10',
    featured: false,
  },
  {
    id: 'ann-004',
    category: 'holiday',
    titleEn: 'Office Closure – Ethiopian Epiphany (Timkat)',
    titleAm: 'ጽሕፈት ቤት መዘጋት – ጥምቀት',
    titleOr: 'Cufamuu Waajjiraa – Timkat',
    summaryEn: 'All MESOB offices will be closed on January 19–20 for Timkat (Ethiopian Epiphany).',
    summaryAm: 'ሁሉም MESOB ጽሕፈት ቤቶች ጥር 11–12 ለጥምቀት ዕረፍት ዝጉዋታል።',
    summaryOr: 'Waajjiraalee MESOB hundi Amajjii 19–20 Timkataaf cufama.',
    contentEn: 'Dear Citizens, please note that all MESOB Center offices will be closed on January 19–20, 2025 for the Ethiopian Epiphany (Timkat) public holiday. Normal operations resume on January 21.',
    date: '2025-01-15',
    featured: false,
  },
  {
    id: 'ann-005',
    category: 'press',
    titleEn: 'MESOB Launches New Digital Payment Integration',
    titleAm: 'MESOB አዲስ ዲጂታል ክፍያ ዝምህርና ጀመረ',
    titleOr: 'MESOB Walitti Hidhinsa Kaffaltii Dijitaalaa Haaraa Jalqabe',
    summaryEn: 'Citizens can now pay for all government services digitally through the MESOB mobile app and CBE Birr.',
    summaryAm: 'ዜጎች አሁን ሁሉንም አገልግሎቶቻቸውን ዲጂታሊ ከ MESOB ሞባይል አፕሊኬሽን ሊከፍሉ ይችላሉ።',
    summaryOr: 'Lammiileefi amma tajaajilaalee mootummaa hunda app MESOB tiin kaffalu danda\'u.',
    contentEn: 'MESOB Center proudly announces the launch of comprehensive digital payment integration. Citizens can now pay for all government services through MESOB Mobile App, CBE Birr, and TeleBirr platforms.',
    date: '2025-01-05',
    featured: true,
  },
  {
    id: 'ann-006',
    category: 'notice',
    titleEn: 'New Document Requirements for Passport Applications',
    titleAm: 'ለፓስፖርት ማመልከቻ አዲስ ሰነዶች ማስፈለጊያ',
    titleOr: 'Gaaffii Paasipoortiif Gaaffii Galmee Haaraa',
    summaryEn: 'Updated documentation requirements for new passport applications effective February 1, 2025.',
    summaryAm: 'ከየካቲት 1, 2025 ጀምሮ ለፓስፖርት ማመልከቻ አዲስ ሰነዶች ያስፈልጋሉ።',
    summaryOr: 'Gaaffii galmee haaraa gaaffii paasipoorti Gurraandhala 1, 2025 irraa jalqabee.',
    contentEn: 'Starting February 1, 2025, all new passport applications must include an updated national ID card issued within the last 5 years. Please ensure your national ID is current before applying.',
    date: '2025-01-20',
    featured: false,
  },
]
