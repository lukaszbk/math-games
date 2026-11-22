import { COMPANIONS } from './dragons.js';
import { MODES, MIX_META, ALL_MODE_IDS, ALL_MODES_META } from './modes.js';
import { GUIDE_TITLE, GUIDE_SUBTITLE, GUIDE_HTML } from './guide.js';
import { buildRoundQuestions } from './generators/index.js';

/**
 * Money Match awards exactly **1 ⭐ per first-try match**, so ten correct
 * choices (one flawless 10-puzzle run) fills an egg bar and hatches one dragon.
 */
function calculateRoundStars(modeId, firstTryCount, mixBonusLabel = '🐉 Daily Hoard Mix Courage Bonus') {
  let starsEarned = firstTryCount;
  const breakdown = [{
    label: `💰 Better-Amount Matches (${firstTryCount}/10 on the first tap)`,
    val: `+${firstTryCount} ⭐`
  }];

  if (modeId === 'mix' && firstTryCount >= 8) {
    starsEarned += 1;
    breakdown.push({ label: mixBonusLabel, val: '+1 ⭐' });
  }
  if (firstTryCount === 10) {
    breakdown.push({
      label: '🥚 Ten perfect matches — a dragon egg is ready to hatch!',
      val: '🐉'
    });
  }

  return { starsEarned, breakdown };
}

export const MONEY_MATCH_GAME = {
  id: 'money-match',
  title: 'Money Match: Dragon Hoard Duel',
  gradeId: 'grade3',
  assignedProfileId: 'grade3',
  gradeLabel: '3rd Grade',
  authorCredit: 'By Ada Guzhu',
  theme: 'hoard',
  defaultPace: 'brisk',
  enableReadAloud: true,
  cardDescription: 'Two piles of treasure, one goal: tap the amount that gives you the MOST money! Challenge numbers for advanced 3rd graders — 3-digit sums inside $1,000, $100 bills with odd cents, 2-digit × 1-digit market deals, and negative money (debt — owing less means keeping more). 10 correct matches hatches a dragon egg — 22 collectible dragons!',
  starterId: '10_qibli',
  companions: COMPANIONS,
  companionNoun: 'Hoard Dragon',
  companionNounPlural: 'Hoard Dragons',
  companionNounPluralLower: 'hoard dragons',
  companionEmoji: '🐉',
  unlockHeading: 'A Dragon Egg Is Hatching!',
  unlockPodEmoji: '🥚',
  groupLabel: 'Tribe',
  sanctuaryTabLabel: '🐉 Hoard Sanctuary',
  sanctuaryTitle: '🐉 Dragon Hoard Sanctuary',
  sanctuarySubtitle: 'Every <strong>10 ⭐</strong> you earn in a quest hatches one of that quest’s dragon eggs — so <strong>10 first-try matches</strong> is one new dragon! Tap any hatched dragon to make them your Study Buddy.',
  sanctuaryFilters: ['All', 'Unlocked', 'SandWing', 'SeaWing', 'SkyWing', 'MudWing', 'IceWing', 'RainWing', 'NightWing', 'LeafWing', 'HiveWing'],
  guideTabLabel: '💰 Money Guide',
  guideTitle: GUIDE_TITLE,
  guideSubtitle: GUIDE_SUBTITLE,
  guideHTML: GUIDE_HTML,
  mixBonusLabel: '🐉 Daily Hoard Mix Courage Bonus',
  modes: MODES,
  mixMeta: MIX_META,
  allModeIds: ALL_MODE_IDS,
  allModesMeta: ALL_MODES_META,
  calculateRoundStars,
  buildRoundQuestions
};
