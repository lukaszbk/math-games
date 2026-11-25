import { pick, randInt, shuffle } from '../../../shared/math.js';
import {
  buildAnswerBarHTML,
  buildBeakerPairSVG,
  buildPotionBeakerSVG,
  buildPrismBoxSVG
} from '../svg-volume.js';

export function genPotionBeakers() {
  const roll = Math.random();

  // 6A: Mystery Height of a 3D Crate given Volume & Base L×W (40%)
  if (roll < 0.40) {
    const L = randInt(2, 6);
    const W = randInt(2, 5);
    const H = randInt(2, 7);
    const base = L * W;
    const vol = base * H;
    const unit = pick(['cm', 'in', 'ft']);

    return {
      dedupeKey: `pb_height_${L}_${W}_${H}_${unit}`,
      domainId: 'potion-beakers',
      skillKey: 'vol_mystery_height',
      skillLabel: 'Mystery Height (Volume ÷ Base)',
      topicLabel: 'Mystery Crate Height',
      inputType: 'numpad',
      fluencySeconds: 24,
      prompt: `This magic crate has a total volume of <strong>${vol} cubic ${unit}</strong>. What is the mystery height <strong>?</strong>`,
      promptText: `Volume is ${vol} cubic ${unit}, length is ${L} ${unit}, width is ${W} ${unit}. Find mystery height.`,
      stageHTML: `
        <div class="vol-goal-banner">🔎 Find Base (${L} × ${W}), then divide ${vol} ÷ Base = Height ?</div>
        ${buildPrismBoxSVG({
          length: L,
          width: W,
          height: H,
          unit,
          labelL: L,
          labelW: W,
          labelH: '?',
          centerBadge: `Vol = ${vol}`,
          palette: {
            top: '#E0F2FE',
            left: '#7DD3FC',
            right: '#0284C7',
            stroke: '#0369A1'
          }
        })}
        ${buildAnswerBarHTML({ label: 'Mystery Height =', unit })}
      `,
      answer: H,
      helperText: `First multiply the base: ${L} × ${W} = ${base}. Then ask: ${base} × ? = ${vol}!`,
      mistakeSummary: `Mystery height: Vol ${vol}, base ${L}×${W}`,
      explanationHTML: `
        Base Area = <strong>${L} × ${W} = ${base}</strong>.<br/>
        <strong>${vol} ÷ ${base} = ${H}</strong> (check: ${base} × ${H} = ${vol}) → Height = <strong>${H} ${unit}</strong>!
      `
    };
  }

  // 6B: Liquid Volume Potion Beakers in mL / L (numpad answers strictly 1..999!) (38%)
  if (roll < 0.78) {
    const subRoll = Math.random();

    // Combine two graduated beakers (total <= 950 mL)
    if (subRoll < 0.5) {
      const a = pick([150, 200, 250, 300, 350, 400, 450]);
      const b = pick([125, 150, 175, 200, 250, 300, 350, 400]);
      const total = a + b;
      return {
        dedupeKey: `pb_add_${a}_${b}`,
        domainId: 'potion-beakers',
        skillKey: 'vol_liquid_add',
        skillLabel: 'Adding Liquid Volume (mL)',
        topicLabel: 'Wand Potion Mix',
        inputType: 'numpad',
        fluencySeconds: 20,
        prompt: 'Aria pours both glowing potion beakers into one magic flask. How many <strong>milliliters (mL)</strong> in all?',
        promptText: `Add two potion beakers: ${a} mL + ${b} mL.`,
        stageHTML: `
          <div class="vol-goal-banner">🧪 Combine both Sea Force potions (${a} mL + ${b} mL)!</div>
          ${buildBeakerPairSVG({
            left: { capacityMl: 500, fillMl: a, title: 'Beaker 1', liquidColor: 'teal' },
            right: { capacityMl: 500, fillMl: b, title: 'Beaker 2', liquidColor: 'gold' }
          })}
          ${buildAnswerBarHTML({ label: 'Total Potion =', unit: 'mL' })}
        `,
        answer: total,
        helperText: `Add the hundreds first, then the tens/ones: ${a} + ${b}!`,
        mistakeSummary: `${a} mL + ${b} mL`,
        explanationHTML: `
          <strong>${a} mL + ${b} mL = ${total} mL</strong> of sparkling wand potion!
        `
      };
    }

    // Fill remaining mL to reach 500 mL or 1 Liter (1,000 mL)
    const isOneLiter = Math.random() < 0.65;
    const cap = isOneLiter ? 1000 : 500;
    const fill = isOneLiter
      ? pick([250, 350, 400, 450, 550, 600, 650, 750, 800, 850])
      : pick([150, 200, 250, 300, 350, 400]);
    const needed = cap - fill;
    const targetText = isOneLiter ? '1 Liter (1,000 mL)' : '500 mL';

    return {
      dedupeKey: `pb_fill_${cap}_${fill}`,
      domainId: 'potion-beakers',
      skillKey: 'vol_liquid_fill',
      skillLabel: 'Filling to 500 mL or 1 Liter',
      topicLabel: isOneLiter ? 'Fill 1-Liter Flask' : 'Fill 500-mL Flask',
      inputType: 'numpad',
      fluencySeconds: 22,
      prompt: `This magic flask holds <strong>${targetText}</strong> and has <strong>${fill} mL</strong> inside. How many MORE mL are needed to fill it?`,
      promptText: `Flask holds ${targetText} and currently has ${fill} mL. How many more mL to fill it?`,
      stageHTML: `
        <div class="vol-goal-banner">🧪 Remember: 1 Liter = 1,000 mL • Fill from ${fill} mL up to ${cap === 1000 ? '1,000' : cap} mL!</div>
        ${buildPotionBeakerSVG({ capacityMl: cap, fillMl: fill, title: `Goal: ${targetText}`, liquidColor: isOneLiter ? 'sky' : 'rose' })}
        ${buildAnswerBarHTML({ label: 'More Needed =', unit: 'mL' })}
      `,
      answer: needed,
      helperText: `Subtract ${cap} − ${fill}, or count up from ${fill} to ${cap}!`,
      mistakeSummary: `Fill from ${fill} mL to ${cap} mL`,
      explanationHTML: `
        <strong>${cap === 1000 ? '1,000' : cap} mL − ${fill} mL = ${needed} mL</strong> needed to fill the flask!
      `
    };
  }

  // 6C: Liter & Milliliter Choice Comparison (22%)
  const scenarios = [
    () => {
      const extra = pick([150, 250, 350, 400]);
      const ans = `1 L + ${extra} mL`;
      const lower1 = `${950} mL`;
      const lower2 = `${1000 + extra - 100} mL`;
      const lower3 = `${800} mL`;
      return {
        key: `1l_${extra}`,
        prompt: 'Which potion measurement holds the <strong>MOST liquid</strong>? (Remember: 1 L = 1,000 mL!)',
        fillMl: 1000,
        cap: 1000,
        title: '1 L = 1,000 mL',
        ans,
        opts: shuffle([ans, lower1, lower2, lower3]),
        exp: `<strong>1 L + ${extra} mL = ${1000 + extra} mL</strong>, which is more than ${lower2}, ${lower1}, and ${lower3}!`
      };
    },
    () => {
      const mL = pick([1200, 1350, 1500, 1750]);
      const ans = `${mL} mL`;
      return {
        key: `ml_${mL}`,
        prompt: 'Which potion bottle holds <strong>MORE than 1 Liter (1,000 mL)</strong>?',
        fillMl: 800,
        cap: 1000,
        title: '1 L = 1,000 mL',
        ans,
        opts: shuffle([ans, '950 mL', '750 mL', '1,000 mL (exact)']),
        exp: `Since <strong>1 Liter = 1,000 mL</strong>, only <strong>${mL} mL</strong> is strictly greater than 1,000 mL!`
      };
    }
  ];
  const sc = pick(scenarios)();

  return {
    dedupeKey: `pb_choice_${sc.key}`,
    domainId: 'potion-beakers',
    skillKey: 'vol_liquid_compare',
    skillLabel: 'Comparing Liters & Milliliters',
    topicLabel: 'Liters & Milliliters',
    inputType: 'choice',
    fluencySeconds: 20,
    prompt: sc.prompt,
    promptText: sc.prompt.replace(/<[^>]*>/g, ''),
    stageHTML: `
      <div class="vol-goal-banner">🧪 Benchmark: 1 Liter (1 L) = 1,000 milliliters (mL)!</div>
      ${buildPotionBeakerSVG({ capacityMl: sc.cap, fillMl: sc.fillMl, title: sc.title, liquidColor: 'teal', showTopValue: false })}
    `,
    choices: sc.opts.map(lbl => ({ id: lbl, label: lbl })),
    answer: sc.ans,
    helperText: 'Convert Liters into milliliters first: 1 L = 1,000 mL!',
    mistakeSummary: `Liters & mL choice (${sc.ans})`,
    explanationHTML: sc.exp
  };
}
