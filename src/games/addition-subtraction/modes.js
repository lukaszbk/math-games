export const MODES = [
  {
    id: 'partners10',
    title: 'Teen Numbers & Friends of 10',
    shortTitle: '10s & Teens',
    icon: '🔟',
    iconBg: '#FEF3C7',
    desc: 'Build teen numbers as 10 and some more, master Friends of 10, and jump smoothly to and from 10!',
    vocab: ['10 + ones', 'make 10', 'teen numbers']
  },
  {
    id: 'make10add',
    title: 'Make a Ten to Add',
    shortTitle: 'Make 10 to Add',
    icon: '🌟',
    iconBg: '#DCFCE7',
    desc: 'Slide counters and split numbers to make 10 first (9 + 3 = 10 + 2 = 12) on sums up to 18!',
    vocab: ['make a 10', 'break apart', '10 + leftover']
  },
  {
    id: 'make10sub',
    title: 'Use a Ten to Subtract',
    shortTitle: 'Use 10 to Subtract',
    icon: '🐸',
    iconBg: '#E0F2FE',
    desc: 'Hop down to 10 first, then subtract the rest (15 − 7 → 15 − 5 = 10, 10 − 2 = 8)!',
    vocab: ['get to 10', 'number path', 'two-step']
  },
  {
    id: 'doubles20',
    title: 'Doubles & Near-Doubles',
    shortTitle: 'Doubles to 20',
    icon: '👯',
    iconBg: '#FCE7F3',
    desc: 'Master big doubles up to 10 + 10 = 20 and use doubles + 1 for facts like 7 + 8!',
    vocab: ['doubles', 'doubles + 1', 'up to 20']
  },
  {
    id: 'within10',
    title: 'Fluency Within 10',
    shortTitle: 'Within 10',
    icon: '🐶',
    iconBg: '#CCFBF1',
    desc: 'Practice adding, subtracting, and missing parts within 10 with ten-frames, paths, and Dog Man stories!',
    vocab: ['plus (+)', 'minus (−)', 'bonds to 10']
  },
  {
    id: 'factfamilies',
    title: 'Fact Families & Balance',
    shortTitle: 'Fact Families',
    icon: '⚖️',
    iconBg: '#FFEDD5',
    desc: 'Connect addition and subtraction (8 + ? = 14) and balance both sides of the = sign!',
    vocab: ['fact family', 'missing part', 'balance']
  }
];

export const MIX_META = {
  id: 'mix',
  title: 'Supa Buddies Daily Mix',
  shortTitle: 'Daily Mix',
  icon: '🐾',
  iconBg: '#DCFCE7',
  bannerTitle: '🐾 Supa Buddies Daily Mix (All 6 Skills)',
  bannerDesc: '10 cozy, untimed puzzles mixing Make-a-Ten Addition, Use-a-Ten Subtraction, Teens & 10s, Within 10, Doubles, and Fact Families! Earn a <strong>+1 Courage Bonus Star</strong> for 8+ first-try answers!'
};

export const ALL_MODE_IDS = ['mix', 'partners10', 'make10add', 'make10sub', 'doubles20', 'within10', 'factfamilies'];
export const ALL_MODES_META = [MIX_META, ...MODES];
