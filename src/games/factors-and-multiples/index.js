import { DRAGONS } from './dragons.js';
import { MODES, MIX_META, ALL_MODE_IDS, ALL_MODES_META } from './modes.js';
import { GUIDE_TITLE, GUIDE_SUBTITLE, GUIDE_HTML } from './guide.js';
import { buildRoundQuestions } from './generators/index.js';

export const FACTORS_AND_MULTIPLES_GAME = {
  id: 'factors-and-multiples',
  title: 'Factors & Multiples',
  gradeId: 'grade3',
  assignedProfileId: 'grade3',
  gradeLabel: '3rd Grade',
  theme: 'parchment',
  defaultPace: 'brisk',
  enableReadAloud: false,
  cardDescription: 'Master Factors, Multiples, Leftovers, Primes, Squares, GCF, LCM, and Mystery Numbers with 43 collectible dragon companions!',
  starterId: '01_clay',
  companions: DRAGONS,
  companionNoun: 'Dragon',
  companionNounPlural: 'Dragons',
  companionNounPluralLower: 'dragons',
  companionEmoji: '🐉',
  unlockHeading: 'A Dragon Egg Is Hatching!',
  unlockPodEmoji: '✨',
  groupLabel: 'Tribe',
  sanctuaryTabLabel: '🐉 Dragon Sanctuary',
  sanctuaryTitle: '🐉 Pyrrhia &amp; Pantala Dragon Sanctuary',
  sanctuarySubtitle: 'Each quest type (including Daily Mix) hatches its own Wings of Fire dragons — every <strong>10 ⭐</strong> earned in a quest hatches one of its dragon friends! Tap any unlocked dragon to make them your Study Buddy.',
  sanctuaryFilters: ['All', 'Unlocked', 'MudWing', 'SeaWing', 'RainWing', 'NightWing', 'SandWing', 'IceWing', 'SkyWing', 'SilkWing', 'HiveWing', 'LeafWing'],
  guideTabLabel: '📜 Dragon Math Scroll',
  guideTitle: GUIDE_TITLE,
  guideSubtitle: GUIDE_SUBTITLE,
  guideHTML: GUIDE_HTML,
  mixBonusLabel: '⛰️ Jade Mountain Mix Courage Bonus',
  modes: MODES,
  mixMeta: MIX_META,
  allModeIds: ALL_MODE_IDS,
  allModesMeta: ALL_MODES_META,
  buildRoundQuestions
};
