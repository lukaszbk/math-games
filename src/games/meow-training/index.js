import { PRIZES } from './prizes.js';
import { MODES, MIX_META, ALL_MODE_IDS, ALL_MODES_META } from './modes.js';
import { GUIDE_TITLE, GUIDE_SUBTITLE, GUIDE_HTML } from './guide.js';
import { buildRoundQuestions } from './generators/index.js';
import {
  buildCatShadowSVG,
  buildMagicWandSVG,
  buildMysteryPrizeSealSVG
} from './svg-volume.js';
import { escapeHtml } from '../../shared/dom.js';
import { isCompanionUnlocked } from '../../shared/progression.js';

/**
 * Meow Training awards 1 ⭐ per first-try Volume solve (+1 ⭐ Daily Mix bonus
 * for 8+ first-try solves), so a flawless 10/10 round immediately reaches 10 ⭐
 * and waves the Magic Wand to unlock the next prize!
 */
function calculateRoundStars(modeId, firstTryCount, mixBonusLabel = '🪄 Daily Meow Training Mix Bonus') {
  let starsEarned = firstTryCount;
  const breakdown = [{
    label: `🪄 First-Try Volume Solves (${firstTryCount}/10 on the first try)`,
    val: `+${firstTryCount} ⭐`
  }];

  if (modeId === 'mix' && firstTryCount >= 8) {
    starsEarned += 1;
    breakdown.push({ label: mixBonusLabel, val: '+1 ⭐' });
  }
  if (firstTryCount === 10) {
    breakdown.push({
      label: '✨ Flawless 10/10 — wave the Magic Wand to unlock your next prize!',
      val: '🪄'
    });
  }

  return { starsEarned, breakdown };
}

function renderUnlockPodHTML(companion) {
  return buildMagicWandSVG({
    withCatShadow: Boolean(companion && companion.isCat),
    catVariant: (companion && companion.shadowVariant) || 'mystery'
  });
}

function renderLockedPeekHTML(nextPrize) {
  const variant = (nextPrize && nextPrize.isCat && nextPrize.shadowVariant) || 'mystery';
  return buildCatShadowSVG(variant, { showQuestion: false });
}

function renderLockedCardVisualHTML(companion) {
  if (companion && companion.isCat) {
    return buildCatShadowSVG(companion.shadowVariant || 'mystery');
  }
  return buildMysteryPrizeSealSVG((companion && companion.kind) || 'Power');
}

function renderSanctuaryOverviewHTML(gameSave, gameDef) {
  const unlockedCount = PRIZES.filter(c => isCompanionUnlocked(gameSave, c.id)).length;
  const allUnlocked = unlockedCount >= PRIZES.length;

  const mistyCrew = PRIZES.filter(c => c.id === '01_misty' || c.ownerCatId === '01_misty');
  const fangPack = PRIZES.filter(c => c.id === '07_fang' || c.ownerCatId === '07_fang');
  const ariaForce = PRIZES.filter(c => c.id === '14_aria' || c.ownerCatId === '14_aria');

  const stageCard = (title, items, note) => {
    const doneCount = items.filter(c => isCompanionUnlocked(gameSave, c.id)).length;
    const catUnlocked = isCompanionUnlocked(gameSave, items[0].id);
    const complete = doneCount === items.length;
    return `
      <div class="meow-track-stage ${complete ? 'complete' : (catUnlocked ? 'unlocked' : '')}">
        <div class="meow-track-title">${escapeHtml(title)}</div>
        <div class="meow-track-meta">${complete ? '✓ Complete!' : `${doneCount} / ${items.length} Unlocked`}</div>
        <div class="meow-track-sub">${escapeHtml(note)}</div>
      </div>
    `;
  };

  const victoryHTML = allUnlocked
    ? `
      <div class="meow-victory-banner" role="status">
        <div>
          <h3 class="meow-victory-title">👑 ${escapeHtml(gameDef.victoryBannerText || 'queen monster defeated!!!')} 👑</h3>
          <p class="meow-victory-sub">Misty, Fang, and Aria unlocked every single Power, Object, and Skill — all 19 Meow Training prizes are yours!</p>
        </div>
        <span class="tribe-pill" style="font-size:0.86rem; padding:6px 14px;">🐱 19 / 19 Mastered!</span>
      </div>
    `
    : '';

  return `
    ${victoryHTML}
    <div class="meow-story-track" aria-label="Meow Training Story Progression">
      ${stageCard('1. Misty’s Crew', mistyCrew, 'Starts unlocked → finish to awaken Fang!')}
      ${stageCard('2. Fang’s Pack', fangPack, 'Auto-unlocks Fang + Mind Floating → finish for Aria!')}
      ${stageCard('3. Aria’s Sea Force', ariaForce, 'Auto-unlocks Aria + Sea Force Leader!')}
      <div class="meow-track-stage ${allUnlocked ? 'complete' : ''}">
        <div class="meow-track-title">4. Final Battle</div>
        <div class="meow-track-meta">${allUnlocked ? '👑 queen monster defeated!!!' : `${19 - unlockedCount} prizes left`}</div>
        <div class="meow-track-sub">${allUnlocked ? 'All good powers united!' : 'Unlock all 19 prizes to win!'}</div>
      </div>
    </div>
  `;
}

