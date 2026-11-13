export const GUIDE_TITLE = '📜 Starflight’s Scroll of Math Secrets';
export const GUIDE_SUBTITLE = 'Quick visual strategies and key vocabulary for Factors, Multiples, Leftovers, Primes, Squares, GCF, and LCM.';

export const GUIDE_HTML = `
  <div class="guide-grid">
    <article class="guide-card">
      <h3>💎 Division, Divisibility &amp; Leftovers</h3>
      <p style="margin:0; font-size:0.9rem; color:var(--ink-700);">Division splits a total into equal groups. Sometimes numbers divide evenly, and sometimes there are <strong>leftovers</strong>!</p>
      <div class="guide-example-box">
        <span style="color:var(--sky-600);">29</span> ÷ <span style="color:var(--jade-700);">4</span> = <span style="color:var(--gold-700);">7</span> <span style="color:var(--coral-600);">R 1</span><br/>
        <small style="font-weight:600; color:var(--ink-700);">
          • <strong>Dividend (29)</strong>: total being shared<br/>
          • <strong>Divisor (4)</strong>: size/number of groups<br/>
          • <strong>Quotient (7)</strong>: whole answer (4 × 7 = 28)<br/>
          • <strong>Remainder (1)</strong>: leftover! Always <em>smaller</em> than the divisor!
        </small>
      </div>
      <p style="margin:0; font-size:0.86rem; color:var(--ink-700);"><strong>Divisible</strong> means the remainder is <strong>0</strong>! (28 is divisible by 4, because 28 ÷ 4 = 7 R 0.)</p>
    </article>

    <article class="guide-card">
      <h3>🌈 Factors &amp; Factor Pairs (1–100)</h3>
      <p style="margin:0; font-size:0.9rem; color:var(--ink-700);">A <strong>factor pair</strong> is two whole numbers that multiply together to make a target number.</p>
      <div class="guide-example-box">
        Factor Pairs of <strong>24</strong>:<br/>
        1 × 24 &nbsp;•&nbsp; 2 × 12 &nbsp;•&nbsp; 3 × 8 &nbsp;•&nbsp; 4 × 6<br/>
        <small style="font-weight:600; color:var(--ink-700);">All 8 factors of 24: <strong>1, 2, 3, 4, 6, 8, 12, 24</strong></small>
      </div>
      <p style="margin:0; font-size:0.86rem; color:var(--ink-700);"><strong>Tip:</strong> Work up from 1! Once the pairs meet in the middle (like 4 × 6), you’ve found every single factor!</p>
    </article>

    <article class="guide-card">
      <h3>🚀 Multiples &amp; Secret Patterns</h3>
      <p style="margin:0; font-size:0.9rem; color:var(--ink-700);">A <strong>multiple</strong> is what you get when you skip-count by a number (multiply it by 1, 2, 3, 4…).</p>
      <div class="guide-example-box">
        Multiples of <strong>4</strong>: 4, <strong>8</strong>, 12, <strong>16</strong>, 20, <strong>24</strong>, 28, <strong>32</strong>…<br/>
        Multiples of <strong>8</strong>: <strong>8</strong>, <strong>16</strong>, <strong>24</strong>, <strong>32</strong>, 40…
      </div>
      <p style="margin:0; font-size:0.86rem; color:var(--ink-700);"><strong>Aha Pattern!</strong> Since 8 is a multiple of 4 (8 = 2 × 4), <em>every</em> multiple of 8 is automatically a multiple of 4 too!</p>
    </article>

    <article class="guide-card">
      <h3>✨ Prime, Composite &amp; Square Numbers</h3>
      <div class="guide-example-box" style="margin-top:4px;">
        • <strong>Prime Number</strong>: Exactly <strong>2 factors</strong> (1 and itself).<br/>
        &nbsp;&nbsp;<em>Examples:</em> 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37… (<strong>2</strong> is the ONLY even prime!)<br/>
        • <strong>Composite Number</strong>: <strong>3 or more</strong> factors (4, 6, 8, 9, 15, 51 = 3×17).<br/>
        • <strong>The Number 1</strong>: Only ONE factor (1), so 1 is <strong>neither</strong> prime nor composite!<br/>
        • <strong>Square Numbers</strong>: Make a square array! (1, 4, 9, 16, 25, 36, 49, 64, 81, 100). Square numbers always have an <strong>ODD number of factors</strong>!
      </div>
    </article>

    <article class="guide-card full-span">
      <h3>🏆 Greatest Common Factor (GCF) vs. Least Common Multiple (LCM)</h3>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-top:8px;">
        <div class="guide-example-box" style="margin:0;">
          <strong style="color:var(--jade-700);">GCF (Greatest Common Factor)</strong><br/>
          The <strong>largest factor</strong> that two numbers share.<br/>
          • Factors of 18: 1, 2, 3, <strong>6</strong>, 9, 18<br/>
          • Factors of 24: 1, 2, 3, 4, <strong>6</strong>, 8, 12, 24<br/>
          → Shared factors: 1, 2, 3, 6 → <strong>GCF = 6</strong>!
        </div>
        <div class="guide-example-box" style="margin:0;">
          <strong style="color:var(--gold-700);">LCM (Least Common Multiple)</strong><br/>
          The <strong>smallest positive multiple</strong> that two numbers share.<br/>
          • Multiples of 6: 6, 12, 18, <strong>24</strong>, 30…<br/>
          • Multiples of 8: 8, 16, <strong>24</strong>, 32, 40…<br/>
          → First shared multiple → <strong>LCM = 24</strong>!
        </div>
      </div>
    </article>
  </div>
`;
