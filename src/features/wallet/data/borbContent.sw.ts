import { KnowledgeEntry } from './borbContent.fr';

export const KNOWLEDGE_SW: KnowledgeEntry[] = [
  {
    id: 'borb_overview',
    keywords: ['borb', 'ni nini', 'borb', 'fedha', 'utangulizi'],
    category: 'borb',
    icon: '💰',
    response: {
      title: 'BORB ni nini?',
      content: 'BORB (BORB) ni sarafu ya kidijitali ya UQ Platform.\n\n• Kiasi maalum: bilioni 40 BORB\n• Inarejelewa dhahabu: bei ifuatapo kiwango cha dhahabu kinachorekodiwa na injini\n• Bei ya sasa haijaandikwa ndani ya programu: inatolewa na kidhibiti-bei na urekodi wa soko, na pouchi huonyesha chanzo chake na umri wake',
      suggestions: ['Vipimo 6', 'Kesi 6'],
    },
  },
  {
    id: 'borb_units',
    keywords: ['vipimo', 'fractal', 'micro', 'nano', 'pico', 'femto'],
    category: 'borb',
    icon: '💱',
    response: {
      title: 'Vipimo 6 vya fractal',
      content: 'BORB → borb → mborb → nborb → pborb → fborb\n\n1 BORB = trilioni 1 ya fborb',
      suggestions: ['Kesi 6'],
    },
  },
  {
    id: 'borb_cases',
    keywords: ['kesi', 'hazina', 'ada', 'zawadi', 'akiba', 'mkopo', 'ngao'],
    category: 'borb',
    icon: '📦',
    response: {
      title: 'Kesi 6 za kiuchumi',
      content: '💰 Hazina 77.8%\n💸 Ada 5.6%\n🏆 Zawadi 5.6%\n❄️ Akiba 5.6%\n💳 Mkopo 3.3%\n🛡️ Ngao 2.2%',
      suggestions: ['Mapovu'],
    },
  },
  // ===== KESI 6 — MAELEZO KAMILI =====
  {
    id: 'cases_overview',
    keywords: ['kesi 6', 'kesi sita', 'kesi', 'kesi za kiuchumi', 'mgawanyo', 'muhtasari'],
    category: 'borb',
    icon: '📦',
    response: {
      title: 'Kesi 6 za Kiuchumi — Muhtasari',
      content: 'BORB bilioni 40 zimegawanywa katika Kesi 6:\n\n💰 Hazina: 77.8% → UBI + uongofu wa mapovu\n💸 Ada: 5.6% → Miundombinu\n🏆 Zawadi: 5.6% → Motisha\n❄️ Akiba: 5.6% → Kufungia + uhaba\n💳 Mkopo: 3.3% → Mikopo\n🛡️ Ngao: 2.2% → Ulinzi\n\n🔄 MZUNGUKO WA MILELE:\nHazina inagawa → watumiaji wanatumia → Ada zinarudi → Hazina inajaa → HAKUNA kinachopotea.\n\nNiulize kuhusu kesi maalum!',
      suggestions: ['Hazina', 'Ada', 'Zawadi', 'Akiba'],
    },
  },
  {
    id: 'case_treasury',
    keywords: ['hazina', 'kesi 1', 'ubi', 'mgawanyo', 'mapato ya msingi'],
    category: 'borb',
    icon: '💰',
    response: {
      title: '💰 Hazina (77.8% — BORB 31,120,000,000)',
      content: 'Hazina ni MOYO wa mfumo.\n\n📋 JUKUMU:\n• Inagawa UBI (pointi 2/siku)\n• Inabadilisha Mapovu kuwa BORB (mapovu 100 = borb 1)\n• Inapokea BORB zilizosindikwa\n• Inasaidia kesi zingine\n\n⚠️ KIWANGO CHA USALAMA: BORB BILIONI 6\nIkiwa Hazina inashuka chini ya 6B:\n→ UBI inasimamishwa\n→ Ada 80% zinaelekezwa Hazina\n→ Mfumo unajirekebisha',
      suggestions: ['Ada', 'Zawadi', 'Jinsi ya kupata BORB'],
    },
  },
  {
    id: 'case_fees',
    keywords: ['ada', 'kesi 2', 'kamishna', 'miundombinu', 'wathibitishaji'],
    category: 'borb',
    icon: '💸',
    response: {
      title: '💸 Ada (5.6% — BORB 2,240,000,000)',
      content: 'Ada zinalisha mfumo.\n\n📋 JUKUMU:\n• Zinakusanya 0.1% ya kila muamala\n• Zinajaza Kesi 6\n• Zinalipa wathibitishaji na relay\n\n📊 VIWANGO:\n• Uhamisho BORB: 0.1%\n• Marketplace: 1%\n• Lector UQ: 10%\n• Starlink: 10%\n• Mikopo: 2%\n\n🔄 MGAWANYO:\n• 30% → Hazina\n• 40% → Wathibitishaji\n• 30% → Relay P2P\n• 0% → HAIchomwi KAMWE',
      suggestions: ['Hazina', 'Mkopo', 'Jinsi ya kupata BORB'],
    },
  },
  {
    id: 'case_rewards',
    keywords: ['zawadi', 'kesi 3', 'motisha', 'rufaa', 'changamoto', 'wabunifu'],
    category: 'borb',
    icon: '🏆',
    response: {
      title: '🏆 Zawadi (5.6% — BORB 2,240,000,000)',
      content: 'Zawadi zinahamasisha shughuli.\n\n📋 AINA:\n\n🤝 RUFAA:\n• BORB 1 kwa kila rufaa hai\n• BORB 0.5 kwa rufaa ya rufaa\n• Mfululizo wa ngazi 3\n\n🏆 CHANGAMOTO ZA JIRANI:\n• "Miamala 100" → BORB 10\n• "Maduka 10 mapya" → BORB 5 kila moja\n\n🎨 WABUNIFU:\n• Wanamuziki: 90% ya Lector UQ\n• Wauzaji: beji na sifa\n\n🫧 MAPOVU:\n• Shughuli ya kila siku → mapovu\n• Mapovu → BORB',
      suggestions: ['Hazina', 'Jinsi ya kupata BORB', 'Alika marafiki'],
    },
  },
  {
    id: 'case_savings',
    keywords: ['akiba', 'kesi 4', 'kufungia', 'uhaba', 'mkataba', 'riba', 'mavuno'],
    category: 'borb',
    icon: '❄️',
    response: {
      title: '❄️ Akiba (5.6% — BORB 2,240,000,000)',
      content: 'Akiba inafungia BORB.\n\n📋 JUKUMU:\n• Inaondoa BORB kwenye mzunguko\n• Inaunda uhaba (bei inapanda)\n• Inawapa zawadi waweka akiba\n• Inalinda utajiri\n\n📊 MIKATABA:\n• Miezi 3: 1%/mwaka\n• Mwaka 1: 2%/mwaka\n• Miaka 3: 3%/mwaka\n• Miaka 5: 4%/mwaka\n• Miaka 10: 5%/mwaka\n• Miaka 50: 6%/mwaka\n\n❄️ KUFUNGIA POLEPOLE (wasio na shughuli):\n• Mwaka 1: ukumbusho\n• Miaka 2: 10% imefungwa\n• Miaka 5: 50% imefungwa\n• Miaka 10: 50% Hazina\n• Miaka 50: 100% Hazina',
      suggestions: ['Mkopo', 'Weka akiba kwa busara', 'Hazina'],
    },
  },
  {
    id: 'case_credit',
    keywords: ['mkopo', 'kesi 5', 'mikopo', 'deni', 'kukopa', 'overdraft'],
    category: 'borb',
    icon: '💳',
    response: {
      title: '💳 Mkopo (3.3% — BORB 1,320,000,000)',
      content: 'Mkopo unakopesha.\n\n📋 AINA ZA MIKOPO:\n\n🔹 MIKOPO NDOGO:\n• BORB 1-50, miezi 1-6, 2-5%\n\n🔹 MKOPO WA BIASHARA:\n• BORB 50-500, miezi 6-24\n\n🔹 MKOPO WA JAMII:\n• Majirani wanahakikisha\n• Kiwango kilichopunguzwa (2%)\n\n⚠️ BORB HASI (DENI):\n• Overdraft ya kawaida: BORB -5\n• Overdraft ya Marketer: BORB -50\n• Utoaji OTOMATIKI kutoka mapato\n• Dhamana (akiba imefungwa)\n• Msamaha kwa Ngao (miaka 50)',
      suggestions: ['Kukopa', 'Ngao', 'Akiba'],
    },
  },
  {
    id: 'case_shield',
    keywords: ['ngao', 'kesi 6', 'ulinzi', 'dharura', 'msaada', 'msamaha', 'ufunguo uliopotea'],
    category: 'borb',
    icon: '🛡️',
    response: {
      title: '🛡️ Ngao (2.2% — BORB 840,000,000)',
      content: 'Ngao inalinda.\n\n📋 AINA:\n\n🔐 UFUNGUO ULIOPOTEA:\n• Uthibitisho wa utambulisho\n• Urejeshaji wa Shamir (3/5)\n• Msaada hadi 50% ya salio\n\n🚨 DHARURA:\n• Ugonjwa mkubwa → msaada wa haraka\n• Maafa → msaada wa pamoja\n\n🤝 MSAADA WA KUPEANA:\n• Tangazo la hitaji\n• Kura ya jamii\n\n💚 MSAMAHA WA DENI:\n• Baada ya miaka 50\n• Ngao INASAMEHE deni\n• Hakuna anayesagwa',
      suggestions: ['Tumia Ngao', 'Mkopo', 'Usalama'],
    },
  },
  {
    id: 'case_cycle',
    keywords: ['mzunguko', 'kitanzi', 'mzunguko wa kesi 6', 'madaraja'],
    category: 'borb',
    icon: '🔄',
    response: {
      title: '🔄 Mzunguko wa milele wa Kesi 6',
      content: 'JINSI KESI 6 ZINAVYOLISHANA:\n\n1. 💰 Hazina inagawa\n2. 👥 Watumiaji wanatumia\n3. 💸 Ada zinarudi (30% Hazina)\n4. ❄️ Akiba inafungia (uhaba)\n5. 💳 Mkopo unakopesha (riba → akiba)\n6. 🛡️ Ngao inalinda (imani)\n7. 🔄 Usindikaji (miaka 10/50 → Hazina)\n\n🔗 MADARAJA:\n• Hazina → Ada: ikiwa Ada < 224M\n• Hazina → Ngao: ikiwa imeisha\n• Akiba → Mkopo: ukwasi\n\n♾️ MZUNGUKO USIO NA MWISHO:\nMgawanyo → Matumizi → Ada → Kurudi → Kufungia → Mkopo → Ulinzi → Usindikaji → ∞\n\n💡 HAKUNA kinachoharibiwa KAMWE.',
      suggestions: ['Hazina', 'Usindikaji', 'Jinsi ya kupata BORB'],
    },
  },
  // ===== FAQ — AKAUNTI =====
  {
    id: 'faq_create_account',
    keywords: ['kufungua akaunti', 'kujisajili', 'akaunti mpya'],
    category: 'faq',
    icon: '👤',
    response: {
      title: 'Jinsi ya kufungua akaunti UQ',
      content: '1. Fungua programu\n2. Jaza fomu\n3. Thibitisha simu yako kwa SMS\n4. Pokea jina lako la UQ, namba ya UQ na barua pepe ya UQ\n\n🎁 Karibu kwenye familia ya UQ!',
      suggestions: ['Ingia', 'Umesahau neno la siri'],
    },
  },
  {
    id: 'faq_forgot_password',
    keywords: ['umesahau neno la siri', 'kurejesha neno la siri'],
    category: 'faq',
    icon: '🔑',
    response: {
      title: 'Nimesahau neno la siri',
      content: 'Tumia urejeshaji wa Shamir 3/5:\n\n→ Vipande 3 kati ya 5 vinatosha\n→ Wasiliana na walinzi wako\n→ Au tumia biometria',
      suggestions: ['Shamir 3/5', 'Biometria'],
    },
  },
  {
    id: 'faq_fees',
    keywords: ['ada', 'kamishna', 'kiasi gani'],
    category: 'faq',
    icon: '💸',
    response: {
      title: 'Ada ni zipi?',
      content: '0.1% kwa kila muamala.\n\n📊 MFANO:\n• BORB 5 → BORB 0.005\n• BORB 100 → BORB 0.1',
      suggestions: ['Ada', 'Miamala'],
    },
  },
  {
    id: 'faq_borb_value',
    keywords: ['thamani borb', 'bei borb', 'ngapi'],
    category: 'faq',
    icon: '💰',
    response: {
      title: 'BORB 1 ni ngapi?',
      content: '1 BORB lina thamani ya bei ambayo injini inatoa wakati unauliza — si thamani iliyowekwa ndani ya programu.\n\n📈 BEI INATOKA WAPI:\n• Kidhibiti-bei, kutoka hitaji halisi kwenye kiasi kinachozunguka\n• Urekebishaji wa moja kwa moja wa kiwango cha dhahabu kutoka vyanzo vinavyouliziwa\n\n📊 USOME BEI WAPI:\n• Pouchi huonyesha bei ya sasa, chanzo chake na umri wake\n• bila mtandao, thamani ya mwisho iliyorekodiwa inaendelea kutumika na programu inatangaza hivyo',
      suggestions: ['Jinsi ya kupata', 'Mwelekeo'],
    },
  },
  {
    id: 'faq_earn_borb',
    keywords: ['kupata borb', 'kupata pesa', 'jinsi ya kupata'],
    category: 'faq',
    icon: '🌾',
    response: {
      title: 'Jinsi ya kupata BORB',
      content: '🌾 UBI ya kila siku\n🏪 Uza bidhaa\n🔧 Toa huduma\n🎵 Unda maudhui\n📡 Uza muunganisho\n🚗 Kuwa mtoaji\n🤝 Alika marafiki\n💱 Uuzaji\n💳 Kuwa Marketer\n💤 Weka akiba',
      suggestions: ['Njia 12', 'Kuwa tajiri'],
    },
  },
  // ===== KUINGIA =====
  {
    id: 'login_flow',
    keywords: ['kuingia', 'ingia', 'kuingia akaunti'],
    category: 'guide',
    icon: '🔐',
    response: {
      title: 'Jinsi ya kuingia UQ',
      content: 'Hatua 7:\n\n1. 📛 Namba ya UQ (UQ-XXXXXXXX)\n2. 🔑 Ikiwa mmiliki → namba 4 ya kufungua\n3. 📧 Barua pepe ya UQ + Neno la siri\n4. 🔢 Namba 2FA otomatiki\n5. 🫆 Biometria\n6. ✅ Umefanikiwa\n7. 🤖 UQ AI anakusalimu\n\n💡 Hakuna jina la mtumiaji, hakuna CAPTCHA.',
      suggestions: ['Namba UQ', '2FA', 'Biometria'],
    },
  },
  {
    id: 'login_number',
    keywords: ['namba uq', 'namba yangu'],
    category: 'guide',
    icon: '📛',
    response: {
      title: 'Namba yako ya UQ',
      content: 'Muundo: UQ-XXXXXXXX\nMfano: UQ-00000001\n\n💡 Kitambulisho chako KIMOJA.',
      suggestions: ['Ingia', 'Fungua akaunti'],
    },
  },
  {
    id: 'login_2fa',
    keywords: ['2fa', 'barua pepe', 'neno la siri'],
    category: 'guide',
    icon: '📧',
    response: {
      title: 'Uthibitisho wa 2FA',
      content: '📧 BARUA PEPE YA UQ\n🔑 NENO LA SIRI (8+)\n\n⚠️ Ikiwa kosa:\n• Mpaka MWEKUNDU\n• Droo inatetemeka',
      suggestions: ['Umesahau neno la siri', 'Namba 2FA'],
    },
  },
  {
    id: 'login_biometric',
    keywords: ['biometria', 'alama ya kidole', 'uso'],
    category: 'guide',
    icon: '🫆',
    response: {
      title: 'Uthibitisho wa biometria',
      content: 'Hatua ya mwisho: BIOMETRIA.\n\n🫆 ALAMA YA KIDOLE\nAU\n👁️ USO\n\n💚 Mafanikio → tabasamu 😊',
      suggestions: ['Ingia', 'Usalama'],
    },
  },

  {
    id: 'uq_organism',
    keywords: ['organisma', 'hai', 'uq hai', 'sarafu hai'],
    category: 'borb',
    icon: 'UQ',
    response: {
      title: 'UQ - Organisma ya Fedha Hai',
      content: 'UQ si blockchain rahisi. Ni ORGANISMA YA FEDHA HAI.\n\nUbongo: Kihesabu na Kikokotoo\nMoyo: Hazina\nMapafu: Ada\nHomoni: Zawadi\nMafuta: Akiba\nMisuli: Mkopo\nKinga: Ngao\nDamu: BORB\nDNA: Blockchain\nMfumo wa neva: P2P\n\nUQ ni 75% huru.',
      suggestions: ['Kesi 6', 'Kihesabu', 'Uhuru 75%', 'Kigezo'],
    },
  },
  {
    id: 'uq_counter',
    keywords: ['kihesabu', 'kikokotoo', 'organa 7', 'ubongo uq'],
    category: 'borb',
    icon: 'CALC',
    response: {
      title: 'Kihesabu na Kikokotoo',
      content: 'Kihesabu ni UBONGO wa UQ.\n\nINAhesabu :\n- Idadi ya watumiaji\n- Jumla ya BORB\n- Usahihi (femto -> infinity)\n\nINAKOKOTOA :\n- Mtiririko wa wakati halisi\n- Ada kwa kila muamala\n- Haki kwa kila Kesi\n\nINAGAWA :\n- Hazina: 30%\n- Ada: 40%\n- Zawadi: 15%\n- Akiba: 10%\n- Mkopo: 5%\n\nINATHIBITISHA :\n- Jumla(Kesi 6) + Kihesabu = 40 Bn',
      suggestions: ['Kesi 6', 'Kigezo', 'Uhuru'],
    },
  },
  {
    id: 'uq_autonomy_75',
    keywords: ['uhuru', '75%', 'huru'],
    category: 'borb',
    icon: 'AI',
    response: {
      title: 'Uhuru 75% wa UQ',
      content: 'UQ ni 75% huru.\n\nHURU (100%) :\n- Kesi 6\n- Ugawaji UBI\n- Ada\n- Madaraja\n- Usafishaji\n- Kiwango\n- Kihesabu\n\nNUSU-HURU (50%) :\n- Matangazo Zando\n- Biashara P2P\n\nMWONGO (0%) :\n- KYC\n- Msaada\n\n75% otomatiki, 25% mwongo.',
      suggestions: ['Kihesabu', 'Kesi 6', 'Mmiliki'],
    },
  },
  {
    id: 'uq_anti_inflation',
    keywords: ['anti mfumuko', 'mfumuko', 'bei inapanda'],
    category: 'borb',
    icon: 'UP',
    response: {
      title: 'Anti-mfumuko UQ',
      content: 'BEI INAPANDA SANA :\n\nKAMA Mfumuko > 5% :\n- Ongeza Akiba (ganda zaidi)\n- Punguza UBI\n- Ongeza ada\n-> Bei inashuka\n\nKihesabu kinagundua na kurekebisha otomatiki.',
      suggestions: ['Anti-mfumuko mdogo', 'Kihesabu', 'Kesi 6'],
    },
  },
  {
    id: 'uq_anti_deflation',
    keywords: ['anti kushuka', 'kushuka', 'bei inashuka'],
    category: 'borb',
    icon: 'DOWN',
    response: {
      title: 'Anti-kushuka UQ',
      content: 'BEI INASHUKA SANA :\n\nKAMA Kushuka > 5% :\n- Punguza Akiba (achilia)\n- Ongeza UBI\n- Punguza ada\n-> Bei inapanda\n\nKihesabu kinagundua na kurekebisha otomatiki.',
      suggestions: ['Anti-mfumuko', 'Kihesabu', 'Kesi 6'],
    },
  },
  {
    id: 'uq_infinite_precision',
    keywords: ['usahihi', 'infinity', 'femto', 'fractal'],
    category: 'borb',
    icon: 'PREC',
    response: {
      title: 'Usahihi wa infinity wa BORB',
      content: 'BORB ina usahihi wa INFINITY.\n\nNGAZI :\n- 1 BORB = 1\n- 1 borb = 0.0001 BORB\n- 1 mborb = 0.000001 BORB\n- 1 nborb = 0.00000001 BORB\n- 1 pborb = 0.0000000001 BORB\n- 1 fborb = 0.000000000001 BORB\n- ... (upanuzi fractal)\n- infinity\n\nHakuna kupoteza thamani.',
      suggestions: ['Vipimo 6', 'Upanuzi fractal', 'Kiwango kibadilika'],
    },
  },
  {
    id: 'uq_dynamic_rate',
    keywords: ['kiwango kibadilika', 'kiwango', 'oracle', 'utabiri'],
    category: 'borb',
    icon: 'RATE',
    response: {
      title: 'Kiwango kibadilika cha UQ',
      content: 'Kiwango cha UQ ni KIBADILIKA.\n\nMILINGANO :\nKiwango(T) = Kiwango_msingi x Kipengele_mahitaji x Kipengele_uhaba x Kipengele_kasi\n\nKihesabu kinaweza KUTABIRI kiwango.\nUsahihi: zaidi ya femtonal.',
      suggestions: ['Kihesabu', 'Usahihi infinity', 'Kesi 6'],
    },
  },
  {
    id: 'uq_invariant_40_bn',
    keywords: ['kigezo', '40 bilioni', '40 bn'],
    category: 'borb',
    icon: 'OK',
    response: {
      title: 'Kigezo - Bilioni 40',
      content: 'Kigezo cha UQ ni RAHISI :\n\nJumla(Kesi 6) + Kihesabu = 40 000 000 000 BORB\n\nInathibitishwa kwa KILA muamala.\n\nKAMA tofauti :\n- TAHADHARI\n- ZUIA miamala\n- Tambua uvujaji\n- Rekebisha otomatiki\n- Endelea\n\nHakuna uvujaji.',
      suggestions: ['Kesi 6', 'Kihesabu', 'Anti-uvujaji'],
    },
  },
  {
    id: 'uq_blockchain_comparison',
    keywords: ['ulinganisho', 'bitcoin', 'ethereum', 'xrp'],
    category: 'borb',
    icon: 'VS',
    response: {
      title: 'UQ vs blockchain nyingine',
      content: 'Kinachofanya UQ kipekee :\n\n- Ugavi maalum : UQ NDIO / Nyingine HAPANA\n- Uhusiano dhahabu : UQ NDIO / Nyingine HAPANA\n- Kesi 6 : UQ NDIO / Nyingine HAPANA\n- Kihesabu : UQ NDIO / Nyingine HAPANA\n- Usahihi infinity : UQ NDIO / Nyingine HAPANA\n- Uhuru 75% : UQ NDIO / Nyingine HAPANA\n- Anti-mfumuko : UQ NDIO / Nyingine HAPANA\n- Kiwango kibadilika : UQ NDIO / Nyingine HAPANA\n\nUQ ni UVUMBUZI WA DUNIA.',
      suggestions: ['Organisma hai', 'Kihesabu', 'Uvumbuzi'],
    },
  },
  {
    id: 'uq_worldwide_innovation',
    keywords: ['uvumbuzi', 'kipekee', 'dunia'],
    category: 'borb',
    icon: 'WORLD',
    response: {
      title: 'UQ - Uvumbuzi wa dunia',
      content: 'UQ ni UVUMBUZI WA DUNIA.\n\nKINACHOFANYA UQ KIPEKEE :\n1. Kesi 6 za kiuchumi\n2. Kihesabu kati\n3. Usahihi infinity\n4. Uhuru 75%\n5. Anti-mfumuko/kushuka\n6. Kiwango kibadilika\n7. Kigezo rahisi\n8. Organisma hai\n\nHakuna blockchain nyingine yenye hii.',
      suggestions: ['Ulinganisho', 'Kihesabu', 'Organisma hai'],
    },
  },];

export default KNOWLEDGE_SW;



