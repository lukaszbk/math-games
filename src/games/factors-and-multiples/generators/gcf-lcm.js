import { pick, gcd, lcm, getFactors } from '../../../shared/math.js';

const GCF_PAIRS = [
  [8, 12], [9, 15], [10, 25], [12, 16], [12, 18], [12, 20], [14, 21], [14, 35],
  [15, 25], [16, 24], [18, 24], [18, 27], [18, 30], [18, 45], [20, 30], [20, 35],
  [21, 28], [24, 32], [24, 36], [24, 40], [25, 40], [27, 36], [28, 42], [30, 45],
  [32, 48], [35, 49], [36, 48], [36, 54], [36, 60], [40, 60], [42, 56], [45, 75],
  [48, 64], [48, 72], [50, 75], [54, 81], [60, 84], [60, 90], [64, 80], [72, 96],
  [8, 15], [9, 16], [14, 15]
];

const LCM_PAIRS = [
  [2, 3], [2, 5], [2, 7], [2, 9], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9],
  [3, 10], [4, 5], [4, 6], [4, 8], [4, 9], [4, 10], [4, 12], [5, 6], [5, 8], [5, 10],
  [6, 8], [6, 9], [6, 10], [6, 12], [7, 2], [8, 10], [8, 12], [9, 12], [10, 12]
];

