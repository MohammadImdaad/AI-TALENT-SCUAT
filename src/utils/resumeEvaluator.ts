import { AIAnalysisDetails, ScoringWeights, CandidateRecommendation } from '../types';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  skills: 50,
  experience: 30,
  suitability: 20
};

/**
 * Computes overall weighted score in code (not in the model):
 * overall_score = round(0.5*skills_score + 0.3*experience_score + 0.2*suitability_score)
 * Using custom job weights if provided (normalized to sum to 1.0)
 */
export function computeOverallScore(
  skillsScore: number,
  experienceScore: number,
  suitabilityScore: number,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): number {
  const sScore = Math.max(0, Math.min(100, Math.round(skillsScore)));
  const eScore = Math.max(0, Math.min(100, Math.round(experienceScore)));
  const uScore = Math.max(0, Math.min(100, Math.round(suitabilityScore)));

  const totalWeight = (weights.skills || 0) + (weights.experience || 0) + (weights.suitability || 0);
  const safeTotal = totalWeight > 0 ? totalWeight : 100;

  const wSkills = (weights.skills || 0) / safeTotal;
  const wExp = (weights.experience || 0) / safeTotal;
  const wSuit = (weights.suitability || 0) / safeTotal;

  const calculated = Math.round(wSkills * sScore + wExp * eScore + wSuit * uScore);
  return Math.max(0, Math.min(100, calculated));
}

/**
 * Generates actionable, constructive resume improvement tips based on missing skills and gaps.
 */
export function generateImprovementTips(
  missingSkills: string[] = [],
  gaps: string[] = [],
  requiredSkills: string[] = []
): string[] {
  const tips: string[] = [];

  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 3).join(', ');
    tips.push(
      `Add explicit project bullets or certifications demonstrating hands-on experience with ${topMissing}.`
    );
  }

  if (gaps.length > 0) {
    for (const gap of gaps.slice(0, 2)) {
      if (gap && gap.toLowerCase() !== 'not found' && gap.toLowerCase() !== 'none') {
        tips.push(`Address identified gap: ${gap.replace(/[.]+$/, '')} by quantifying project outcomes and production deliverables.`);
      }
    }
  }

  if (tips.length === 0 && requiredSkills.length > 0) {
    tips.push(
      `Highlight architecture leadership and quantitative metrics (e.g., latency, throughput, scale) for ${requiredSkills.slice(0, 2).join(' and ')}.`
    );
  }

  tips.push(
    `Align section headings with industry standards (Work Experience, Technical Skills, Education) to maximize automated ATS parsing precision.`
  );

  return tips.slice(0, 4);
}

/**
 * Sanitizes and validates the raw JSON response from Gemini or mock generators
 */
export function sanitizeAnalysisResponse(
  raw: any,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  requiredSkills: string[] = []
): AIAnalysisDetails {
  if (!raw || typeof raw !== 'object') {
    return createMockAIAnalysis('Software Engineer', requiredSkills, weights);
  }

  const candidate_name = typeof raw.candidate_name === 'string' && raw.candidate_name.trim().length > 0
    ? raw.candidate_name.trim()
    : 'Not found';

  const email = typeof raw.email === 'string' && raw.email.trim().length > 0
    ? raw.email.trim()
    : 'Not found';

  const phone = typeof raw.phone === 'string' && raw.phone.trim().length > 0
    ? raw.phone.trim()
    : 'Not found';

  const total_years_experience = typeof raw.total_years_experience === 'number' && !isNaN(raw.total_years_experience)
    ? Math.max(0, Math.min(40, Math.round(raw.total_years_experience)))
    : 4;

  const education = typeof raw.education === 'string' && raw.education.trim().length > 0
    ? raw.education.trim()
    : 'Not found';

  const matched_skills: string[] = Array.isArray(raw.matched_skills)
    ? raw.matched_skills.map((s: any) => String(s).trim()).filter(Boolean)
    : [];

  const missing_skills: string[] = Array.isArray(raw.missing_skills)
    ? raw.missing_skills.map((s: any) => String(s).trim()).filter(Boolean)
    : [];

  const skills_score = typeof raw.skills_score === 'number'
    ? Math.max(0, Math.min(100, Math.round(raw.skills_score)))
    : matched_skills.length > 0 ? 80 : 15;

  const experience_score = typeof raw.experience_score === 'number'
    ? Math.max(0, Math.min(100, Math.round(raw.experience_score)))
    : 75;

  const suitability_score = typeof raw.suitability_score === 'number'
    ? Math.max(0, Math.min(100, Math.round(raw.suitability_score)))
    : 80;

  const strengths: string[] = Array.isArray(raw.strengths)
    ? raw.strengths.slice(0, 3).map((s: any) => String(s).trim()).filter(Boolean)
    : ['Demonstrated technical proficiency'];

  const gaps: string[] = Array.isArray(raw.gaps)
    ? raw.gaps.slice(0, 3).map((s: any) => String(s).trim()).filter(Boolean)
    : ['Specific cloud ecosystem certifications not explicitly listed'];

  const validRecs: CandidateRecommendation[] = ['Strong Match', 'Good Match', 'Partial Match', 'Not a Match'];
  const recommendation: CandidateRecommendation = validRecs.includes(raw.recommendation)
    ? raw.recommendation
    : skills_score >= 80 ? 'Strong Match' : skills_score >= 60 ? 'Good Match' : 'Partial Match';

  const summary = typeof raw.summary === 'string' && raw.summary.trim().length > 0
    ? raw.summary.trim().split(/\s+/).slice(0, 50).join(' ')
    : 'Candidate demonstrates verified technical foundations aligning with core requisition requirements.';

  const overall_score = computeOverallScore(skills_score, experience_score, suitability_score, weights);
  const improvement_tips = generateImprovementTips(missing_skills, gaps, requiredSkills);

  return {
    candidate_name,
    email,
    phone,
    total_years_experience,
    education,
    matched_skills,
    missing_skills,
    skills_score,
    experience_score,
    suitability_score,
    strengths,
    gaps,
    recommendation,
    summary,
    overall_score,
    improvement_tips
  };
}

