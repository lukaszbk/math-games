import {
  buildCubeStackSVG,
  buildPotionBeakerSVG,
  buildPrismBoxSVG,
  buildTwinBoxesSVG
} from './svg-volume.js';

export const GUIDE_TITLE = '📘 Misty, Fang & Aria’s Volume & Wand Guide';
export const GUIDE_SUBTITLE = 'Master 3D Cubic Units, Layer Cake Prisms ((L × W) × H), Twin Cat Towers, Mystery Height, and Milliliter/Liter Potions to unlock all 19 prizes and defeat the Queen Monster!';

export const GUIDE_HTML = `
  <div class="guide-grid">
    <article class="guide-card">
      <h3>🧊 Cubic Units &amp; Layer Slices</h3>
      <p style="margin:0 0 8px; font-size:0.9rem; color:var(--ink-700);">
        <strong>Volume</strong> measures how many <strong>1 × 1 × 1 unit cubes</strong> fill a 3D space inside! Count 1 flat layer first (<strong>Length × Width</strong>), then multiply by how many layers tall (<strong>Height</strong>).
      </p>
      <div class="vol-guide-split">
        <div class="guide-example-box vol-guide-box">
          <strong>Unit Cube Stack</strong>
          ${buildCubeStackSVG({ grid: [[2, 2], [1, 1]], compact: true })}
          <div style="font-size:0.84rem;">Back: 4 cubes + Front: 2 cubes = <strong>6 cubic units</strong></div>
        </div>
        <div class="guide-example-box vol-guide-box">
          <strong>Layer Cake ((L × W) × H)</strong>
          ${buildPrismBoxSVG({ length: 3, width: 2, height: 3, unit: 'cm', showLayerGrid: true, highlightTopLayer: true, compact: true })}
          <div style="font-size:0.84rem;">1 gold layer = 3 × 2 = 6 • 3 layers → <strong>18 cu cm</strong></div>
        </div>
      </div>
    </article>

    <article class="guide-card">
      <h3>📦 Magic Crate Formula &amp; Mystery Height</h3>
      <p style="margin:0 0 8px; font-size:0.9rem; color:var(--ink-700);">
        For any rectangular box, multiply all 3 dimensions: <strong>Volume = Length × Width × Height</strong>. Missing the height? Divide <strong>Volume ÷ (Length × Width)</strong>!
      </p>
      <div class="vol-guide-split">
        <div class="guide-example-box vol-guide-box">
          <strong>Volume = L × W × H</strong>
          ${buildPrismBoxSVG({ length: 4, width: 3, height: 2, unit: 'ft', compact: true })}
          <div style="font-size:0.84rem;">4 × 3 = 12, then 12 × 2 = <strong>24 cubic ft</strong></div>
        </div>
        <div class="guide-example-box vol-guide-box">
          <strong>Mystery Height (?)</strong>
          ${buildPrismBoxSVG({ length: 4, width: 3, height: 3, unit: 'ft', labelH: '?', centerBadge: 'Vol = 36', compact: true })}
          <div style="font-size:0.84rem;">Base = 4 × 3 = 12 → 36 ÷ 12 = <strong>3 ft</strong></div>
        </div>
      </div>
    </article>

    <article class="guide-card">
      <h3>🏰 Twin Cat Towers (Add Both Boxes!)</h3>
      <p style="margin:0 0 6px; font-size:0.9rem; color:var(--ink-700);">
        When two boxes sit joined together, use Fang’s mind power to split along the dotted seam: find <strong>Box A’s volume</strong>, find <strong>Box B’s volume</strong>, and add them!
      </p>
      <div class="guide-example-box vol-guide-box">
        ${buildTwinBoxesSVG({
          boxA: { l: 3, w: 2, h: 4 },
          boxB: { l: 2, w: 2, h: 2 },
          unit: 'cm',
          compact: true
        })}
        <div style="font-size:0.86rem;">
          Teal Box A: 3 × 2 × 4 = <strong>24</strong> &nbsp;+&nbsp; Gold Box B: 2 × 2 × 2 = <strong>8</strong> → Total = <strong>32 cubic cm</strong>!
        </div>
      </div>
    </article>

    <article class="guide-card">
      <h3>🧪 Wand Potions: Milliliters &amp; Liters</h3>
      <p style="margin:0 0 6px; font-size:0.9rem; color:var(--ink-700);">
        Liquid volume uses <strong>milliliters (mL)</strong> for small potions and <strong>Liters (L)</strong> for big Sea Force flasks. Remember the golden rule: <strong>1 Liter = 1,000 mL</strong>!
      </p>
      <div class="guide-example-box vol-guide-box">
        <div style="display:flex; align-items:center; justify-content:center; gap:14px; flex-wrap:wrap;">
          <div style="width:140px;">${buildPotionBeakerSVG({ capacityMl: 1000, fillMl: 650, title: 'Goal: 1,000 mL', liquidColor: 'sky', compact: true })}</div>
          <div style="text-align:left; font-size:0.86rem; max-width:210px;">
            • <strong>1 Liter (1 L) = 1,000 mL</strong><br/>
            • Half a liter = <strong>500 mL</strong><br/>
            • Flask has <strong>650 mL</strong> → needs 1,000 − 650 = <strong>350 mL</strong> more!
          </div>
        </div>
      </div>
    </article>

    <article class="guide-card full-span">
      <h3>🪄 How the Magic Wand &amp; Cat Story Works</h3>
      <p style="margin:0; font-size:0.9rem; color:var(--ink-700);">
        You begin with <strong>Misty</strong> and her starting power <strong>Transforming</strong>. Every <strong>10 ⭐</strong> you earn in <em>any</em> Volume quest waves the <strong>Magic Wand</strong> to unlock the next Skill, Object, or Power!
        Finish all of Misty’s crew to automatically awaken <strong>Fang</strong> + <strong>Making Things Float with Her Mind</strong>; finish Fang’s pack to automatically awaken <strong>Aria</strong> + <strong>Leader of the Sea Force</strong>; unlock all 19 prizes to proclaim <strong>queen monster defeated!!!</strong>
      </p>
    </article>
  </div>
`;
