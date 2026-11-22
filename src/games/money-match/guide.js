import {
  buildStaticDuelHTML,
  billHoard,
  cashHoard,
  debtHoard,
  groupHoard,
  moneyLabel
} from './money.js';

export const GUIDE_TITLE = '💰 Qibli’s Guide to Comparing Money';
export const GUIDE_SUBTITLE = '🎯 Goal: end with the MOST money! Add up both piles and take the bigger amount — even when the money is negative. Amounts run into the hundreds, so calculate instead of guessing.';

const LINE_STEPS = [-600, -400, -200, 0, 200, 400, 600];

function buildMoneyLineHTML() {
  const cells = LINE_STEPS.map(v => {
    const cls = v === 0 ? 'ml-cell is-zero' : (v < 0 ? 'ml-cell is-neg' : 'ml-cell is-pos');
    return `<span class="${cls}">${moneyLabel(v * 100)}</span>`;
  }).join('');
  return `
    <div class="money-line">
      <span class="ml-side">⬅️ Deeper debt</span>
      <span class="ml-cells">${cells}</span>
      <span class="ml-side">More money ➡️</span>
    </div>
  `;
}

export const GUIDE_HTML = `
  <div class="guide-grid">
    <article class="guide-card full-span">
      <h3>🥚 How a Money Match Works</h3>
      <p style="margin:0 0 6px; font-size:0.9rem; color:var(--ink-700);">
        Every puzzle shows <strong>two hoards</strong>. Work out what each side is worth, then tap the
        hoard that gives you the <strong>MOST money</strong> — that is the whole goal of the game!
        Ten first-try matches fills an egg bar <strong>10/10 ⭐</strong> and hatches a dragon.
      </p>
      <div class="guide-example-box">
        ${buildStaticDuelHTML({
    left: cashHoard([478], 'One money bag'),
    right: cashHoard([239, 245], 'Two piggy banks')
  })}
        <div style="font-size:0.88rem; text-align:center; margin-top:6px;">
          <strong>Step 1:</strong> $239 + $245 = <strong>$484</strong> &nbsp;•&nbsp;
          <strong>Step 2:</strong> $478 <strong>&lt;</strong> $484 &nbsp;•&nbsp;
          <strong>Step 3:</strong> tap the <strong>Right Hoard</strong> — most money wins, $6 more!
        </div>
      </div>
    </article>

    <article class="guide-card">
      <h3>🕳️ Money Below Zero (Debt)</h3>
      <p style="margin:0 0 6px; font-size:0.9rem; color:var(--ink-700);">
        A minus sign means the dragon <strong>owes</strong> that money. To end with the <strong>MOST
        money</strong>, take the debt <strong>closer to $0</strong> — owing less is the same as having more!
      </p>
      <div class="guide-example-box">
        ${buildStaticDuelHTML({
    left: debtHoard([300], 'One big IOU'),
    right: debtHoard([142, 165], 'Two IOU notes')
  })}
        ${buildMoneyLineHTML()}
        <div style="font-size:0.86rem; text-align:center; margin-top:6px;">
          −$142 + −$165 = <strong>−$307</strong>. On the money line <strong>−$300 sits to the right
          of −$307</strong>, so <strong>−$300 &gt; −$307</strong> — the Left Hoard leaves you with the
          <strong>most money</strong> (you owe $300 instead of $307!).
        </div>
      </div>
    </article>

    <article class="guide-card">
      <h3>⚖️ Earned Money vs Spent Money</h3>
      <p style="margin:0 0 6px; font-size:0.9rem; color:var(--ink-700);">
        Money <strong>earned is positive</strong>, money <strong>spent is negative</strong>. Add each
        side like a mini number sentence:
      </p>
      <div class="guide-example-box" style="font-size:0.9rem; text-align:center;">
        $420 + −$185 = <strong>$235</strong> &nbsp;&nbsp;vs&nbsp;&nbsp; $310 + −$95 = <strong>$215</strong><br/>
        <strong>$235 &gt; $215</strong>, so the first pocket ends with the most money — <strong>$20</strong> more.<br/>
        <small>If a side lands below $0, that dragon is in debt — that’s the smaller amount of money.</small>
      </div>
    </article>

    <article class="guide-card">
      <h3>🤝 “They’re Equal!” Is a Real Answer</h3>
      <p style="margin:0 0 6px; font-size:0.9rem; color:var(--ink-700);">
        Sometimes both hoards match exactly. Two different-looking piles can be the same money:
      </p>
      <div class="guide-example-box">
        ${buildStaticDuelHTML({
    left: cashHoard([402], 'One money bag'),
    right: cashHoard([178, 224], 'Two piggy banks')
  })}
        <div style="font-size:0.88rem; text-align:center; margin-top:6px;">
          $178 + $224 = <strong>$402</strong>, so <strong>$402 = $402</strong>.
          Tap <strong>🤝 They’re Equal!</strong>
        </div>
      </div>
    </article>

    <article class="guide-card">
      <h3>🪙 Counting Bills &amp; Coins Fast</h3>
      <p style="margin:0 0 6px; font-size:0.9rem; color:var(--ink-700);">
        Start with the <strong>biggest bill</strong>, count up by tens, and save the coins for last:
      </p>
      <div class="guide-example-box" style="display:flex; flex-direction:column; align-items:center; gap:6px;">
        ${buildStaticDuelHTML({
    left: billHoard([100, 100, 20, 5], [25, 25, 10, 5], '4 bills and 4 coins'),
    right: cashHoard([225], 'One money bag')
  })}
        <div style="font-size:0.86rem; text-align:center;">
          $100, $200, $220, $225 … then 25¢, 50¢, 60¢, 65¢ → <strong>$225.65</strong> beats
          <strong>$225.00</strong> by 65¢!
        </div>
      </div>
    </article>

    <article class="guide-card">
      <h3>🛒 Equal-Groups Money Stories</h3>
      <p style="margin:0 0 6px; font-size:0.9rem; color:var(--ink-700);">
        At the Dragon Market you get groups of the same price. <strong>Multiply first</strong>,
        then compare:
      </p>
      <div class="guide-example-box">
        ${buildStaticDuelHTML({
    left: groupHoard({ groups: 7, eachDollars: 34, caption: '💎 7 gems at $34 each' }),
    right: cashHoard([245], 'One money bag')
  })}
        <div style="font-size:0.88rem; text-align:center; margin-top:6px;">
          7 × $34 → (7 × $30 = $210) + (7 × $4 = $28) = <strong>$238</strong>, and $238
          <strong>&lt;</strong> $245 — the money bag wins, but only by <strong>$7</strong>.
        </div>
      </div>
    </article>
  </div>
`;
