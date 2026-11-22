/**
 * Hoard Dragon companions for Money Match: Dragon Hoard Duel.
 *
 * Portraits reuse the dragon art already shipped in the repo (the same trick
 * `hundreds-chart/companions.js` uses with the Dog Man portraits), so no new
 * binary assets are needed. Each quest type — plus the Daily Mix — hatches its
 * own three dragons, and every 10 ⭐ banked in a quest cracks one egg.
 */

const ART = './assets/factors-and-multiples/dragons';

export const COMPANIONS = [
  {
    id: '10_qibli',
    image: `${ART}/10_qibli.jpg`,
    orderNum: 1,
    modeId: 'starter',
    name: 'Qibli',
    tribe: 'SandWing',
    stars: 0,
    bio: 'Quick-witted SandWing who counts his coins faster than anyone in the desert — and always picks the bigger pile.',
    quotes: [
      'Ten matches and one of my eggs hatches — let’s go count some money!',
      'Add both sides first, THEN tap. That’s how a smart dragon shops.',
      'Owing less money is still more money. Remember that one!',
      'Ready to crack 10 comparisons together? Every quest hatches its own dragons!'
    ]
  },
  {
    id: '02_tsunami',
    image: `${ART}/02_tsunami.jpg`,
    orderNum: 2,
    modeId: 'wallets',
    name: 'Tsunami',
    tribe: 'SeaWing',
    stars: 10,
    bio: 'Fearless SeaWing princess whose undersea vault is stacked with sunken treasure bags.',
    quotes: [
      'Two piggy banks? Add them, then face the single bag!',
      '$29 + $29 is $58 — that beats $50 any tide of the day!',
      'BOOM! Splendidly counted!',
      'The deeper the vault, the bigger the numbers. Onward!'
    ]
  },
  {
    id: '37_blaze',
    image: `${ART}/37_blaze.jpg`,
    orderNum: 3,
    modeId: 'wallets',
    name: 'Blaze',
    tribe: 'SandWing',
    stars: 10,
    bio: 'Showy treasure hoarder who loves comparing her golden piles out loud for everybody to see.',
    quotes: [
      'Behold my magnificent piles! Which one is worth more, eh?',
      'Compare the TENS first — a hundred-treasure dragon always does!',
      'Glory to the bigger hoard! Correct again!'
    ]
  },
  {
    id: '09_turtle',
    image: `${ART}/09_turtle.jpg`,
    orderNum: 4,
    modeId: 'wallets',
    name: 'Turtle',
    tribe: 'SeaWing',
    stars: 10,
    bio: 'Gentle, clever SeaWing who keeps careful ledgers of every shell, coin, and favour he owes a friend.',
    quotes: [
      'No rush. Add the piggy banks slowly — the answer shows up.',
      'I write down both totals before I choose. Try it!',
      'Nice, quiet, correct maths!'
    ]
  },
  {
    id: '05_sunny',
    image: `${ART}/05_sunny.jpg`,
    orderNum: 5,
    modeId: 'bills',
    name: 'Sunny',
    tribe: 'SandWing',
    stars: 10,
    bio: 'History-loving collector who can name every bill in the kingdom and count a stack in one breath.',
    quotes: [
      'Start with the biggest bill and count up by tens!',
      'A $50 bill plus two $20s? That’s $90 of history!',
      'Quarters are just 25 pennies wearing a shiny hat.',
      'Every bill you count teaches you something new!'
    ]
  },
  {
    id: '29_sky',
    image: `${ART}/29_sky.jpg`,
    orderNum: 6,
    modeId: 'bills',
    name: 'Sky',
    tribe: 'SkyWing',
    stars: 10,
    bio: 'Peace-loving SkyWing merchant who weighs every coin twice before trading it for a good story.',
    quotes: [
      'Trade smart: count the whole stack, not just the top bill.',
      'Coins count too — don’t skip the little shiny ones!',
      'A fair count is a brave count.'
    ]
  },
  {
    id: '36_hazel',
    image: `${ART}/36_hazel.jpg`,
    orderNum: 7,
    modeId: 'bills',
    name: 'Hazel',
    tribe: 'LeafWing',
    stars: 10,
    bio: 'LeafWing herbalist whose market stall takes bills, coins, and very persuasive bargains.',
    quotes: [
      'Two dimes and a nickel? Say it slowly: 25, 30, 35 cents.',
      'Money grows like a garden — count it often!',
      'Wonderful counting, friend!'
    ]
  },
  {
    id: '08_peril',
    image: `${ART}/08_peril.jpg`,
    orderNum: 8,
    modeId: 'debt',
    name: 'Peril',
    tribe: 'SkyWing',
    stars: 10,
    bio: 'Brave SkyWing who learned that a debt is nothing to fear — you just have to compare it honestly.',
    quotes: [
      'Owing $50 beats owing $52. Closer to zero wins!',
      'Negative money is still money — you’ve totally got this.',
      'Both piles are in the red? Then pick the SMALLER debt!',
      'You faced that one head-on. Well done!'
    ]
  },
  {
    id: '39_umber',
    image: `${ART}/39_umber.jpg`,
    orderNum: 9,
    modeId: 'debt',
    name: 'Umber',
    tribe: 'MudWing',
    stars: 10,
    bio: 'Easy-going MudWing who borrows a hundred gold coins and repays every one from his mud bank.',
    quotes: [
      '−$25 + −$27 = −$52. That’s a big hole to dig!',
      'Two IOUs? Add them, then find the pile closer to $0.',
      'Slow and steady pays the debt off.'
    ]
  },
  {
    id: '24_whiteout',
    image: `${ART}/24_whiteout.jpg`,
    orderNum: 10,
    modeId: 'debt',
    name: 'Whiteout',
    tribe: 'NightWing • IceWing',
    stars: 10,
    bio: 'Ice-cold mathematician who keeps the kingdom’s money number line frozen neatly between −$100 and $100.',
    quotes: [
      'On a money line, −$10 sits to the RIGHT of −$90. Right means more!',
      'Bigger debt, smaller number. The ice never lies.',
      'Freeze, look at both totals, then strike!'
    ]
  },
  {
    id: '21_riptide',
    image: `${ART}/21_riptide.jpg`,
    orderNum: 11,
    modeId: 'plusminus',
    name: 'Riptide',
    tribe: 'SeaWing',
    stars: 10,
    bio: 'Loyal SeaWing sailor who logs every coin earned and every coin spent in his salt-stained ledger.',
    quotes: [
      'Money earned is +, money spent is −. Keep the signs straight!',
      'Add the good money first, then sail the spending in.',
      'Steady as a tide — perfect balance!'
    ]
  },
  {
    id: '15_snowfall',
    image: `${ART}/15_snowfall.jpg`,
    orderNum: 12,
    modeId: 'plusminus',
    name: 'Snowfall',
    tribe: 'IceWing',
    stars: 10,
    bio: 'Kind IceWing healer who spends her whole allowance on medicine and still ends the week ahead.',
    quotes: [
      '$60 earned and −$25 spent leaves $35 in the pouch.',
      'A negative is not a failure — it’s just money going out.',
      'Beautifully balanced!'
    ]
  },
  {
    id: '13_cricket',
    image: `${ART}/13_cricket.jpg`,
    orderNum: 13,
    modeId: 'plusminus',
    name: 'Cricket',
    tribe: 'HiveWing',
    stars: 10,
    bio: 'Busy HiveWing inventor who budgets every copper for wings, wax, and spare screws.',
    quotes: [
      'Every coin has a job. Add them all up and see who’s ahead!',
      'Parts plus parts equals the whole pocket — that’s the trick!',
      'Click, whirr — correct!'
    ]
  },
  {
    id: '03_glory',
    image: `${ART}/03_glory.jpg`,
    orderNum: 14,
    modeId: 'fairdeals',
    name: 'Glory',
    tribe: 'RainWing',
    stars: 10,
    bio: 'Sharp-tongued RainWing queen who never lets a “deal” slide without proving both sides are truly equal.',
    quotes: [
      'Equal? Prove it. Work out BOTH sides first.',
      'Two different-looking piles can be worth exactly the same.',
      'Hah! Nobody fools the queen of equals!',
      'Tap “They’re Equal!” when the totals match — no guessing!'
    ]
  },
  {
    id: '22_thorn',
    image: `${ART}/22_thorn.jpg`,
    orderNum: 15,
    modeId: 'fairdeals',
    name: 'Thorn',
    tribe: 'SandWing',
    stars: 10,
    bio: 'Tough, fair-minded queen of the Scorpion Den who settles every market argument with a scale and a shrug.',
    quotes: [
      'Fair means equal. Check both scales before you choose.',
      'If the totals match, neither side wins. Simple as that.',
      'Straight shooting — that’s the right answer.'
    ]
  },
  {
    id: '06_moonwatcher',
    image: `${ART}/06_moonwatcher.jpg`,
    orderNum: 16,
    modeId: 'fairdeals',
    name: 'Moonwatcher',
    tribe: 'NightWing',
    stars: 10,
    bio: 'Thoughtful NightWing who can nearly see which pile is bigger — but always does the maths anyway.',
    quotes: [
      'The stars hint at the answer, but the maths proves it.',
      'Equals hide in plain sight: $40 = $18 + $22.',
      'Trust the totals, not your eyes.'
    ]
  },
  {
    id: '30_cliff',
    image: `${ART}/30_cliff.jpg`,
    orderNum: 17,
    modeId: 'market',
    name: 'Cliff',
    tribe: 'SkyWing',
    stars: 10,
    bio: 'Easy-going SkyWing trader who sells 5 sacks of something at 7 gold each and never fudges a price.',
    quotes: [
      'Equal groups? Multiply! 4 gems at $6 is $24.',
      'Multiply first, then compare. Never the other way round.',
      'That, friend, is a profitable choice!'
    ]
  },
  {
    id: '11_kinkajou',
    image: `${ART}/11_kinkajou.jpg`,
    orderNum: 18,
    modeId: 'market',
    name: 'Kinkajou',
    tribe: 'RainWing',
    stars: 10,
    bio: 'Cheerful RainWing performer who runs the noisiest treasure stall at the night market.',
    quotes: [
      'Three sparkly crowns at $8? $8, $16, $24 — count with me!',
      'Money stories are just multiplication wearing a costume!',
      'Woo! Another one nailed!'
    ]
  },
  {
    id: '27_fathom',
    image: `${ART}/27_fathom.jpg`,
    orderNum: 19,
    modeId: 'market',
    name: 'Fathom',
    tribe: 'SeaWing',
    stars: 10,
    bio: 'Calm SeaWing scholar who keeps a coin-counting abacus beside his books on ancient shell money.',
    quotes: [
      'Group the coins, multiply the groups, compare the answers.',
      'A tidy row of equal groups is the fastest way through.',
      'Excellent reasoning, scholar.'
    ]
  },
  {
    id: '43_darkstalker',
    image: `${ART}/43_darkstalker.jpg`,
    orderNum: 20,
    modeId: 'mix',
    name: 'Darkstalker',
    tribe: 'NightWing • IceWing',
    stars: 10,
    bio: 'Legendary animus dragon who enchanted an entire island of gold — and still checks which pile is bigger.',
    quotes: [
      'Even an animus has to add two and two. Well… two $20s.',
      'A flawless Daily Mix? Even I didn’t see that coming.',
      'Power is nothing without place value!'
    ]
  },
  {
    id: '20_fatespeaker',
    image: `${ART}/20_fatespeaker.jpg`,
    orderNum: 21,
    modeId: 'mix',
    name: 'Fatespeaker',
    tribe: 'NightWing',
    stars: 10,
    bio: 'Vision-reading NightWing librarian who has foreseen exactly how many eggs your Daily Mix will hatch.',
    quotes: [
      'I foresee… ten more first-try matches and one new dragon!',
      'Mix all six money skills and your brain grows faster.',
      'Written in the stars: correct!'
    ]
  },
  {
    id: '25_peacemaker',
    image: `${ART}/25_peacemaker.jpg`,
    orderNum: 22,
    modeId: 'mix',
    name: 'Peacemaker',
    tribe: 'NightWing • RainWing',
    stars: 10,
    bio: 'Peace-brokering dragon who negotiates treaties between positive coins and grumpy negative coins.',
    quotes: [
      'Every coin deserves equal rights — and an equal comparison!',
      'Debt dragons and treasure dragons can both be right.',
      'Harmony, accuracy, and a hatched egg. Splendid!'
    ]
  }
];