export const MEOW_TRAINING_GAME = {
  id: 'meow-training',
  title: 'Meow Training',
  gradeId: 'grade3',
  assignedProfileId: 'grade3',
  gradeLabel: '3rd Grade',
  authorCredit: 'By Hanna BK',
  theme: 'wand',
  defaultPace: 'relaxed',
  enableReadAloud: true,
  progressionType: 'sequential',
  onlyCatsAsBuddy: true,
  victoryBannerText: 'queen monster defeated!!!',
  cardDescription: 'Train Misty, Fang, and Aria through 3D Volume cubes, layer cakes, twin towers, crystal tanks, and magic potion flasks! Every 10 ⭐ waves the Magic Wand to unlock 19 Cats, Powers, Objects & Skills and proclaim queen monster defeated!!!',
  starterId: '01_misty',
  starterUnlockedIds: ['01_misty', '02_misty_transforming'],
  companions: PRIZES,
  companionNoun: 'Cat & Prize',
  companionNounPlural: 'Cats & Prizes',
  companionNounPluralLower: 'cats & prizes',
  companionEmoji: '🐱',
  confettiSymbols: ['⭐', '✨', '🪄', '🐱', '💎', '🎉'],
  unlockPodType: 'wand',
  unlockPodEmoji: '🪄',
  unlockHeading: '🪄 Wave the Magic Training Wand!',
  groupLabel: 'Crew',
  sanctuaryTabLabel: '🪄 Cat Training Dojo',
  sanctuaryTitle: '🪄 Meow Training Story Dojo',
  sanctuarySubtitle: 'Start with <strong>Misty</strong> + <strong>Transforming</strong>! Every <strong>10 ⭐</strong> earned in any quest waves the Magic Wand to unlock the next Power, Object, or Skill — awakening <strong>Fang</strong> and <strong>Aria</strong> along the way until <strong>queen monster defeated!!!</strong>',
  sanctuaryFilters: [
    'All',
    'Unlocked',
    'Misty’s Crew',
    'Fang’s Pack',
    'Sea Force',
    'Cat Hero',
    'Power',
    'Skill',
    'Object'
  ],
  guideTabLabel: '📘 Volume & Wand Guide',
  guideTitle: GUIDE_TITLE,
  guideSubtitle: GUIDE_SUBTITLE,
  guideHTML: GUIDE_HTML,
  mixBonusLabel: '🪄 Daily Meow Training Mix Bonus',
  modes: MODES,
  mixMeta: MIX_META,
  allModeIds: ALL_MODE_IDS,
  allModesMeta: ALL_MODES_META,
  calculateRoundStars,
  buildRoundQuestions,
  renderUnlockPodHTML,
  renderLockedPeekHTML,
  renderLockedCardVisualHTML,
  renderSanctuaryOverviewHTML
};
