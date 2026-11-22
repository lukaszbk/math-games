import { pick, randInt, shuffle } from '../../../shared/math.js';
import {
  buildCompareQuestion,
  cashHoard,
  compareSymbol,
  groupHoard,
  nearbyDelta,
  nearbyTotalDollars,
  randomSign,
  symbolHTML,
  diffLabel,
  moneyLabel
} from '../money.js';

const WARES = [
  { plural: 'gems', emoji: '💎' },
  { plural: 'gold coins', emoji: '🪙' },
  { plural: 'crowns', emoji: '👑' },
  { plural: 'pearls', emoji: '🦪' },
  { plural: 'scale mail capes', emoji: '🧥' },
  { plural: 'treasure maps', emoji: '🗺️' }
];

const DRAGON_NAMES = ['Qibli', 'Sunny', 'Clay', 'Glory', 'Starflight', 'Tsunami'];

function storySideHTML(hoard) {
  if ((hoard.items.length === 0 && hoard.hero) || hoard.items.length > 1) {
    return `${hoard.hero} = <strong>${moneyLabel(hoard.total)}</strong>`;
  }
  return `<strong>${moneyLabel(hoard.total)}</strong>`;
}

function explainStory(left, right) {
  const symbol = compareSymbol(left.total, right.total);
  const leftLine = storySideHTML(left);
  const rightLine = storySideHTML(right);

  if (symbol === '=') {
    return `${leftLine} &nbsp;•&nbsp; ${rightLine}<br/>Both amounts match — either way you get the same money!`;
  }
  const winner = symbol === '>' ? 'Left' : 'Right';
  return `
    ${leftLine} &nbsp;•&nbsp; ${rightLine}<br/>
    <span class="cmp-symbol">${moneyLabel(left.total)} ${symbolHTML(symbol)} ${moneyLabel(right.total)}</span><br/>
    The <strong>${winner} Hoard</strong> gives you the most money — <strong>${diffLabel(left.total - right.total)}</strong> more!
  `;
}

function flatVsStory(story, flatDollars) {
  const flat = cashHoard([flatDollars], 'One money bag');
  return Math.random() < 0.5
    ? { left: story, right: flat }
    : { left: flat, right: story };
}

function wareCaption(groups, eachDollars, extraDollars) {
  const ware = pick(WARES);
  const base = `${ware.emoji} ${groups} ${ware.plural} at ${moneyLabel(eachDollars * 100)} each`;
  return extraDollars ? `${base} plus ${moneyLabel(extraDollars * 100)} found in a cushion` : base;
}

/**
 * A second equal-groups deal whose total lands close to `targetDollars`. The
 * deal must LOOK different from the first one too, otherwise the two answer
 * buttons would read identically (a tie should still be a puzzle).
 */
function secondDealNear(targetDollars, avoidGroups, avoidEach) {
  const gapDollars = Math.max(2, Math.round(nearbyDelta(targetDollars * 100, {
    minCents: 200, fraction: 0.06, maxCents: 2500
  }) / 100));
  const wanted = targetDollars + randomSign() * gapDollars;

  const looks = (groups, each) => !(groups === avoidGroups && each === avoidEach);

  for (let attempt = 0; attempt < 60; attempt++) {
    const groups = randInt(3, 9);
    const each = Math.round(wanted / groups);
    if (each >= 11 && each <= 78 && looks(groups, each) && groups * each !== targetDollars) {
      return { groups, each, total: groups * each };
    }
  }
  const groups = avoidGroups === 6 ? 7 : 6;
  let each = Math.min(78, Math.max(11, Math.round(wanted / groups)));
  if (groups * each === targetDollars) {
    each = each < 78 ? each + 1 : each - 1;
  }
  return { groups, each, total: groups * each };
}

