import test from 'node:test';
import assert from 'node:assert/strict';
import {
  randInt,
  pick,
  shuffle,
  gcd,
  lcm,
  getFactors,
  getFactorPairs,
  isPrime,
  isSquare,
  primeFactorList
} from '../src/shared/math.js';

test('gcd and lcm compute exact greatest common divisor and least common multiple', () => {
  assert.equal(gcd(12, 18), 6);
  assert.equal(gcd(8, 15), 1);
  assert.equal(gcd(48, 72), 24);
  assert.equal(lcm(4, 6), 12);
  assert.equal(lcm(6, 8), 24);
  assert.equal(lcm(7, 2), 14);
  assert.equal(lcm(0, 5), 0);
});

test('getFactors and getFactorPairs match for composites, primes, and squares', () => {
  assert.deepEqual(getFactors(1), [1]);
  assert.deepEqual(getFactors(24), [1, 2, 3, 4, 6, 8, 12, 24]);
  assert.deepEqual(getFactorPairs(24), [[1, 24], [2, 12], [3, 8], [4, 6]]);
  assert.deepEqual(getFactors(36), [1, 2, 3, 4, 6, 9, 12, 18, 36]);
  assert.deepEqual(getFactorPairs(36), [[1, 36], [2, 18], [3, 12], [4, 9], [6, 6]]);
  assert.equal(getFactors(36).length % 2, 1);
});

test('isPrime and isSquare classify edge cases accurately', () => {
  assert.equal(isPrime(1), false);
  assert.equal(isPrime(2), true);
  assert.equal(isPrime(51), false);
  assert.equal(isPrime(97), true);
  assert.equal(isSquare(0), false);
  assert.equal(isSquare(1), true);
  assert.equal(isSquare(36), true);
  assert.equal(isSquare(50), false);
  assert.equal(isSquare(100), true);
});

test('primeFactorList multiplies back to original number with prime factors', () => {
  for (const n of [2, 12, 18, 24, 36, 48, 60, 72, 75, 97]) {
    const pf = primeFactorList(n);
    assert.ok(pf.every(p => isPrime(p)), `Expected all factors of ${n} to be prime`);
    const prod = pf.reduce((a, b) => a * b, 1);
    assert.equal(prod, n);
  }
});

test('randInt, pick, and shuffle stay within bounds without mutating input', () => {
  for (let i = 0; i < 100; i++) {
    const r = randInt(3, 9);
    assert.ok(r >= 3 && r <= 9);
  }
  const src = [1, 2, 3, 4, 5];
  const sh = shuffle(src);
  assert.deepEqual(src, [1, 2, 3, 4, 5]);
  assert.deepEqual(sh.slice().sort((a, b) => a - b), src);
  assert.ok(src.includes(pick(src)));
});
