export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  createdAt: string;
}

export interface ScoringWeights {
  skills: number;       // default 50
  experience: number;   // default 30
  suitability: number;  // default 20
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  department: string;
  type: string;
  experienceLevel?: string;
  salary: string;
  description: string;
  requirements?: string[];
  skills: string[];
  scoringWeights?: ScoringWeights;
  closingDate?: string;
  recruiterId: string;
  recruiterName: string;
  applicantCount: number;
  status: 'open' | 'closed';
  createdAt: string;
}

export type CandidateRecommendation = 'Strong Match' | 'Good Match' | 'Partial Match' | 'Not a Match';

export interface AIAnalysisDetails {
  candidate_name: string;
  email: string;
  phone: string;
  total_years_experience: number;
  education: string;
  matched_skills: string[];
  missing_skills: string[];
  skills_score: number;
  experience_score: number;
  suitability_score: number;
  strengths: string[];
  gaps: string[];
  recommendation: CandidateRecommendation;
  summary: string;
  overall_score: number;
  improvement_tips: string[];
}

export interface ApplicationNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  userId?: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  resumeFileName: string;
  resumeUrl?: string;
  coverNote?: string;
  aiScore: number;
  aiSummary: string;
  matchedSkills: string[];
  missingSkills: string[];
  experienceYears?: number;
  analysis?: AIAnalysisDetails;
  notes?: ApplicationNote[];
  status: 'Analyzing' | 'Submitted' | 'Under review' | 'Shortlisted' | 'Rejected' | 'applied' | 'reviewing' | 'shortlisted' | 'rejected';
  createdAt: string;
  appliedAt?: string;
}
