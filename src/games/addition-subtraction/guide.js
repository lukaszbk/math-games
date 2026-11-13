import {
  buildMakeTenAddBondHTML,
  buildMakeTenCounterSlideHTML,
  buildNumberPathHopsHTML,
  buildStaticTenFrameHTML,
  buildUseTenSubBondHTML
} from '../../shared/manipulatives.js';

export const GUIDE_TITLE = '📖 Li’l Petey’s Make-a-Ten Comic Guide';
export const GUIDE_SUBTITLE = 'Friendly comic pictures and mental-math tricks for 10s, teens, making 10 to add, and using 10 to subtract!';

export const GUIDE_HTML = `
  <div class="guide-grid">
    <article class="guide-card">
      <h3>🔟 Teen Numbers Are 10 and Some More</h3>
      <p style="margin:0; font-size:0.9rem; color:var(--ink-700);">Every teen number (11–19) is <strong>one full 10</strong> plus some extra ones!</p>
      <div class="guide-example-box" style="display:flex; flex-direction:column; align-items:center; gap:8px;">
        ${buildStaticTenFrameHTML({ red: 10, gold: 4, totalSlots: 20 })}
        <div><strong>14 = 10 + 4</strong> &nbsp;•&nbsp; <strong>14 − 4 = 10</strong> &nbsp;•&nbsp; <strong>14 − 10 = 4</strong></div>
      </div>
    </article>

    <article class="guide-card">
      <h3>🌟 Make a Ten to Add (9 + 3 = 12)</h3>
      <p style="margin:0; font-size:0.9rem; color:var(--ink-700);">Break the second number apart so the first number fills up <strong>10</strong>, then add the leftover!</p>
      <div class="guide-example-box" style="display:flex; flex-direction:column; align-items:center; gap:8px;">
        ${buildMakeTenCounterSlideHTML(9, 3)}
        ${buildMakeTenAddBondHTML({ a: 9, b: 3, partToTen: 1, leftoverPart: 2 })}
        <div><strong>9 + 3</strong> is the same as <strong>10 + 2 = 12</strong>!</div>
      </div>
    </article>

    <article class="guide-card">
      <h3>🐸 Use a Ten to Subtract (15 − 7 = 8)</h3>
      <p style="margin:0; font-size:0.9rem; color:var(--ink-700);">Hop back to <strong>10</strong> first by taking away the extra ones, then take away the rest!</p>
      <div class="guide-example-box" style="display:flex; flex-direction:column; align-items:center; gap:8px;">
        ${buildUseTenSubBondHTML({ teen: 15, sub: 7, partToTen: 5, leftoverPart: 2 })}
        ${buildNumberPathHopsHTML({ min: 6, max: 16, start: 15, mid: 10, end: 8 })}
        <div>Step 1: <strong>15 − 5 = 10</strong> &nbsp;→&nbsp; Step 2: <strong>10 − 2 = 8</strong>!</div>
      </div>
    </article>

    <article class="guide-card">
      <h3>👯 Doubles, Near-Doubles &amp; Fact Families</h3>
      <div class="guide-example-box" style="margin-top:4px;">
        • <strong>Doubles:</strong> 6+6=12, 7+7=14, 8+8=16, 9+9=18, 10+10=20.<br/>
        • <strong>Doubles + 1:</strong> For <strong>7 + 8</strong>, think <strong>7 + 7 = 14</strong>, plus 1 more = <strong>15</strong>!<br/>
        • <strong>Fact Family (6, 8, 14):</strong><br/>
        &nbsp;&nbsp;6 + 8 = 14 &nbsp;•&nbsp; 8 + 6 = 14 &nbsp;•&nbsp; 14 − 6 = 8 &nbsp;•&nbsp; 14 − 8 = 6
      </div>
    </article>
  </div>
`;
