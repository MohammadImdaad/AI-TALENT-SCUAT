import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  computeOverallScore, 
  generateImprovementTips, 
  sanitizeAnalysisResponse,
  createMockAIAnalysis,
  executeWithRetry
} from './resumeEvaluator.js';

test('computeOverallScore computes round(0.5*skills + 0.3*exp + 0.2*suit) with default weights', () => {
  // 0.5*80 + 0.3*90 + 0.2*70 = 40 + 27 + 14 = 81
  const score = computeOverallScore(80, 90, 70);
  assert.equal(score, 81);

  // Bounds check
  assert.equal(computeOverallScore(100, 100, 100), 100);
  assert.equal(computeOverallScore(0, 0, 0), 0);
});

test('computeOverallScore respects configurable custom job weights', () => {
  // Custom weights: 70% skills, 20% experience, 10% suitability
  // 0.7*100 + 0.2*50 + 0.1*50 = 70 + 10 + 5 = 85
  const score = computeOverallScore(100, 50, 50, { skills: 70, experience: 20, suitability: 10 });
  assert.equal(score, 85);

  // Equal 33/33/34 weights
  const score2 = computeOverallScore(90, 90, 90, { skills: 33, experience: 33, suitability: 34 });
  assert.equal(score2, 90);
});

test('generateImprovementTips derives actionable suggestions from missing skills and gaps', () => {
  const missing = ['Kubernetes', 'GraphQL'];
  const gaps = ['No documented cloud cost optimization experience'];
  const tips = generateImprovementTips(missing, gaps, ['React', 'Node.js', 'Kubernetes']);

  assert.ok(tips.length >= 2);
  assert.ok(tips.some((t) => t.includes('Kubernetes')));
  assert.ok(tips.some((t) => t.includes('cost optimization')));
});

test('sanitizeAnalysisResponse formats raw object and computes overall_score in code', () => {
  const raw = {
    candidate_name: 'Jordan Lee',
    email: 'jordan@example.com',
    phone: '555-0192',
    total_years_experience: 5,
    education: 'B.S. Information Systems',
    matched_skills: ['TypeScript', 'Node.js'],
    missing_skills: ['Docker'],
    skills_score: 80,
    experience_score: 90,
    suitability_score: 70,
    strengths: ['Great coding craft', 'Clear communicator'],
    gaps: ['Lacks Docker orchestration'],
    recommendation: 'Strong Match',
    summary: 'A strong candidate with solid full-stack development skills.'
  };

  const sanitized = sanitizeAnalysisResponse(raw, { skills: 50, experience: 30, suitability: 20 }, ['TypeScript', 'Node.js', 'Docker']);
  assert.equal(sanitized.candidate_name, 'Jordan Lee');
  assert.equal(sanitized.overall_score, 81);
  assert.equal(sanitized.matched_skills.length, 2);
  assert.equal(sanitized.missing_skills.length, 1);
  assert.equal(sanitized.recommendation, 'Strong Match');
  assert.ok(sanitized.improvement_tips.length > 0);
});

test('sanitizeAnalysisResponse handles missing fields with "Not found" and fallbacks', () => {
  const emptyRaw = {};
  const sanitized = sanitizeAnalysisResponse(emptyRaw);
  assert.ok(sanitized.overall_score >= 0 && sanitized.overall_score <= 100);
  assert.ok(Array.isArray(sanitized.matched_skills));
  assert.ok(Array.isArray(sanitized.missing_skills));
});

test('executeWithRetry retries on transient error and succeeds', async () => {
  let attempts = 0;
  const result = await executeWithRetry(async (attempt) => {
    attempts++;
    if (attempt < 2) {
      throw new Error('Transient 503 error');
    }
    return 'success-on-attempt-' + attempt;
  }, 3, 50); // fast 50ms delay in test

  assert.equal(attempts, 2);
  assert.equal(result, 'success-on-attempt-2');
});

test('executeWithRetry throws when max retries exceeded', async () => {
  let attempts = 0;
  await assert.rejects(async () => {
    await executeWithRetry(async () => {
      attempts++;
      throw new Error('Persistent failure');
    }, 3, 20);
  }, /Persistent failure/);

  assert.equal(attempts, 3);
});
