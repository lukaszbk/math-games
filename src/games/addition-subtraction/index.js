import { COMPANIONS } from './companions.js';
import { MODES, MIX_META, ALL_MODE_IDS, ALL_MODES_META } from './modes.js';
import { GUIDE_TITLE, GUIDE_SUBTITLE, GUIDE_HTML } from './guide.js';
import { buildRoundQuestions } from './generators/index.js';

export const ADDITION_SUBTRACTION_GAME = {
  id: 'addition-subtraction',
  title: 'Addition & Subtraction',
  gradeId: 'grade1',
  assignedProfileId: 'grade1',
  gradeLabel: '1st Grade',
  theme: 'meadow',
  defaultPace: 'relaxed',
  enableReadAloud: true,
  cardDescription: 'Master Making 10 to Add, Using 10 to Subtract, Teen Numbers, Doubles, and Fact Families with 29 Dog Man & Supa Buddies companions!',
  starterId: '01_dog_man',
  companions: COMPANIONS,
  companionNoun: 'Supa Buddy',
  companionNounPlural: 'Supa Buddies',
  companionNounPluralLower: 'supa buddies',
  companionEmoji: '🐶',
  unlockHeading: 'A Supa Capsule Is Opening!',
  unlockPodEmoji: '🐾',
  groupLabel: 'Squad',
  sanctuaryTabLabel: '🐶 Dog Man Clubhouse',
  sanctuaryTitle: '🐶 Dog Man &amp; Supa Buddies Clubhouse',
  sanctuarySubtitle: 'Each quest type (including Daily Mix) unlocks its own Dog Man friends — every <strong>10 ⭐</strong> earned in a quest opens a new Supa Capsule! Tap any unlocked buddy to make them your Study Buddy.',
  sanctuaryFilters: ['All', 'Unlocked', 'Supa Cops', 'Supa Buddies', 'Robots & Tech', 'Redeemed Heroes', 'City Friends', 'Cat Kid Club', 'Villains'],
  guideTabLabel: '📖 Make-a-Ten Guide',
  guideTitle: GUIDE_TITLE,
  guideSubtitle: GUIDE_SUBTITLE,
  guideHTML: GUIDE_HTML,
  mixBonusLabel: '🐾 Supa Buddies Daily Mix Courage Bonus',
  modes: MODES,
  mixMeta: MIX_META,
  allModeIds: ALL_MODE_IDS,
  allModesMeta: ALL_MODES_META,
  buildRoundQuestions
};
