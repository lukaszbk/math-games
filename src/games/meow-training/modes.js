export const MODES = [
  {
    id: 'cube-stacks',
    title: 'Unit Cube Stacks',
    shortTitle: 'Cube Stacks',
    icon: '🧊',
    iconBg: '#D7F3F7',
    desc: 'Count 1 × 1 × 1 unit cubes in layered prism pads, staircases, and corner terraces where every block shows clearly!',
    vocab: ['unit cubes', 'cubic units', 'count layers']
  },
  {
    id: 'layer-slices',
    title: 'Layer Cake Prisms',
    shortTitle: 'Layer Slices',
    icon: '🍰',
    iconBg: '#FEF3C7',
    desc: 'Find the area of 1 base layer (Length × Width), then multiply by how many layers tall the 3D prism stacks!',
    vocab: ['Base × Height', 'layers', '(L × W) × H']
  },
  {
    id: 'box-builder',
    title: 'Magic Crate Volume',
    shortTitle: 'Magic Crates',
    icon: '📦',
    iconBg: '#DCFCE7',
    desc: 'Use Length × Width × Height on 3D isometric treasure crates and cube boxes to unlock Misty’s and Fang’s gear!',
    vocab: ['L × W × H', 'cube volume', 'cubic cm / ft']
  },
  {
    id: 'twin-towers',
    title: 'Twin Cat Towers',
    shortTitle: 'Twin Towers',
    icon: '🏰',
    iconBg: '#FFEDD5',
    desc: 'Float two joined 3D boxes side-by-side with Fang’s mind power, find each box’s volume, and add them together!',
    vocab: ['Box A + Box B', 'composite volume', 'split & add']
  },
  {
    id: 'tank-rivals',
    title: 'Sea Force Tank Duel',
    shortTitle: 'Tank Duel',
    icon: '🐠',
    iconBg: '#E0F2FE',
    desc: 'Compare two glowing crystal Sea Force tanks side-by-side and tap the tank that holds MORE volume!',
    vocab: ['compare tanks', 'more volume', 'L × W × H']
  },
  {
    id: 'potion-beakers',
    title: 'Wand Potions & Mystery Height',
    shortTitle: 'Potions & Height',
    icon: '🧪',
    iconBg: '#FCE7F3',
    desc: 'Measure glowing mL & Liter potion beakers (1 L = 1,000 mL) and crack mystery crate heights from Volume ÷ Base!',
    vocab: ['mL & Liters', '1 L = 1,000 mL', 'mystery height ?']
  }
];

export const MIX_META = {
  id: 'mix',
  title: 'Daily Meow Training Mix',
  shortTitle: 'Daily Mix',
  icon: '🪄',
  iconBg: '#D7F3F7',
  bannerTitle: '🪄 Daily Meow Training Mix (All 6 Volume Quests)',
  bannerDesc: 'Train with Misty, Fang, and Aria across 10 colorful 3D Volume & Liquid puzzles! Earn <strong>1 ⭐ per first-try solve</strong> (+<strong>1 Courage Bonus Star</strong> for 8+ first-try!) — every <strong>10 ⭐ waves the Magic Wand</strong> to unlock your next prize and defeat the Queen Monster!',
  ctaLabel: 'Start Wand Training →'
};

export const ALL_MODE_IDS = [
  'mix',
  'cube-stacks',
  'layer-slices',
  'box-builder',
  'twin-towers',
  'tank-rivals',
  'potion-beakers'
];

export const ALL_MODES_META = [MIX_META, ...MODES];