export function genMarket() {
  const roll = Math.random();
  const roster = shuffle(DRAGON_NAMES);
  const nameA = roster[0];
  const nameB = roster[1];

  // 6A — 2-digit × 1-digit equal groups versus one flat amount
  if (roll < 0.4) {
    const groups = randInt(3, 9);
    const each = randInt(12, 68);
    const product = groups * each;
    const caption = wareCaption(groups, each, 0);
    const story = groupHoard({ groups, eachDollars: each, caption });
    const flat = nearbyTotalDollars(product, { fraction: 0.09, minGapDollars: 3, minDollars: 20 });
    const pair = flatVsStory(story, flat);

    return buildCompareQuestion({
      modeId: 'market',
      skillKey: 'money_groups_flat',
      skillLabel: 'Equal Groups Versus One Amount',
      topicLabel: 'Dragon Market Stories',
      prompt: `🛒 ${nameA} sells treasure: ${caption}. 🎯 Goal: the MOST money! Are those earnings worth MORE than ${moneyLabel(flat * 100)}?`,
      dedupeKey: `mkt1_${story.total}_${flat * 100}`,
      fluencySeconds: 34,
      left: pair.left,
      right: pair.right,
      helperText: `Multiply the equal groups: ${groups} × ${moneyLabel(each * 100)}. Try ${groups} × ${Math.floor(each / 10) * 10}, then add the leftover ${groups} × ${each % 10}.`,
      explanationHTML: explainStory(pair.left, pair.right)
    });
  }

  // 6B — two equal-group deals with very close totals
  if (roll < 0.72) {
    const aGroups = randInt(3, 9);
    const aEach = randInt(12, 68);
    const aTotal = aGroups * aEach;
    const dealB = secondDealNear(aTotal, aGroups, aEach);

    const storyA = groupHoard({ groups: aGroups, eachDollars: aEach, caption: wareCaption(aGroups, aEach, 0) });
    const storyB = groupHoard({ groups: dealB.groups, eachDollars: dealB.each, caption: wareCaption(dealB.groups, dealB.each, 0) });
    const pair = Math.random() < 0.5
      ? { left: storyA, right: storyB }
      : { left: storyB, right: storyA };

    return buildCompareQuestion({
      modeId: 'market',
      skillKey: 'money_groups_pairs',
      skillLabel: 'Comparing Two Multiplication Deals',
      topicLabel: 'Dragon Market Stories',
      prompt: `🛒 ${nameA} and ${nameB} both count their treasure. Whose pile is worth <strong>MORE</strong>?`,
      goal: 'Goal: take the pile worth the MOST money!',

      dedupeKey: `mkt2_${pair.left.total}_${pair.right.total}`,
      fluencySeconds: 40,
      left: pair.left,
      right: pair.right,
      helperText: 'Do one multiplication per side, then compare the two answers — the totals here are close!',
      explanationHTML: explainStory(pair.left, pair.right)
    });
  }

  // 6C — equal groups PLUS loose money (multiply first, then add)
  const groups = randInt(3, 8);
  const each = randInt(14, 72);
  const extra = randInt(18, 95);
  const caption = wareCaption(groups, each, extra);
  const story = groupHoard({ groups, eachDollars: each, extraDollars: extra, caption });
  const total = groups * each + extra;
  const flat = nearbyTotalDollars(total, { fraction: 0.07, minGapDollars: 3, minDollars: 20 });
  const pair = flatVsStory(story, flat);

  return buildCompareQuestion({
    modeId: 'market',
    skillKey: 'money_groups_plus',
    skillLabel: 'Multiply Then Add Money',
    topicLabel: 'Dragon Market Stories',
    prompt: `🛒 ${nameA} counts up treasure: ${caption}. 🎯 Goal: the MOST money! Is that worth MORE than ${moneyLabel(flat * 100)}?`,
    dedupeKey: `mkt3_${story.total}_${flat * 100}`,
    fluencySeconds: 42,
    left: pair.left,
    right: pair.right,
    helperText: `Do the multiplying FIRST (${groups} × ${moneyLabel(each * 100)}), then add the ${moneyLabel(extra * 100)}.`,
    explanationHTML: explainStory(pair.left, pair.right)
  });
}