/**
 * Deterministic baseline / mock analysis used when Gemini API key is unset or in test mocks
 */
export function createMockAIAnalysis(
  jobTitle: string,
  requiredSkills: string[] = [],
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  coverNote?: string
): AIAnalysisDetails {
  const normUser = ['react', 'typescript', 'node.js', 'python', 'sql', 'postgresql', 'fastapi', 'docker', 'tailwindcss'];
  const matched_skills: string[] = [];
  const missing_skills: string[] = [];

  for (const skill of requiredSkills) {
    const clean = skill.trim();
    if (normUser.some(u => clean.toLowerCase().includes(u) || u.includes(clean.toLowerCase()))) {
      matched_skills.push(clean);
    } else {
      missing_skills.push(clean);
    }
  }

  // Strict rule: if candidate matches none of required skills, score below 20 on skills
  let skills_score = 15;
  if (matched_skills.length > 0) {
    const ratio = matched_skills.length / Math.max(1, requiredSkills.length);
    skills_score = Math.min(96, Math.max(45, Math.round(50 + ratio * 45)));
  }

  const experience_score = 82;
  const suitability_score = 85;

  const recommendation: CandidateRecommendation = 
    skills_score >= 85 ? 'Strong Match' :
    skills_score >= 70 ? 'Good Match' :
    skills_score >= 50 ? 'Partial Match' : 'Not a Match';

  const strengths = [
    `Strong verified hands-on background in ${matched_skills.slice(0, 2).join(' and ') || 'software engineering'}.`,
    'Proven track record with distributed modern application architectures.',
    'Clear technical communication and commitment to production-grade quality.'
  ];

  const gaps = missing_skills.length > 0
    ? [
        `Lacks documented enterprise production experience in ${missing_skills[0]}.`,
        ...(missing_skills[1] ? [`No explicit mention of ${missing_skills[1]} toolchain in resume text.`] : [])
      ]
    : ['No major architectural gaps identified for this role requisition.'];

  const summary = `Candidate demonstrates a ${recommendation.toLowerCase()} for the ${jobTitle} requisition with solid alignment across ${matched_skills.slice(0, 3).join(', ')}.`;

  const overall_score = computeOverallScore(skills_score, experience_score, suitability_score, weights);
  const improvement_tips = generateImprovementTips(missing_skills, gaps, requiredSkills);

  return {
    candidate_name: 'Elena Rostova',
    email: 'elena.rostova@devmail.io',
    phone: '+1 (555) 382-9401',
    total_years_experience: 6,
    education: 'B.S. in Computer Science',
    matched_skills,
    missing_skills,
    skills_score,
    experience_score,
    suitability_score,
    strengths,
    gaps,
    recommendation,
    summary,
    overall_score,
    improvement_tips
  };
}

/**
 * Generic retry executor with exponential backoff (e.g. 1s, 2s, 4s)
 */
export async function executeWithRetry<T>(
  action: (attemptNumber: number) => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await action(attempt);
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1); // 1000ms, 2000ms, 4000ms
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
