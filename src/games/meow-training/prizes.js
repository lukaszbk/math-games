const ART = './assets/meow-training/prizes';

export const PRIZES = [
  {
    id: '01_misty',
    image: `${ART}/01_misty.jpg`,
    orderNum: 1,
    modeId: 'starter',
    name: 'Misty',
    isCat: true,
    kind: 'Cat',
    isStarter: true,
    tribe: 'Misty’s Crew • Cat Hero',
    shadowVariant: 'misty',
    stars: 0,
    bio: 'Funny blueish-gray hero cat who leads the start of Meow Training! Starts with Transforming and brings huge laughs and clever 3D volume skills to every quest.',
    quotes: [
      'Paws ready, trainer! Every 10 stars waves the Magic Wand to unlock our next training prize!',
      'Count each visible cube layer first — length × width × height makes volume super clear!',
      'With Transforming, Funniness, and Flexibility, no puzzle crate can stump us!',
      'Purr-fect volume math! Let’s keep training to meet Fang and Aria!'
    ]
  },
  {
    id: '02_misty_transforming',
    image: `${ART}/02_misty_transforming.jpg`,
    orderNum: 2,
    modeId: 'starter',
    name: 'Transforming',
    isCat: false,
    kind: 'Power',
    ownerCatId: '01_misty',
    ownerCatName: 'Misty',
    isStarter: true,
    tribe: 'Misty’s Crew • Power',
    stars: 0,
    bio: 'Misty’s starting power! Lets Misty shapeshift into clever forms to sneak around monster traps and test tricky volume puzzles from every angle.',
    quotes: [
      'Shapeshift power active! Look at a prism from the top layer down or the front face in!'
    ]
  },
  {
    id: '03_misty_funniness',
    image: `${ART}/03_misty_funniness.jpg`,
    orderNum: 3,
    modeId: 'cube-stacks',
    name: 'Funniness',
    isCat: false,
    kind: 'Skill',
    ownerCatId: '01_misty',
    ownerCatName: 'Misty',
    tribe: 'Misty’s Crew • Skill',
    stars: 10,
    bio: 'Misty’s giggle-powered skill! Keeps the whole cat crew smiling and sharp even when cube staircases stack up tall.',
    quotes: [
      'Misty’s Funniness makes even tall unit-cube staircases feel like playtime!'
    ]
  },
  {
    id: '04_misty_flexibility',
    image: `${ART}/04_misty_flexibility.jpg`,
    orderNum: 4,
    modeId: 'layer-slices',
    name: 'Flexibility',
    isCat: false,
    kind: 'Skill',
    ownerCatId: '01_misty',
    ownerCatName: 'Misty',
    tribe: 'Misty’s Crew • Skill',
    stars: 10,
    bio: 'Super-stretchy cat agility! Misty flips, twists, and leaps across stacked cake layers without knocking over a single cube.',
    quotes: [
      'Stretch and slice! One bottom layer × total height gives the whole prism volume!'
    ]
  },
  {
    id: '05_misty_sabretooth',
    image: `${ART}/05_misty_sabretooth.jpg`,
    orderNum: 5,
    modeId: 'box-builder',
    name: 'Sabretooth Cat Tooth (Not That Pointy)',
    isCat: false,
    kind: 'Object',
    ownerCatId: '01_misty',
    ownerCatName: 'Misty',
    tribe: 'Misty’s Crew • Object',
    stars: 10,
    bio: 'A lucky prehistoric Sabretooth Cat Tooth Misty keeps in her pouch — rounded at the tip and not that pointy, just right for a funny hero cat!',
    quotes: [
      'Not that pointy, totally lucky! Misty packs it safely inside her 3D treasure crate!'
    ]
  },
  {
    id: '06_misty_clown_friend',
    image: `${ART}/06_misty_clown_friend.jpg`,
    orderNum: 6,
    modeId: 'mix',
    name: 'Clown Friend',
    isCat: false,
    kind: 'Object / Person',
    ownerCatId: '01_misty',
    ownerCatName: 'Misty',
    tribe: 'Misty’s Crew • Object / Person',
    stars: 10,
    bio: 'Misty’s cheerful Clown Friend! Juggles sparkling cubes and brings Misty’s crew together — unlocking her completes Misty’s training and awakens Fang!',
    quotes: [
      'Ta-da! Juggling magic cubes across all 6 quests — and calling Fang into battle!'
    ]
  },
  {
    id: '07_fang',
    image: `${ART}/07_fang.jpg`,
    orderNum: 7,
    modeId: 'twin-towers',
    name: 'Fang',
    isCat: true,
    kind: 'Cat',
    isAutoMilestone: true,
    starterGiftId: '08_fang_telekinesis',
    prerequisiteIds: [
      '03_misty_funniness',
      '04_misty_flexibility',
      '05_misty_sabretooth',
      '06_misty_clown_friend'
    ],
    tribe: 'Fang’s Pack • Cat Hero',
    shadowVariant: 'fang',
    stars: 0,
    bio: 'Fierce, loyal gray warrior cat! Awakens automatically with her mind-floating power the moment Misty unlocks all of her crew’s things.',
    quotes: [
      'Fang reporting for duty! Let’s float twin towers into place and add both volumes!',
      'Pointy Sabretooth power and crystal shards ready — multiply carefully and strike true!',
      'When monsters attack, Flerie-Rush and Parry bounce them right back!',
      'Finish my pack’s training and Aria of the Sea Force will join our team!'
    ]
  },
  {
    id: '08_fang_telekinesis',
    image: `${ART}/08_fang_telekinesis.jpg`,
    orderNum: 8,
    modeId: 'twin-towers',
    name: 'Making Things Float with Her Mind',
    isCat: false,
    kind: 'Power',
    ownerCatId: '07_fang',
    ownerCatName: 'Fang',
    isAutoMilestone: true,
    unlockedWithCatId: '07_fang',
    tribe: 'Fang’s Pack • Power',
    stars: 0,
    bio: 'Fang’s starting power! Lifts giant twin crates and glowing cubes straight into the air using pure mind power.',
    quotes: [
      'Whoosh! Floating Box A and Box B side by side makes adding their volumes a breeze!'
    ]
  },
  {
    id: '09_fang_pointy_tooth',
    image: `${ART}/09_fang_pointy_tooth.jpg`,
    orderNum: 9,
    modeId: 'tank-rivals',
    name: 'Sabretooth Cat Tooth (Pointy)',
    isCat: false,
    kind: 'Object',
    ownerCatId: '07_fang',
    ownerCatName: 'Fang',
    tribe: 'Fang’s Pack • Object',
    stars: 10,
    bio: 'A razor-sharp Sabretooth Cat Tooth (the super pointy kind!) that Fang wears as a fierce warrior charm.',
    quotes: [
      'Sharp as a tack — and twice as sharp when comparing Sea Force tank volumes!'
    ]
  },
  {
    id: '10_fang_shard',
    image: `${ART}/10_fang_shard.jpg`,
    orderNum: 10,
    modeId: 'potion-beakers',
    name: 'Glowing Shard',
    isCat: false,
    kind: 'Object',
    ownerCatId: '07_fang',
    ownerCatName: 'Fang',
    tribe: 'Fang’s Pack • Object',
    stars: 10,
    bio: 'A radiant magical crystal shard glowing with sea-teal light! Charges up potion flasks and reveals missing crate heights.',
    quotes: [
      'Crystal glow! Measure every milliliter and divide Volume ÷ Base to find the height!'
    ]
  },
  {
    id: '11_fang_flerie_rush',
    image: `${ART}/11_fang_flerie_rush.jpg`,
    orderNum: 11,
    modeId: 'cube-stacks',
    name: 'Flerie-Rush',
    isCat: false,
    kind: 'Skill',
    ownerCatId: '07_fang',
    ownerCatName: 'Fang',
    tribe: 'Fang’s Pack • Skill',
    stars: 10,
    bio: 'A signature move Hanna and Ada made up together — jump sideways and punch at the exact same time!',
    quotes: [
      'Flerie-Rush!! Jump sideways and punch at the exact same time!'
    ]
  },
  {
    id: '12_fang_parry',
    image: `${ART}/12_fang_parry.jpg`,
    orderNum: 12,
    modeId: 'layer-slices',
    name: 'Parry',
    isCat: false,
    kind: 'Skill',
    ownerCatId: '07_fang',
    ownerCatName: 'Fang',
    tribe: 'Fang’s Pack • Skill',
    stars: 10,
    bio: 'Make the attacker who is attacking you get their own attack bounced right back at them!',
    quotes: [
      'CLANG! Bounced that monster attack right back where it came from!'
    ]
  },
  {
    id: '13_fang_mind_shield',
    image: `${ART}/13_fang_mind_shield.jpg`,
    orderNum: 13,
    modeId: 'box-builder',
    name: 'Monster Mind-Shield',
    isCat: false,
    kind: 'Power',
    ownerCatId: '07_fang',
    ownerCatName: 'Fang',
    tribe: 'Fang’s Pack • Power',
    stars: 10,
    bio: 'Makes bad monsters unable to read or control your mind! Completing Fang’s final power automatically awakens Aria and the Sea Force!',
    quotes: [
      'Mind-Shield up! No monster can scramble your thoughts — and Aria is ready to rise!'
    ]
  },
  {
    id: '14_aria',
    image: `${ART}/14_aria.jpg`,
    orderNum: 14,
    modeId: 'tank-rivals',
    name: 'Aria',
    isCat: true,
    kind: 'Cat',
    isAutoMilestone: true,
    starterGiftId: '15_aria_sea_force_leader',
    prerequisiteIds: [
      '09_fang_pointy_tooth',
      '10_fang_shard',
      '11_fang_flerie_rush',
      '12_fang_parry',
      '13_fang_mind_shield'
    ],
    tribe: 'Sea Force • Cat Hero',
    shadowVariant: 'aria',
    stars: 0,
    bio: 'Moonlit dark-white legendary cat and Leader of the Sea Force! Awakens automatically when Fang finishes her training, carrying ocean starlight to defeat the Queen Monster.',
    quotes: [
      'Leader of the Sea Force here! Let’s master crystal tanks and magic potions together!',
      'Remember: 1 Liter equals 1,000 milliliters — keep your flasks balanced!',
      'Every unlocked Sea Force power brings us closer to defeating the Queen Monster!',
      'All good powers unite under the moonlit waves — we are unstoppable!'
    ]
  },
  {
    id: '15_aria_sea_force_leader',
    image: `${ART}/15_aria_sea_force_leader.jpg`,
    orderNum: 15,
    modeId: 'tank-rivals',
    name: 'Leader of the Sea Force',
    isCat: false,
    kind: 'Skill',
    ownerCatId: '14_aria',
    ownerCatName: 'Aria',
    isAutoMilestone: true,
    unlockedWithCatId: '14_aria',
    tribe: 'Sea Force • Skill',
    stars: 0,
    bio: 'Aria’s starting leadership skill! Commands ocean currents and teams up Misty, Fang, and the Sea Force guardians for the final push.',
    quotes: [
      'Sea Force formation! Compare tank capacities with crisp L × W × H math!'
    ]
  },
  {
    id: '16_aria_pearl_bracelet',
    image: `${ART}/16_aria_pearl_bracelet.jpg`,
    orderNum: 16,
    modeId: 'potion-beakers',
    name: 'Blue Pearl Bracelet',
    isCat: false,
    kind: 'Object',
    ownerCatId: '14_aria',
    ownerCatName: 'Aria',
    tribe: 'Sea Force • Object',
    stars: 10,
    bio: 'A shimmering Blue Pearl Bracelet woven with sea-foam starlight that channels Aria’s ocean magic into every potion beaker.',
    quotes: [
      'The Blue Pearl Bracelet glows brightest when your milliliter totals match 1,000 mL!'
    ]
  },
  {
    id: '17_aria_revive_cats',
    image: `${ART}/17_aria_revive_cats.jpg`,
    orderNum: 17,
    modeId: 'twin-towers',
    name: 'Bring Cats from the Dead',
    isCat: false,
    kind: 'Power',
    ownerCatId: '14_aria',
    ownerCatName: 'Aria',
    tribe: 'Sea Force • Power',
    stars: 10,
    bio: 'Aria’s legendary starlight revival power! Sends golden ocean sparkles to lift fallen cat heroes right back onto their paws.',
    quotes: [
      'Starlight revival! No hero cat ever stays down when Aria’s lantern shines!'
    ]
  },
  {
    id: '18_aria_breathe_underwater',
    image: `${ART}/18_aria_breathe_underwater.jpg`,
    orderNum: 18,
    modeId: 'mix',
    name: 'Breathe Underwater',
    isCat: false,
    kind: 'Power',
    ownerCatId: '14_aria',
    ownerCatName: 'Aria',
    tribe: 'Sea Force • Power',
    stars: 10,
    bio: 'Lets Aria and her teammates swim deep through glowing coral caverns and breathe comfortably underwater without coming up for air.',
    quotes: [
      'Deep-sea dive! Breathing easy underwater as we solve our final Meow Training mixes!'
    ]
  },
  {
    id: '19_aria_all_good_powers',
    image: `${ART}/19_aria_all_good_powers.jpg`,
    orderNum: 19,
    modeId: 'mix',
    name: 'All the Powers! (Not the Super Evil Ones)',
    isCat: false,
    kind: 'Power',
    ownerCatId: '14_aria',
    ownerCatName: 'Aria',
    tribe: 'Sea Force • Power',
    stars: 10,
    bio: 'The ultimate Sea Force blessing! Gathers every hero power in the world — strictly not the super evil ones — so Misty, Fang, and Aria win and proclaim: queen monster defeated!!!',
    quotes: [
      'All the good powers shine together — queen monster defeated!!!'
    ]
  }
];
