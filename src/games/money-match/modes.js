export const MODES = [
  {
    id: 'wallets',
    title: 'Wallet Showdowns',
    shortTitle: 'Wallets',
    icon: '💵',
    iconBg: '#DCFCE7',
    desc: 'Money bags and piggy banks loaded with 3-digit amounts. Add two or three piles and take the MOST money — the totals are CLOSE, so calculate!',
    vocab: ['add then compare', '$ up to $1,000', 'close calls']
  },
  {
    id: 'bills',
    title: 'Bill & Coin Stacks',
    shortTitle: 'Bills & Coins',
    icon: '🪙',
    iconBg: '#FEF3C7',
    desc: 'Count real $1–$100 bills plus odd coins — two piles sit only a few cents apart, so count every piece to find the MOST money!',
    vocab: ['bills & coins', 'count to the cent', '$100 bills']
  },
  {
    id: 'debt',
    title: 'Debt Duel (Negative $)',
    shortTitle: 'Debt Duel',
    icon: '🕳️',
    iconBg: '#FEE2E2',
    desc: '−$462 versus −$219 + −$248! Both hoards are money owed, so owing LESS leaves you with the MOST money.',
    vocab: ['negative money', 'owing less', 'below $0']
  },
  {
    id: 'plusminus',
    title: 'Earn & Spend Mix',
    shortTitle: 'Earn & Spend',
    icon: '⚖️',
    iconBg: '#E0F2FE',
    desc: 'Up to three amounts per pocket: money earned is positive, money spent is negative. Add them up and finish with the MOST money.',
    vocab: ['positive & negative', '3-amount sums', 'below $0']
  },
  {
    id: 'fairdeals',
    title: 'Equal or Not?',
    shortTitle: 'Equal or Not',
    icon: '🤝',
    iconBg: '#EDE9FE',
    desc: 'Does 6 × $58 beat $174 + $174? Work both sides out, then choose Left, Right, or “They’re Equal!”',
    vocab: ['equal sign', '>, <, =', 'multiply first']
  },
  {
    id: 'market',
    title: 'Dragon Market Stories',
    shortTitle: 'Market Stories',
    icon: '🛒',
    iconBg: '#FFEDD5',
    desc: 'Equal-group money stories with 2-digit prices: 7 gems at $34 each versus one big pile — take the MOST money!',
    vocab: ['2-digit × 1-digit', 'equal groups', 'money words']
  }
];

export const MIX_META = {
  id: 'mix',
  title: 'Daily Hoard Mix',
  shortTitle: 'Daily Mix',
  icon: '🐉',
  iconBg: '#CCFBF1',
  bannerTitle: '🐉 Daily Hoard Mix (All 6 Money Skills)',
  bannerDesc: '🎯 Goal: end with the MOST money! 10 challenge comparisons mixing Wallets, Bills & Coins, Debt Duels, Earn & Spend, Equal-or-Not, and Market Stories — every <strong>10 first-try matches</strong> hatches a dragon egg! 🥚'
};

export const ALL_MODE_IDS = ['mix', 'wallets', 'bills', 'debt', 'plusminus', 'fairdeals', 'market'];
export const ALL_MODES_META = [MIX_META, ...MODES];
