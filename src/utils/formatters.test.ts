import test from 'node:test';
import assert from 'node:assert/strict';
import { getScoreTier, calculateSkillOverlap, formatCandidateName, getPasswordStrength } from './formatters.js';

test('getScoreTier returns exceptional for scores >= 85', () => {
  const result = getScoreTier(92);
  assert.equal(result.tier, 'exceptional');
  assert.equal(result.label, 'Top Tier Match');
});

test('getScoreTier returns strong for scores between 70 and 84', () => {
  const result = getScoreTier(75);
  assert.equal(result.tier, 'strong');
  assert.equal(result.label, 'Strong Match');
});

test('getScoreTier returns moderate for scores between 50 and 69', () => {
  const result = getScoreTier(55);
  assert.equal(result.tier, 'moderate');
});

test('getScoreTier returns low for scores below 50', () => {
  const result = getScoreTier(38);
  assert.equal(result.tier, 'low');
});

test('calculateSkillOverlap correctly classifies matched and missing skills', () => {
  const candidate = ['React', 'TypeScript', 'Node.js', 'TailwindCSS'];
  const required = ['React', 'TypeScript', 'GraphQL', 'Docker'];

  const overlap = calculateSkillOverlap(candidate, required);
  assert.deepEqual(overlap.matched, ['React', 'TypeScript']);
  assert.deepEqual(overlap.missing, ['GraphQL', 'Docker']);
  assert.equal(overlap.percentage, 50);
});

test('formatCandidateName trims and handles empty strings', () => {
  assert.equal(formatCandidateName('  Jane Doe  '), 'Jane Doe');
  assert.equal(formatCandidateName(''), 'Anonymous Candidate');
});

test('getPasswordStrength handles empty and strong passwords', () => {
  assert.equal(getPasswordStrength('').label, 'Very Weak');
  assert.equal(getPasswordStrength('simple').label, 'Weak');
  assert.equal(getPasswordStrength('password1').label, 'Fair');
  assert.equal(getPasswordStrength('Pass1234').label, 'Strong');
  assert.equal(getPasswordStrength('Pass1234!@#').label, 'Very Strong');
});

