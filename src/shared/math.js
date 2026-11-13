export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return (Math.abs(a) / gcd(a, b)) * Math.abs(b);
}

export function getFactors(n) {
  const small = [];
  const large = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      small.push(i);
      if (i * i !== n) large.unshift(n / i);
    }
  }
  return small.concat(large);
}

export function getFactorPairs(n) {
  const pairs = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) pairs.push([i, n / i]);
  }
  return pairs;
}

export function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

export function isSquare(n) {
  if (n < 1) return false;
  const r = Math.round(Math.sqrt(n));
  return r * r === n;
}

export function primeFactorList(n) {
  const res = [];
  let cur = n;
  for (let d = 2; d * d <= cur; d++) {
    while (cur % d === 0) {
      res.push(d);
      cur = Math.floor(cur / d);
    }
  }
  if (cur > 1) res.push(cur);
  return res;
}
