/**
 * Utilities for formatting candidate scores, tiers, and compensation labels
 */

export type ScoreTier = 'exceptional' | 'strong' | 'moderate' | 'low';

export interface ScoreTierInfo {
  tier: ScoreTier;
  label: string;
  badgeClass: string;
  textColor: string;
  color: string;
  progressColor: string;
  strokeColor: string;
}

export function getScoreTier(score: number): ScoreTierInfo {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));

  if (normalized >= 85) {
    return {
      tier: 'exceptional',
      label: 'Top Tier Match',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      color: 'text-emerald-600 dark:text-emerald-400',
      progressColor: 'bg-emerald-500',
      strokeColor: '#10b981',
    };
  }

  if (normalized >= 70) {
    return {
      tier: 'strong',
      label: 'Strong Match',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      color: 'text-indigo-600 dark:text-indigo-400',
      progressColor: 'bg-indigo-600',
      strokeColor: '#4f46e5',
    };
  }

  if (normalized >= 50) {
    return {
      tier: 'moderate',
      label: 'Moderate Match',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      textColor: 'text-amber-600 dark:text-amber-400',
      color: 'text-amber-600 dark:text-amber-400',
      progressColor: 'bg-amber-500',
      strokeColor: '#f59e0b',
    };
  }

  return {
    tier: 'low',
    label: 'Needs Review',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    textColor: 'text-slate-500 dark:text-slate-400',
    color: 'text-slate-500 dark:text-slate-400',
    progressColor: 'bg-slate-400',
    strokeColor: '#94a3b8',
  };
}

export function formatCandidateName(fullName: string): string {
  if (!fullName) return 'Anonymous Candidate';
  return fullName.trim();
}

export function calculateSkillOverlap(candidateSkills: string[], requiredSkills: string[]): {
  matched: string[];
  missing: string[];
  percentage: number;
} {
  const normCand = candidateSkills.map((s) => s.toLowerCase().trim());
  const matched: string[] = [];
  const missing: string[] = [];

  requiredSkills.forEach((req) => {
    const isMatched = normCand.some((c) => c === req.toLowerCase().trim() || c.includes(req.toLowerCase().trim()));
    if (isMatched) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  });

  const percentage = requiredSkills.length > 0
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : 100;

  return { matched, missing, percentage };
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  colorClass: string;
  feedback: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Very Weak', colorClass: 'bg-slate-300 dark:bg-slate-700', feedback: 'Enter at least 8 characters' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  switch (score) {
    case 0:
    case 1:
      return { score: 1, label: 'Weak', colorClass: 'bg-rose-500', feedback: 'Add uppercase, numbers, or symbols' };
    case 2:
      return { score: 2, label: 'Fair', colorClass: 'bg-amber-500', feedback: 'Consider adding symbols & length' };
    case 3:
      return { score: 3, label: 'Strong', colorClass: 'bg-indigo-500', feedback: 'Good password security' };
    case 4:
    default:
      return { score: 4, label: 'Very Strong', colorClass: 'bg-emerald-500', feedback: 'Excellent high-entropy password' };
  }
}