export function genGcfLcm() {
  const roll = Math.random();

  // 5A: Direct GCF (<= 100) (40%)
  if (roll < 0.40) {
    const [a, b] = pick(GCF_PAIRS);
    const ans = gcd(a, b);
    const fa = getFactors(a);
    const fb = getFactors(b);
    return {
      dedupeKey: `gcf_${a}_${b}`,
      domainId: 'gcflcm',
      skillKey: 'gcf_direct',
      skillLabel: 'Greatest Common Factor (GCF)',
      topicLabel: 'GCF • Greatest Common Factor',
      inputType: 'numpad',
      fluencySeconds: 22,
      prompt: `Find the Greatest Common Factor (GCF) of ${a} and ${b}:`,
      stageHTML: `
        <div class="equation-hero">
          <span>GCF(${a}, ${b}) =</span>
          <span id="slot-main" class="answer-slot active">?</span>
        </div>
      `,
      helperText: `Factors of ${a}: ${fa.join(', ')}  |  Factors of ${b}: ${fb.join(', ')}`,
      answer: ans,
      explanationHTML: `
        • Factors of ${a}: ${fa.map(x => x === ans ? `<strong>${x}</strong>` : x).join(', ')}<br/>
        • Factors of ${b}: ${fb.map(x => x === ans ? `<strong>${x}</strong>` : x).join(', ')}<br/>
        The largest factor they share is <strong>${ans}</strong>!
      `
    };
  }

  // 5B: Direct LCM (<= 12) (40%)
  if (roll < 0.80) {
    const [a, b] = pick(LCM_PAIRS);
    const ans = lcm(a, b);
    const ma = [];
    const mb = [];
    for (let i = 1; i <= Math.min(10, Math.ceil(ans / a) + 1); i++) ma.push(a * i);
    for (let i = 1; i <= Math.min(10, Math.ceil(ans / b) + 1); i++) mb.push(b * i);
    return {
      dedupeKey: `lcm_${a}_${b}`,
      domainId: 'gcflcm',
      skillKey: 'lcm_direct',
      skillLabel: 'Least Common Multiple (LCM)',
      topicLabel: 'LCM • Least Common Multiple',
      inputType: 'numpad',
      fluencySeconds: 22,
      prompt: `Find the Least Common Multiple (LCM) of ${a} and ${b}:`,
      stageHTML: `
        <div class="equation-hero">
          <span>LCM(${a}, ${b}) =</span>
          <span id="slot-main" class="answer-slot active">?</span>
        </div>
      `,
      helperText: `Multiples of ${a}: ${ma.slice(0, 6).join(', ')}…  |  Multiples of ${b}: ${mb.slice(0, 6).join(', ')}…`,
      answer: ans,
      explanationHTML: `
        • Multiples of ${a}: ${ma.map(x => x === ans ? `<strong>${x}</strong>` : x).join(', ')}…<br/>
        • Multiples of ${b}: ${mb.map(x => x === ans ? `<strong>${x}</strong>` : x).join(', ')}…<br/>
        The smallest multiple they share is <strong>${ans}</strong>!
      `
    };
  }

  // 5C: Wings of Fire Real-World GCF vs LCM Story Puzzle (20%)
  if (Math.random() < 0.5) {
    const storyPairs = [[12, 18], [16, 24], [18, 24], [20, 30], [24, 36], [15, 25], [28, 42]];
    const [a, b] = pick(storyPairs);
    const ans = gcd(a, b);
    const stories = [
      `Clay has ${a} roasted chestnuts and ${b} sweet berries. He wants to make identical snack bags with NO leftovers. What is the GREATEST number of snack bags he can make?`,
      `Glory is arranging ${a} hibiscus flowers and ${b} orchids into matching bouquets with zero flowers left over. What is the GREATEST number of matching bouquets she can make?`,
      `Starflight has ${a} history scrolls and ${b} map scrolls to place equally onto library shelves with none left over. What is the GREATEST number of shelves he can fill identically?`
    ];
    return {
      dedupeKey: `story_gcf_${a}_${b}`,
      domainId: 'gcflcm',
      skillKey: 'gcflcm_word',
      skillLabel: 'GCF & LCM Word Problems',
      topicLabel: 'Dragon Story • GCF',
      inputType: 'numpad',
      fluencySeconds: 25,
      prompt: pick(stories),
      stageHTML: `
        <div class="equation-hero" style="font-size:1.75rem;">
          <span>Greatest Equal Groups =</span>
          <span id="slot-main" class="answer-slot active">?</span>
        </div>
      `,
      helperText: `Splitting ${a} and ${b} into the largest equal groups with no leftovers means finding GCF(${a}, ${b})!`,
      answer: ans,
      explanationHTML: `
        Equal groups with no leftovers means we need a common factor of ${a} and ${b}! <strong>GCF(${a}, ${b}) = ${ans}</strong> groups (each with ${a / ans} and ${b / ans}).
      `
    };
  }

  const storyLcm = [[3, 4], [4, 6], [6, 8], [3, 5], [4, 10], [6, 9], [8, 12], [5, 6]];
  const [a, b] = pick(storyLcm);
  const ans = lcm(a, b);
  const stories = [
    `Tsunami patrols the bay every ${a} hours, and Riptide patrols every ${b} hours. If they both start together right now, in how many hours will they patrol TOGETHER again?`,
    `Cricket checks her plant experiment every ${a} days, and Sundew checks hers every ${b} days. In how many days will they check their plants on the SAME day again?`,
    `Peacemaker bakes strawberry tarts in trays of ${a}, and Sunny brings juice cups in packs of ${b}. What is the SMALLEST equal number of tarts and cups they can match with none extra?`
  ];
  return {
    dedupeKey: `story_lcm_${a}_${b}`,
    domainId: 'gcflcm',
    skillKey: 'gcflcm_word',
    skillLabel: 'GCF & LCM Word Problems',
    topicLabel: 'Dragon Story • LCM',
    inputType: 'numpad',
    fluencySeconds: 25,
    prompt: pick(stories),
    stageHTML: `
      <div class="equation-hero" style="font-size:1.75rem;">
        <span>Smallest Match =</span>
        <span id="slot-main" class="answer-slot active">?</span>
      </div>
    `,
    helperText: `Finding when cycles of ${a} and ${b} line up again means finding LCM(${a}, ${b})!`,
    answer: ans,
    explanationHTML: `
      Repeating cycles of ${a} and ${b} meet at their Least Common Multiple: <strong>LCM(${a}, ${b}) = ${ans}</strong>!
    `
  };
}
