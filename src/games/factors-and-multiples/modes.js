export const MODES = [
  {
    id: 'leftovers',
    title: 'Division & Leftovers',
    shortTitle: 'Division & Leftovers',
    icon: '💎',
    iconBg: '#E0F2FE',
    desc: 'Solve quotients & remainders, test divisibility, and master dividend, divisor, quotient, and remainder.',
    vocab: ['dividend', 'divisor', 'quotient', 'remainder', 'divisible']
  },
  {
    id: 'factors',
    title: 'Factors & Factor Pairs',
    shortTitle: 'Factors & Factor Pairs',
    icon: '🌈',
    iconBg: '#FEF3C7',
    desc: 'Complete factor pairs up to 100, hunt down every factor of a number, and spot impostors!',
    vocab: ['factor', 'factor pair', '1–100']
  },
  {
    id: 'multiples',
    title: 'Multiples & Patterns',
    shortTitle: 'Multiples & Patterns',
    icon: '🚀',
    iconBg: '#CCFBF1',
    desc: 'Follow skip-count trails, find bounded multiples, and discover how multiples of 4 & 8 connect.',
    vocab: ['multiple', 'skip-counting', 'patterns']
  },
  {
    id: 'primes',
    title: 'Primes, Composites & Squares',
    shortTitle: 'Primes & Squares',
    icon: '✨',
    iconBg: '#FCE7F3',
    desc: 'Classify numbers 1–100, uncover square numbers, and complete visual prime factorization trees!',
    vocab: ['prime', 'composite', 'square number', 'factor tree']
  },
  {
    id: 'gcflcm',
    title: 'GCF & LCM Arena',
    shortTitle: 'GCF & LCM',
    icon: '🏆',
    iconBg: '#FFEDD5',
    desc: 'Find the Greatest Common Factor (up to 100), Least Common Multiple (up to 12), & solve dragon stories!',
    vocab: ['GCF', 'LCM', 'word problems']
  },
  {
    id: 'mystery',
    title: 'Mystery Number (1–100)',
    shortTitle: 'Mystery Number',
    icon: '🔍',
    iconBg: '#EDE9FE',
    desc: 'Crack 3–4 number clues about factors, multiples, squares, primes, and leftovers to catch the suspect!',
    vocab: ['clues', 'number sense', '1–100 sieve']
  }
];

export const MIX_META = {
  id: 'mix',
  title: 'Jade Mountain Daily Mix',
  shortTitle: 'Daily Mix',
  icon: '⛰️',
  iconBg: '#CCFBF1',
  bannerTitle: '⛰️ Jade Mountain Daily Mix (All 6 Skills)',
  bannerDesc: '10 brisk XtraMath-style puzzles mixing Leftovers, Factor Pairs, Multiples, Primes & Squares, GCF/LCM, and Mystery Numbers! Earn a <strong>+1 Courage Bonus Star</strong> for 8+ first-try answers!'
};

export const ALL_MODE_IDS = ['mix', 'leftovers', 'factors', 'multiples', 'primes', 'gcflcm', 'mystery'];
export const ALL_MODES_META = [MIX_META, ...MODES];
