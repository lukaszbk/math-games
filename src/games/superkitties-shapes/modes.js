export const MODES = [
  {
    id: 'tile-rooms',
    title: 'Paw-Tile Rooms & Gardens',
    shortTitle: 'Tile Rooms',
    icon: '🐾',
    iconBg: '#FCE7F3',
    desc: 'Join Meow-Meow to count unit squares in mosaic grids, gardens with cutouts, and multiply Length × Width for Area!',
    vocab: ['area = L × W', 'square units', 'count & multiply']
  },
  {
    id: 'fence-patrol',
    title: 'Laser-Fence Perimeter',
    shortTitle: 'Perimeter',
    icon: '🚧',
    iconBg: '#FEF3C7',
    desc: 'Help Cagura wrap glowing border ribbons around rectangles, polygons, and unit-grid gardens by adding all outer sides!',
    vocab: ['perimeter = all sides', '2 × L + 2 × W', 'polygon borders']
  },
  {
    id: 'l-blueprints',
    title: 'L-Shape Hero Castles',
    shortTitle: 'L-Shapes',
    icon: '🏰',
    iconBg: '#EDE9FE',
    desc: 'Follow Cuzi’s castle scroll to split L-shapes into 2 rectangles, spot missing wall steps, and patrol 6-wall perimeters!',
    vocab: ['split into 2 rooms', 'add both areas', 'opposite walls']
  },
  {
    id: 'mystery-sides',
    title: 'Mystery Side Vaults',
    shortTitle: 'Mystery Sides',
    icon: '🔐',
    iconBg: '#E0F2FE',
    desc: 'Team up with detective Cori to crack missing sides from Area or Perimeter clues and unlock Dual Vault Locks!',
    vocab: ['missing side ?', 'divide area', 'area & perimeter']
  },
  {
    id: 'room-rivals',
    title: 'Hernado Watch',
    shortTitle: 'Hernado Watch',
    icon: '🏆',
    iconBg: '#DCFCE7',
    desc: 'Join Flame on Hernado Watch to compare rival blueprints: discover how rooms with the same Area can have different Perimeters (and vice versa)!',
    vocab: ['same area ≠ same fence', 'compare rooms', 'tap winner']
  },
  {
    id: 'shape-academy',
    title: 'Shape & Shield Academy',
    shortTitle: 'Shapes',
    icon: '💎',
    iconBg: '#FFEDD5',
    desc: 'Study crystal shields with Oliva to classify quadrilaterals by parallel sides, equal ticks, and 90° right angles!',
    vocab: ['quadrilaterals', 'parallel & right angles', 'polygons']
  }
];

export const MIX_META = {
  id: 'mix',
  title: 'SuperKitties Daily Patrol',
  shortTitle: 'Daily Patrol',
  icon: '🐱',
  iconBg: '#FCE7F3',
  bannerTitle: '🐱 SuperKitties Daily Patrol (All 6 Builder & Shape Quests)',
  bannerDesc: '10 colorful blueprint & shape challenges with Kiki, Misha, Anna, and the crew — mixing Tile Rooms, Laser-Fence Perimeter, L-Shape Castles, Mystery Vaults, Hernado Watch, and Crystal Shields! Earn <strong>1 ⭐ per first-try solve</strong> (+<strong>1 Courage Bonus Star</strong> for 8+ first-try!) — <strong>10 ⭐ unlocks a new Kitty friend!</strong> 🐾',
  ctaLabel: 'Start Daily Patrol →'
};

export const ALL_MODE_IDS = [
  'mix',
  'tile-rooms',
  'fence-patrol',
  'l-blueprints',
  'mystery-sides',
  'room-rivals',
  'shape-academy'
];

export const ALL_MODES_META = [MIX_META, ...MODES];
