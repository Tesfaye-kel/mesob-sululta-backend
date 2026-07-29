export interface FAQ {
  id: string
  category: string
  questionEn: string
  questionAm: string
  questionOr: string
  answerEn: string
  answerAm: string
  answerOr: string
  popular: boolean
}

export const faqs: FAQ[] = [
  {
    id: 'faq-001',
    category: 'General',
    questionEn: 'What is MESOB Center?',
    questionAm: 'MESOB ማዕከል ምንድን ነው?',
    questionOr: 'Giddaan MESOB maali?',
    answerEn: 'MESOB (ሜሶብ) is Ethiopia\'s modern One-Stop Shop government service center that allows citizens to access multiple federal government services in one convenient location, eliminating the need to visit different offices.',
    answerAm: 'MESOB (ሜሶብ) የኢትዮጵያ ዘመናዊ የአንድ ቦታ አቅርቦት የመንግሥት አገልግሎት ማዕከል ሲሆን ዜጎች ብዙ የፌዴራል አገልግሎቶችን በአንድ ቦታ እንዲያገኙ ያስችላቸዋል።',
    answerOr: 'MESOB (ሜሶብ) giddu-gala tajaajila mootummaa bakka tokkotti argachuu kan aanjamu Itoophiyaa ti. Lammiileen tajaajila federaalaa hedduu bakka tokko argachuu danda\'u.',
    popular: true,
  },
  {
    id: 'faq-002',
    category: 'General',
    questionEn: 'What documents do I need to bring when visiting?',
    questionAm: 'ስጎብኝ ምን ሰነዶች ማምጣት አለብኝ?',
    questionOr: 'Daaw\'achuuf galmeelee maa fida?',
    answerEn: 'You should always bring your National ID card or Kebele ID as primary identification. Additional documents vary by service type. Check the specific service page for requirements.',
    answerAm: 'ሁልጊዜ ብሔራዊ መታወቂያ ካርድ ወይም ቀበሌ መታወቂያ ማምጣት አለብዎት። ሌሎች ሰነዶች እንደ አገልግሎት ዓይነት ይለያያሉ።',
    answerOr: 'Yeroo hunda kaardii ID Biyyoolessa ykn ID Qaballee fida. Galmeelee biroo gosa tajaajila irratti hundaa\'u.',
    popular: true,
  },
  {
    id: 'faq-003',
    category: 'Services',
    questionEn: 'How long does it take to get a National ID card?',
    questionAm: 'ብሔራዊ መታወቂያ ካርድ ለማግኘት ምን ያህል ጊዜ ይወስዳል?',
    questionOr: 'Kaardii ID Biyyoolessa argachuuf yeroon meeqa fudhata?',
    answerEn: 'Processing time for National ID cards is typically 3–5 working days. You will receive an SMS notification when your card is ready for collection.',
    answerAm: 'የብሔራዊ መታወቂያ ካርዱ ሂደት ሰዓት ብዙውን ጊዜ 3–5 የሥራ ቀናት ነው።',
    answerOr: 'Yeroo ibsaa kaardii ID Biyyoolessa yeroo hojii 3–5 dha. Ergaa SMS yeroo kaardiin kee qophaa\'u ni argatta.',
    popular: true,
  },
  {
    id: 'faq-004',
    category: 'Services',
    questionEn: 'Can I pay government fees online?',
    questionAm: 'የመንግሥት ክፍያዎችን ኦንላይን ልከፍል እችላለሁ?',
    questionOr: 'Kaffaltii mootummaa onlaayiniidhaan kaffaluu danda\'aa?',
    answerEn: 'Yes! MESOB supports digital payments through CBE Birr, TeleBirr, and the MESOB mobile application. You can pay from anywhere at any time.',
    answerAm: 'አዎ! MESOB ዲጂታዊ ክፍያዎችን ከ CBE ቢር፣ ቴሌቢር እና MESOB ሞባይል አፕሊኬሽን ይደግፋል።',
    answerOr: 'Eeyyee! MESOB kaffaltii dijitaalaa CBE Birr, TeleBirr fi app MESOB tiin ni deeggarsa.',
    popular: true,
  },
  {
    id: 'faq-005',
    category: 'Services',
    questionEn: 'How do I renew my passport?',
    questionAm: 'ፓስፖርቴን እንዴት አድሳለሁ?',
    questionOr: 'Paasipoorti koo akkamitti haaromsa?',
    answerEn: 'Visit the Passport Department with your current passport, National ID, 2 passport-size photos, and completed application form. Service takes 10–15 working days.',
    answerAm: 'ፓስፖርት ክፍሉ ይሂዱ ከፓስፖርትዎ፣ ብሔራዊ መታወቂያ፣ 2 ፎቶ እና ሞሉ ቅጽ ጋር። 10–15 የሥራ ቀናት ይወስዳል።',
    answerOr: 'Kutaa Paasipoortiitti paasipoorti kee, ID Biyyoolessa, suuraa 2 fi foomii guutameen dhufi. Guyyaa hojii 10–15 fudhata.',
    popular: false,
  },
  {
    id: 'faq-006',
    category: 'Hours',
    questionEn: 'What are your working hours?',
    questionAm: 'የሥራ ሰዓቶችዎ ምን ያህል ናቸው?',
    questionOr: 'Sa\'aatiin hojii keessan meeqa?',
    answerEn: 'We are open Monday to Friday from 8:30 AM to 5:30 PM, and Saturday from 8:30 AM to 12:00 PM. We are closed on Sundays and Ethiopian public holidays.',
    answerAm: 'ሰኞ እስከ አርብ ከ8:30 – 17:30 ፣ ቅዳሜ ከ8:30 – 12:00 ክፍት ነን። እሁድ እና የኢትዮጵያ ዕረፍት ቀናት ዝጉዋል።',
    answerOr: 'Wiixata hanga Jimaata 8:30 – 17:30, Sanbata 8:30 – 12:00 ni banama. Dilbata fi guyyaa boqonnaa cufama.',
    popular: true,
  },
  {
    id: 'faq-007',
    category: 'Location',
    questionEn: 'Where is MESOB Sululta Branch located?',
    questionAm: 'MESOB ሱሉልታ ቅርንጫፍ የት ይገኛል?',
    questionOr: 'Dameen MESOB Sululta eessa argama?',
    answerEn: 'MESOB Sululta Branch is located on the main road of Sululta Town, Oromia Region, approximately 30km north of Addis Ababa. Near Sululta Town Administration building.',
    answerAm: 'MESOB ሱሉልታ ቅርንጫፍ ከሱሉልታ ከተማ ዋና መንገድ ላይ ይገኛል፣ ከአዲስ አበባ ወደ ሰሜን 30 ኪሜ ያህል።',
    answerOr: 'Dameen MESOB Sululta daandii guddaa Magaalaa Sululta, Oromiyaa, km 30 gara kaabaa Finfinnee irraa argama.',
    popular: false,
  },
  {
    id: 'faq-008',
    category: 'General',
    questionEn: 'How do I file a complaint about a service?',
    questionAm: 'ስለ አገልግሎት ቅሬታ እንዴት አስገባለሁ?',
    questionOr: 'Komii tajaajila irratti akkamitti galcha?',
    answerEn: 'You can file a complaint through our online Feedback Center, in person at the Customer Support desk, by phone at +251 11 111 0000, or via email at feedback@mesob-sululta.gov.et.',
    answerAm: 'ቅሬታ በኦንላይን ፊድባክ ማዕከልዎ፣ በደንበኛ ድጋፍ ዴስክ ፊት ለፊት፣ ስልክ +251 11 111 0000 ወይም ኢሜይል feedback@mesob-sululta.gov.et ሊያቀርቡ ይችላሉ።',
    answerOr: 'Komii onlaayinii Giddaa Yaadaatiin, fuula-duratti meja deeggarsa maamiltootaa, bilbila +251 11 111 0000 ykn imeelii feedback@mesob-sululta.gov.et tiin galchi.',
    popular: false,
  },
  {
    id: 'faq-009',
    category: 'Services',
    questionEn: 'Can I book an appointment in advance?',
    questionAm: 'ቀጠሮ አስቀድሜ ልይዝ እችላለሁ?',
    questionOr: 'Beellama duraan qabachuu danda\'aa?',
    answerEn: 'Yes, you can book appointments online through the MESOB portal or mobile app. This helps reduce waiting time significantly.',
    answerAm: 'አዎ፣ ቀጠሮ MESOB ፖርታሉ ወይም ሞባይል አፕ ላይ ኦንላይን ሊይዙ ይችላሉ። ይህ የመጠበቅ ጊዜን ቀንሳለሁ።',
    answerOr: 'Eeyyee, beellama onlaayinii pooortaala MESOB ykn app mobiilii tiin qabachuu ni danda\'ama.',
    popular: false,
  },
  {
    id: 'faq-010',
    category: 'Digital',
    questionEn: 'Is there a MESOB mobile app?',
    questionAm: 'MESOB ሞባይል አፕሊኬሽን አለ?',
    questionOr: 'App mobiilii MESOB ni jira?',
    answerEn: 'Yes! The MESOB mobile application is available for both Android and iOS devices. Download it from Google Play Store or Apple App Store to access services, book appointments, and pay fees.',
    answerAm: 'አዎ! MESOB ሞባይል አፕሊኬሽን ለ Android እና iOS ይገኛል። Google Play ወይም Apple App Store ላይ ያውርዱ።',
    answerOr: 'Eeyyee! App mobiilii MESOB Android fi iOS lamaaniifuu ni argama. Google Play ykn Apple App Store irraa buufadhu.',
    popular: true,
  },
]

export const faqCategories = ['All', 'General', 'Services', 'Hours', 'Location', 'Digital']
