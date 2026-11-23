import { COMPANIONS } from './companions.js';
import { MODES, MIX_META, ALL_MODE_IDS, ALL_MODES_META } from './modes.js';
import { GUIDE_TITLE, GUIDE_SUBTITLE, GUIDE_HTML } from './guide.js';
import { buildRoundQuestions } from './generators/index.js';

/**
 * Shape, Perimeter & Area awards 1 ⭐ per first-try solve
 * (+1 ⭐ Daily Patrol bonus for 8+ first-try answers), so one flawless
 * 10-puzzle round unlocks a new Kitty friend!
 */
function calculateRoundStars(modeId, firstTryCount, mixBonusLabel = '🐱 SuperKitties Daily Patrol Bonus') {
  let starsEarned = firstTryCount;
  const breakdown = [{
    label: `🐱 First-Try Solves (${firstTryCount}/10 on the first try)`,
    val: `+${firstTryCount} ⭐`
  }];

  if (modeId === 'mix' && firstTryCount >= 8) {
    starsEarned += 1;
    breakdown.push({ label: mixBonusLabel, val: '+1 ⭐' });
  }
  if (firstTryCount === 10) {
    breakdown.push({
      label: '🐾 Flawless 10/10 — a new Kitty friend is ready to join HQ!',
      val: '🐱'
    });
  }

  return { starsEarned, breakdown };
}

export const SUPERKITTIES_SHAPES_GAME = {
  id: 'superkitties-shapes',
  title: 'Shape, Perimeter & Area',
  gradeId: 'grade3',
  assignedProfileId: 'grade3',
  gradeLabel: '3rd Grade',
  authorCredit: 'By Hanna BK',
  theme: 'kitty',
  defaultPace: 'relaxed',
  enableReadAloud: true,
  cardDescription: 'Team up with 9 storybook kitties led by Kiki — the SuperKitties plus Cuzi’s mom Anna — to tile rooms, patrol laser-fence perimeters, slice L-shape castles, crack mystery sides, keep Hernado Watch over rival blueprints, and master quadrilateral shields! 10 first-try stars unlocks a kitty!',
  starterId: '01_kiki',
  companions: COMPANIONS,
  companionNoun: 'Kitty',
  companionNounPlural: 'Kitties',
  companionNounPluralLower: 'kitties',
  companionEmoji: '🐱',
  unlockHeading: 'A New Kitty Friend Is Joining!',
  unlockPodEmoji: '🐾',
  groupLabel: 'Squad',
  sanctuaryTabLabel: '🐱 Kitty HQ',
  sanctuaryTitle: '🐱 SuperKitties & Friends HQ',
  sanctuarySubtitle: 'Every <strong>10 ⭐</strong> earned in a quest unlocks one of its 9 storybook kitties led by <strong>Kiki</strong> (including the SuperKitties and Cuzi’s mom <strong>Anna</strong>!) — so <strong>10 first-try solves</strong> brings a new friend to HQ! Tap any unlocked kitty to make them your Study Buddy.',
  sanctuaryFilters: [
    'All',
    'Unlocked',
    'Starlight Paws',
    'Builder Paws',
    'Shield & Laser Paws',
    'Kitty Family'
  ],
  guideTabLabel: '📐 Builder Guide',
  guideTitle: GUIDE_TITLE,
  guideSubtitle: GUIDE_SUBTITLE,
  guideHTML: GUIDE_HTML,
  mixBonusLabel: '🐱 SuperKitties Daily Patrol Bonus',
  modes: MODES,
  mixMeta: MIX_META,
  allModeIds: ALL_MODE_IDS,
  allModesMeta: ALL_MODES_META,
  calculateRoundStars,
  buildRoundQuestions
};
