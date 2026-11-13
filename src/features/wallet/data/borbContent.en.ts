import { KnowledgeEntry } from './borbContent.fr';

export const KNOWLEDGE_EN: KnowledgeEntry[] = [
  {
    id: 'borb_overview',
    keywords: ['borb', 'what is', 'borb', 'currency', 'presentation', 'introduction'],
    category: 'borb',
    icon: '💰',
    response: {
      title: 'What is BORB?',
      content: 'BORB (BORB) is the decentralized digital currency of the UQ Platform.\n\n• Fixed supply: 40 billion BORB\n• Backed by a gold reference: the price follows the gold rate captured by the engine\n• The current price is not written in the app: it comes from the regulator and live market capture, and the wallet shows its source and its age\n\nBoth a daily payment method AND an intergenerational store of value.',
      suggestions: ['The 6 units', 'The 6 cases', 'Security'],
    },
  },
  {
    id: 'borb_units',
    keywords: ['units', 'fractal', 'micro', 'nano', 'pico', 'femto', 'fractions'],
    category: 'borb',
    icon: '💱',
    response: {
      title: 'The 6 fractal units',
      content: 'BORB divides into 6 units:\n\n1. BORB = 1\n2. borb = 0.0001\n3. mborb = 0.000001\n4. nborb = 0.00000001\n5. pborb = 0.0000000001\n6. fborb = 0.000000000001\n\nAutomatic fractal extension when fborb > 0.001 USD.',
      suggestions: ['The 6 cases', 'Price'],
    },
  },
  {
    id: 'borb_cases',
    keywords: ['cases', 'treasury', 'fees', 'rewards', 'savings', 'credit', 'shield'],
    category: 'borb',
    icon: '📦',
    response: {
      title: 'The 6 economic cases',
      content: '💰 Treasury: 77.8% → UBI\n💸 Fees: 5.6% → Infrastructure\n🏆 Rewards: 5.6%\n❄️ Savings: 5.6%\n💳 Credit: 3.3%\n🛡️ Shield: 2.2%\n\nInfinite cycle.',
      suggestions: ['Bubbles', 'Recycling'],
    },
  },
  // ===== THE 6 CASES — FULL DETAIL =====
  {
    id: 'cases_overview',
    keywords: ['6 cases', 'six cases', 'the cases', 'economic cases', 'distribution', 'overview'],
    category: 'borb',
    icon: '📦',
    response: {
      title: 'The 6 Economic Cases — Overview',
      content: 'The 40 billion BORB are split into 6 Cases:\n\n💰 Treasury: 77.8% → UBI + bubble conversion\n💸 Fees: 5.6% → Infrastructure\n🏆 Rewards: 5.6% → Motivation\n❄️ Savings: 5.6% → Freeze + scarcity\n💳 Credit: 3.3% → Loans\n🛡️ Shield: 2.2% → Protection\n\n🔄 ETERNAL CYCLE:\nTreasury distributes → users spend → Fees return → Treasury refills → NOTHING is lost.\n\nAsk me about a specific case!',
      suggestions: ['The Treasury', 'The Fees', 'The Rewards', 'Savings'],
    },
  },
  {
    id: 'case_treasury',
    keywords: ['treasury', 'case 1', 'ubi', 'distribution', 'basic income'],
    category: 'borb',
    icon: '💰',
    response: {
      title: '💰 The Treasury (77.8% — 31,120,000,000 BORB)',
      content: 'The Treasury is the HEART of the system.\n\n📋 ROLE:\n• Distributes UBI (2 points/day of activity)\n• Converts Bubbles to BORB (100 bubbles = 1 borb)\n• Receives recycled BORB (inactive accounts)\n• Funds other cases if needed\n\n⚠️ SAFETY FLOOR: 6 BILLION BORB\nIf Treasury drops below 6B:\n→ UBI is paused\n→ Fees redirected 80% to Treasury\n→ System SELF-RECOVERS',
      suggestions: ['The Fees', 'The Rewards', 'How to earn BORB'],
    },
  },
  {
    id: 'case_fees',
    keywords: ['fees', 'case 2', 'commission', 'infrastructure', 'validators', 'relays'],
    category: 'borb',
    icon: '💸',
    response: {
      title: '💸 The Fees (5.6% — 2,240,000,000 BORB)',
      content: 'Fees fuel the system.\n\n📋 ROLE:\n• Collect 0.1% of each transaction\n• Refill the 6 Cases\n• Pay validators and relays\n\n📊 RATES:\n• BORB transfer: 0.1%\n• Marketplace: 1%\n• UQ Reader: 10%\n• Starlink: 10%\n• Loans: 2%\n\n🔄 DISTRIBUTION:\n• 30% → Treasury\n• 40% → Validators\n• 30% → P2P relays\n• 0% → NEVER BURNED\n\n⚠️ CRITICAL: 224M BORB (10%)\nIf Fees drop below → Treasury auto-refills.',
      suggestions: ['The Treasury', 'The Credit', 'How to earn BORB'],
    },
  },
  {
    id: 'case_rewards',
    keywords: ['rewards', 'case 3', 'motivation', 'referral', 'challenges', 'creators', 'badges'],
    category: 'borb',
    icon: '🏆',
    response: {
      title: '🏆 The Rewards (5.6% — 2,240,000,000 BORB)',
      content: 'Rewards drive activity.\n\n📋 TYPES:\n\n🤝 REFERRAL:\n• 1 BORB per active referral\n• 0.5 BORB per referral of referral\n• 3-level cascade\n\n🏆 NEIGHBORHOOD CHALLENGES:\n• "100 transactions" → 10 BORB\n• "10 new shops" → 5 BORB each\n\n🎨 CREATORS:\n• Musicians: 90% of UQ Reader\n• Sellers: badges and reputation\n\n🫧 BUBBLES:\n• Daily activity → bubbles\n• Bubbles → BORB\n\n🔄 AUTO-ADAPT:\n• Activity drops → rewards RISE\n• Activity high → rewards DROP',
      suggestions: ['The Treasury', 'How to earn BORB', 'Refer friends'],
    },
  },
  {
    id: 'case_savings',
    keywords: ['savings', 'case 4', 'freeze', 'scarcity', 'contract', 'interest', 'yield'],
    category: 'borb',
    icon: '❄️',
    response: {
      title: '❄️ The Savings (5.6% — 2,240,000,000 BORB)',
      content: 'Savings freeze BORB.\n\n📋 ROLE:\n• Remove BORB from circulation\n• Create scarcity (price rises)\n• Reward savers\n• Protect wealth\n\n📊 CONTRACTS:\n• 3 months: 1%/year\n• 1 year: 2%/year\n• 3 years: 3%/year\n• 5 years: 4%/year\n• 10 years: 5%/year\n• 50 years: 6%/year\n\n❄️ PROGRESSIVE FREEZE (inactive):\n• 1 year: reminder\n• 2 years: 10% frozen\n• 5 years: 50% frozen\n• 10 years: 50% to Treasury\n• 50 years: 100% to Treasury',
      suggestions: ['The Credit', 'Save smart', 'The Treasury'],
    },
  },
  {
    id: 'case_credit',
    keywords: ['credit', 'case 5', 'loan', 'micro-credit', 'debt', 'borrow', 'overdraft'],
    category: 'borb',
    icon: '💳',
    response: {
      title: '💳 The Credit (3.3% — 1,320,000,000 BORB)',
      content: 'Credit lends.\n\n📋 LOAN TYPES:\n\n🔹 MICRO-CREDIT:\n• 1-50 BORB, 1-6 months, 2-5%\n\n🔹 BUSINESS CREDIT:\n• 50-500 BORB, 6-24 months\n\n🔹 COMMUNITY CREDIT:\n• Neighbors guarantee\n• Reduced rate (2%)\n\n⚠️ NEGATIVE BORB (DEBT):\n• Normal overdraft: -5 BORB\n• Marketer overdraft: -50 BORB\n• AUTOMATIC deduction from income\n• Collateral (savings locked)\n• Forgiveness via Shield (50 years)',
      suggestions: ['Borrow', 'The Shield', 'The Savings'],
    },
  },
  {
    id: 'case_shield',
    keywords: ['shield', 'case 6', 'protection', 'emergency', 'help', 'forgiveness', 'lost key'],
    category: 'borb',
    icon: '🛡️',
    response: {
      title: '🛡️ The Shield (2.2% — 840,000,000 BORB)',
      content: 'The Shield protects.\n\n📋 TYPES:\n\n🔐 LOST KEY:\n• Enhanced ID verification\n• Shamir recovery (3/5)\n• Help up to 50% of balance\n\n🚨 EMERGENCY:\n• Serious illness → immediate help\n• Disaster → collective help\n\n🤝 MUTUAL AID:\n• Declaration of need\n• Community vote\n\n💚 DEBT FORGIVENESS:\n• After 50 years of impossibility\n• Shield FORGIVES the debt\n• No one is CRUSHED',
      suggestions: ['Use the Shield', 'The Credit', 'Security'],
    },
  },
  {
    id: 'case_cycle',
    keywords: ['cycle', 'loop', 'circulation', 'how it works', '6 cases cycle', 'bridges'],
    category: 'borb',
    icon: '🔄',
    response: {
      title: '🔄 The eternal cycle of the 6 Cases',
      content: 'HOW THE 6 CASES FEED EACH OTHER:\n\n1. 💰 Treasury distributes\n2. 👥 Users spend\n3. 💸 Fees return (30% to Treasury)\n4. ❄️ Savings freeze (scarcity)\n5. 💳 Credit lends (interest → savings)\n6. 🛡️ Shield protects (trust)\n7. 🔄 Recycling (10/50 yrs → Treasury)\n\n🔗 BRIDGES:\n• Treasury → Fees: if Fees < 224M\n• Treasury → Shield: if exhausted\n• Savings → Credit: liquidity\n\n♾️ INFINITE CYCLE:\nDistribution → Spend → Fees → Return → Freeze → Loan → Protection → Recycle → ∞\n\n💡 NOTHING IS EVER DESTROYED.',
      suggestions: ['The Treasury', 'Recycling', 'How to earn BORB'],
    },
  },
  // ===== FAQ — ACCOUNT =====
  {
    id: 'faq_create_account',
    keywords: ['create account', 'sign up', 'register', 'open account', 'new account'],
    category: 'faq',
    icon: '👤',
    response: {
      title: 'How to create a UQ account',
      content: '1. Open the app\n2. Fill the form:\n   • First name, Last name\n   • Date of birth\n   • Country, Address\n   • Phone\n   • Password\n3. Verify your phone via SMS\n4. Receive your UQ pseudo (uq@john), UQ number (UQ-00000001) and UQ email\n\n🎁 Welcome to the UQ family!',
      suggestions: ['Sign in', 'Forgot password'],
    },
  },
  {
    id: 'faq_forgot_password',
    keywords: ['forgot password', 'lost password', 'reset password', 'recover password'],
    category: 'faq',
    icon: '🔑',
    response: {
      title: 'I forgot my password',
      content: 'Use Shamir 3/5 recovery:\n\n→ 3 of 5 fragments are enough\n→ Contact your guardians\n→ Or use your biometrics\n\n💡 Biometrics is the fastest if enabled.',
      suggestions: ['Shamir 3/5', 'Biometrics'],
    },
  },
  {
    id: 'faq_lost_2fa',
    keywords: ['lost 2fa', '2fa lost', 'recover 2fa', '2fa code'],
    category: 'faq',
    icon: '🔐',
    response: {
      title: 'I lost my 2FA',
      content: 'Use account recovery:\n\n1. Enhanced identity verification\n2. Biometrics\n3. Contact support\n\n📧 support@ufundi.uq',
      suggestions: ['Contact support', 'Security'],
    },
  },
  {
    id: 'faq_fees',
    keywords: ['fees', 'transaction fee', 'commission', 'how much fee'],
    category: 'faq',
    icon: '💸',
    response: {
      title: 'What are the fees?',
      content: '0.1% per transaction.\n\n📊 EXAMPLE:\n• 5 BORB → 0.005 BORB fee\n• 100 BORB → 0.1 BORB fee\n\n🔄 DISTRIBUTION:\n• 30% Treasury\n• 40% Validators\n• 30% P2P relays\n• 0% Burned',
      suggestions: ['The Fees', 'Transactions'],
    },
  },
  {
    id: 'faq_transfer_speed',
    keywords: ['transfer speed', 'how long', 'duration', 'instant'],
    category: 'faq',
    icon: '⚡',
    response: {
      title: 'How long does a transfer take?',
      content: 'INSTANT (less than 1 second).\n\n✅ Immediate transaction\n✅ No delay\n✅ Instant confirmation',
      suggestions: ['Send BORB', 'Fees'],
    },
  },
  {
    id: 'faq_borb_value',
    keywords: ['borb value', 'how much', 'price borb', 'worth'],
    category: 'faq',
    icon: '💰',
    response: {
      title: 'How much is 1 BORB?',
      content: '1 BORB is worth the price the engine publishes at the moment you ask — not a value hard-coded in the app.\n\n📈 WHERE THE PRICE COMES FROM:\n• The regulator, from real demand across the circulating supply\n• Live capture of the gold rate from the queried sources\n\n📊 WHERE TO READ IT:\n• The wallet shows the current price, its source and its age\n• Offline, the last captured value keeps applying and the app says so\n\nOld trajectory tables (1 USD, then 10, then 100) were marketing fiction: no engine computation produced them, so they were removed.',
      suggestions: ['How to earn', 'Richness trajectory'],
    },
  },
  {
    id: 'faq_earn_borb',
    keywords: ['earn borb', 'make money', 'how to earn', 'income sources'],
    category: 'faq',
    icon: '🌾',
    response: {
      title: 'How to earn BORB',
      content: 'Multiple ways:\n\n🌾 Daily UBI\n🏪 Sell products\n🔧 Offer services\n🎵 Create content\n📡 Sell connection\n🚗 Become deliverer\n🤝 Refer friends\n💱 Trade\n💳 Become Marketer\n💤 Save',
      suggestions: ['12 methods', 'How to get rich'],
    },
  },
  {
    id: 'faq_6_units',
    keywords: ['6 units', 'six units', 'the units', 'fractal units'],
    category: 'faq',
    icon: '💱',
    response: {
      title: 'What are the 6 units?',
      content: '1. BORB: integer = 1\n2. borb: cent = 0.0001\n3. mborb: micro = 0.000001\n4. nborb: nano = 0.00000001\n5. pborb: pico = 0.0000000001\n6. fborb: femto = 0.000000000001\n\n💡 1 BORB = 1 trillion fborb',
      suggestions: ['Convert', '6 cases'],
    },
  },
  // ===== LOGIN =====
  {
    id: 'login_flow',
    keywords: ['login', 'sign in', 'connection', 'how to login'],
    category: 'guide',
    icon: '🔐',
    response: {
      title: 'How to log in to UQ',
      content: 'Login takes 7 steps:\n\n1. 📛 Enter your UQ NUMBER (UQ-XXXXXXXX)\n2. 🔑 If owner → 4-digit unlock code\n3. 📧 Enter your UQ EMAIL + PASSWORD\n4. 🔢 Auto-generated 2FA code\n5. 🫆 Biometrics (fingerprint or face)\n6. ✅ Login successful\n7. 🤖 UQ AI greets you and shows 5 important info\n\n💡 No username, no CAPTCHA, just your UQ number.',
      suggestions: ['UQ number', 'Unlock code', '2FA', 'Biometrics'],
    },
  },
  {
    id: 'login_number',
    keywords: ['uq number', 'my number', 'login id'],
    category: 'guide',
    icon: '📛',
    response: {
      title: 'Your UQ Number',
      content: 'Your UQ number was given at account creation.\n\n📛 Format: UQ-XXXXXXXX\nExample: UQ-00000001\n\n💡 It\'s your ONLY login ID.\nNo username needed.',
      suggestions: ['Login', 'Create account', 'Forgot password'],
    },
  },
  {
    id: 'login_2fa',
    keywords: ['2fa', 'email uq', 'password', 'verification'],
    category: 'guide',
    icon: '📧',
    response: {
      title: '2FA Verification',
      content: '2FA step asks:\n\n📧 UQ EMAIL\n🔑 PASSWORD (8+ characters)\n\n⚠️ If error:\n• Border turns RED\n• Drawer shakes\n\n💡 No SMS code — it\'s automatic.',
      suggestions: ['Forgot password', '2FA code', 'Biometrics'],
    },
  },
  {
    id: 'login_biometric',
    keywords: ['biometrics', 'fingerprint', 'face id', 'scan'],
    category: 'guide',
    icon: '🫆',
    response: {
      title: 'Biometric confirmation',
      content: 'Final step: BIOMETRICS.\n\n🫆 FINGERPRINT\nOR\n👁️ FACIAL RECOGNITION\n\n✅ AI verifies automatically:\n• Anti-fraud\n• Liveness detection\n\n💚 Success → smile 😊',
      suggestions: ['Login', 'Security'],
    },
  },

  {
    id: 'uq_organism',
    keywords: ['organism', 'living', 'uq living', 'living currency'],
    category: 'borb',
    icon: 'UQ',
    response: {
      title: 'UQ - The Living Monetary Organism',
      content: 'UQ is not a simple blockchain. It is a LIVING MONETARY ORGANISM.\n\nBrain: Counter and Calculator\nHeart: Treasury\nLungs: Fees\nHormones: Rewards\nFat: Savings\nMuscles: Credit\nImmunity: Shield\nBlood: BORB\nDNA: Blockchain\nNervous system: P2P\n\nUQ is 75% autonomous.',
      suggestions: ['The 6 Cases', 'The Counter', 'Autonomy 75%', 'The Invariant'],
    },
  },
  {
    id: 'uq_counter',
    keywords: ['counter', 'calculator', '7th organ', 'uq brain'],
    category: 'borb',
    icon: 'CALC',
    response: {
      title: 'The Counter and Calculator',
      content: 'The Counter is the BRAIN of UQ.\n\nCOUNTS :\n- Number of users\n- Total BORB sum\n- Precision (femto -> infinity)\n\nCALCULATES :\n- Real-time flows\n- Fees per transaction\n- Rights per Case\n\nDISTRIBUTES :\n- Treasury: 30%\n- Fees: 40%\n- Rewards: 15%\n- Savings: 10%\n- Credit: 5%\n\nVERIFIES :\n- Sum(6 Cases) + Counter = 40 Bn',
      suggestions: ['The 6 Cases', 'The Invariant', 'Autonomy'],
    },
  },
  {
    id: 'uq_autonomy_75',
    keywords: ['autonomy', '75%', 'autonomous'],
    category: 'borb',
    icon: 'AI',
    response: {
      title: 'UQ 75% Autonomy',
      content: 'UQ is 75% autonomous.\n\nAUTONOMOUS (100%):\n- 6 Cases\n- UBI Distribution\n- Fees\n- Bridges\n- Recycling\n- Rate\n- Counter\n\nSEMI-AUTONOMOUS (50%):\n- Zando Ads\n- P2P Trading\n\nMANUAL (0%):\n- KYC\n- Support\n\n75% automated, 25% manual.',
      suggestions: ['The Counter', 'The 6 Cases', 'The Owner'],
    },
  },
  {
    id: 'uq_anti_inflation',
    keywords: ['anti inflation', 'inflation', 'price rises'],
    category: 'borb',
    icon: 'UP',
    response: {
      title: 'UQ Anti-inflation',
      content: 'WHEN PRICE RISES TOO MUCH :\n\nIF Inflation > 5% :\n- Increase Savings (freeze more)\n- Reduce UBI\n- Increase fees\n-> Price goes down\n\nThe Counter detects and adjusts automatically.',
      suggestions: ['Anti-deflation', 'The Counter', 'The 6 Cases'],
    },
  },
  {
    id: 'uq_anti_deflation',
    keywords: ['anti deflation', 'deflation', 'price drops'],
    category: 'borb',
    icon: 'DOWN',
    response: {
      title: 'UQ Anti-deflation',
      content: 'WHEN PRICE DROPS TOO MUCH :\n\nIF Deflation > 5% :\n- Reduce Savings (release)\n- Increase UBI\n- Reduce fees\n-> Price rises\n\nThe Counter detects and adjusts automatically.',
      suggestions: ['Anti-inflation', 'The Counter', 'The 6 Cases'],
    },
  },
  {
    id: 'uq_infinite_precision',
    keywords: ['precision', 'infinite', 'femto', 'fractal'],
    category: 'borb',
    icon: 'PREC',
    response: {
      title: 'BORB infinite precision',
      content: 'BORB has INFINITE precision.\n\nLEVELS :\n- 1 BORB = 1\n- 1 borb = 0.0001 BORB\n- 1 mborb = 0.000001 BORB\n- 1 nborb = 0.00000001 BORB\n- 1 pborb = 0.0000000001 BORB\n- 1 fborb = 0.000000000001 BORB\n- ... (fractal extension)\n- infinity\n\nNo value loss possible.',
      suggestions: ['The 6 units', 'Fractal extension', 'Dynamic rate'],
    },
  },
  {
    id: 'uq_dynamic_rate',
    keywords: ['dynamic rate', 'rate', 'oracle', 'prediction'],
    category: 'borb',
    icon: 'RATE',
    response: {
      title: 'UQ Dynamic Rate',
      content: 'UQ rate is DYNAMIC.\n\nEQUATION :\nRate(T) = Base_rate x Demand_factor x Scarcity_factor x Velocity_factor\n\nThe Counter can PREDICT the rate.\nPrecision: more than femtonal.',
      suggestions: ['The Counter', 'Infinite precision', 'The 6 Cases'],
    },
  },
  {
    id: 'uq_invariant_40_bn',
    keywords: ['invariant', '40 billion', '40 bn'],
    category: 'borb',
    icon: 'OK',
    response: {
      title: 'The Invariant - 40 Billion',
      content: 'The UQ invariant is SIMPLE :\n\nSum(6 Cases) + Counter = 40 000 000 000 BORB\n\nVerified on EVERY transaction.\n\nIF different :\n- ALERT\n- BLOCK transactions\n- Identify leak\n- Auto-correct\n- Resume\n\nNo leak possible.',
      suggestions: ['The 6 Cases', 'The Counter', 'Anti-leak'],
    },
  },
  {
    id: 'uq_blockchain_comparison',
    keywords: ['comparison', 'bitcoin', 'ethereum', 'xrp'],
    category: 'borb',
    icon: 'VS',
    response: {
      title: 'UQ vs other blockchains',
      content: 'What makes UQ unique :\n\n- Fixed supply : UQ YES / Others NO\n- Gold index : UQ YES / Others NO\n- 6 Cases : UQ YES / Others NO\n- Counter : UQ YES / Others NO\n- Infinite precision : UQ YES / Others NO\n- 75% autonomy : UQ YES / Others NO\n- Anti-inflation : UQ YES / Others NO\n- Dynamic rate : UQ YES / Others NO\n\nUQ is a WORLDWIDE INNOVATION.',
      suggestions: ['The living organism', 'The Counter', 'Innovation'],
    },
  },
  {
    id: 'uq_worldwide_innovation',
    keywords: ['innovation', 'unique', 'worldwide'],
    category: 'borb',
    icon: 'WORLD',
    response: {
      title: 'UQ - Worldwide innovation',
      content: 'UQ is a WORLDWIDE INNOVATION.\n\nWHAT MAKES UQ UNIQUE :\n1. 6 economic Cases\n2. Central Counter\n3. Infinite precision\n4. 75% autonomy\n5. Anti-inflation/deflation\n6. Dynamic rate\n7. Simple invariant\n8. Living organism\n\nNo other blockchain has this.',
      suggestions: ['Comparison', 'The Counter', 'The living organism'],
    },
  },];

export default KNOWLEDGE_EN;



