import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { CandidateApplication, JobPosting, AIAnalysisDetails, ApplicationNote } from '../types';
import { 
  executeWithRetry, 
  createMockAIAnalysis, 
  sanitizeAnalysisResponse, 
  DEFAULT_SCORING_WEIGHTS 
} from '../utils/resumeEvaluator';

const LOCAL_STORAGE_APPLICATIONS_KEY = 'talentscout_candidate_applications';

export const INITIAL_SAMPLE_APPLICATIONS: CandidateApplication[] = [
  {
    id: 'cand-1',
    jobId: 'seed-job-2',
    jobTitle: 'Full-Stack Developer',
    company: 'HyperScale AI',
    candidateId: 'demo-user',
    userId: 'demo-user',
    candidateName: 'Elena Rostova',
    candidateEmail: 'elena.rostova@devmail.io',
    resumeFileName: 'Elena_Rostova_Resume_2026.pdf',
    resumeUrl: 'https://example.com/resumes/elena_rostova.pdf',
    coverNote: 'Excited about scaling React 19 architecture, micro-frontends, and high-performance distributed microservices.',
    aiScore: 94,
    aiSummary: 'Top Tier match. Candidate demonstrates deep command of React 19, TypeScript, and database optimization.',
    matchedSkills: ['React 19', 'TypeScript', 'Node.js', 'PostgreSQL', 'TailwindCSS'],
    missingSkills: ['Next.js'],
    experienceYears: 7,
    analysis: {
      candidate_name: 'Elena Rostova',
      email: 'elena.rostova@devmail.io',
      phone: '+1 (555) 234-8901',
      total_years_experience: 7,
      education: 'B.S. in Computer Science, Stanford University',
      matched_skills: ['React 19', 'TypeScript', 'Node.js', 'PostgreSQL', 'TailwindCSS'],
      missing_skills: ['Next.js'],
      skills_score: 95,
      experience_score: 96,
      suitability_score: 90,
      strengths: [
        'Extensive React 19 and modern concurrent rendering expertise',
        'Strong production PostgreSQL indexing and query optimization record',
        'Proven lead engineer background in fintech scaleups'
      ],
      gaps: [
        'Limited direct Next.js SSR deployment history mentioned in recent roles'
      ],
      recommendation: 'Strong Match',
      summary: 'Exceptional fit for Senior Full-Stack role. Deep command of modern TypeScript stack and resilient distributed backend patterns.',
      overall_score: 94,
      improvement_tips: [
        'Highlight Next.js 15 App Router architecture in your technical highlights.',
        'Add quantitative metrics on microservice latency reduction and throughput.'
      ]
    },
    status: 'Shortlisted',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    appliedAt: '2 days ago'
  },
  {
    id: 'cand-2',
    jobId: 'seed-job-1',
    jobTitle: 'AI Automation Specialist',
    company: 'HyperScale AI',
    candidateId: 'kiran-patel',
    userId: 'kiran-patel',
    candidateName: 'Kiran Patel',
    candidateEmail: 'kiran.patel@aimail.com',
    resumeFileName: 'Kiran_Patel_AI_CV.pdf',
    resumeUrl: 'https://example.com/resumes/kiran_patel.pdf',
    coverNote: 'Built production Gemini API multi-agent pipelines and LangChain automations.',
    aiScore: 92,
    aiSummary: 'Exceptional AI engineering portfolio with proven Gemini API agent orchestration and prompt tuning workflows.',
    matchedSkills: ['Python', 'Gemini API', 'LangChain', 'FastAPI', 'Prompt Engineering'],
    missingSkills: ['n8n'],
    experienceYears: 4,
    analysis: {
      candidate_name: 'Kiran Patel',
      email: 'kiran.patel@aimail.com',
      phone: '+1 (555) 890-1234',
      total_years_experience: 4,
      education: 'M.S. in Artificial Intelligence, Carnegie Mellon',
      matched_skills: ['Python', 'Gemini API', 'LangChain', 'FastAPI', 'Prompt Engineering'],
      missing_skills: ['n8n'],
      skills_score: 92,
      experience_score: 88,
      suitability_score: 95,
      strengths: [
        'Deep production experience with Gemini 2.5 Flash and multimodal agents',
        'Built resilient automated evaluation loops with LangChain',
        'Strong background in prompt tuning and function calling architectures'
      ],
      gaps: [
        'No direct experience documented with n8n visual automation toolchain'
      ],
      recommendation: 'Strong Match',
      summary: 'Outstanding AI automation candidate with hands-on generative AI orchestration and Python deployment experience.',
      overall_score: 92,
      improvement_tips: [
        'Include a brief note about workflow engines or visual orchestration experience.',
        'Mention open-source or production deployments of agentic workflows.'
      ]
    },
    status: 'Shortlisted',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    appliedAt: '1 day ago'
  },
  {
    id: 'cand-3',
    jobId: 'seed-job-2',
    jobTitle: 'Full-Stack Developer',
    company: 'HyperScale AI',
    candidateId: 'marcus-chen',
    userId: 'marcus-chen',
    candidateName: 'Marcus Chen',
    candidateEmail: 'm.chen@engdomain.com',
    resumeFileName: 'Marcus_Chen_CV.pdf',
    resumeUrl: 'https://example.com/resumes/marcus_chen.pdf',
    coverNote: 'Solid backend and full stack expertise. Solid PostgreSQL indexing and TypeScript typing discipline.',
    aiScore: 88,
    aiSummary: 'Strong backend and full stack expertise. Solid PostgreSQL indexing and TypeScript typing discipline.',
    matchedSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'TailwindCSS'],
    missingSkills: ['React 19'],
    experienceYears: 5,
    status: 'Under review',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    appliedAt: '3 days ago'
  },
  {
    id: 'cand-4',
    jobId: 'seed-job-3',
    jobTitle: 'Data Analyst',
    company: 'HyperScale AI',
    candidateId: 'sophia-laurent',
    userId: 'sophia-laurent',
    candidateName: 'Sophia Laurent',
    candidateEmail: 'sophia.laurent@analytics.org',
    resumeFileName: 'Sophia_Laurent_Analyst.pdf',
    resumeUrl: 'https://example.com/resumes/sophia_laurent.pdf',
    coverNote: 'Led retention cohort analysis and predictive modeling using BigQuery & SQL.',
    aiScore: 91,
    aiSummary: 'Deep expertise in SQL, Tableau, and BigQuery data modeling. Led retention cohort analysis at SaaS scale-up.',
    matchedSkills: ['SQL', 'Python', 'Tableau', 'BigQuery', 'Statistical Modeling'],
    missingSkills: ['dbt'],
    experienceYears: 4,
    status: 'Shortlisted',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    appliedAt: '4 days ago'
  },
  {
    id: 'cand-5',
    jobId: 'seed-job-1',
    jobTitle: 'AI Automation Specialist',
    company: 'HyperScale AI',
    candidateId: 'devon-vance',
    userId: 'devon-vance',
    candidateName: 'Devon Vance',
    candidateEmail: 'dvance@inbox.net',
    resumeFileName: 'Devon_Vance_Resume.pdf',
    resumeUrl: 'https://example.com/resumes/devon_vance.pdf',
    coverNote: 'Python developer transitioning to autonomous AI systems.',
    aiScore: 72,
    aiSummary: 'General Python developer with hobbyist AI projects. Needs deeper enterprise experience with agent orchestration.',
    matchedSkills: ['Python', 'FastAPI'],
    missingSkills: ['Gemini API', 'LangChain', 'Prompt Engineering'],
    experienceYears: 2,
    status: 'Under review',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    appliedAt: '5 days ago'
  }
];

export function getLocalApplications(): CandidateApplication[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_APPLICATIONS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_APPLICATIONS_KEY, JSON.stringify(INITIAL_SAMPLE_APPLICATIONS));
      return INITIAL_SAMPLE_APPLICATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_SAMPLE_APPLICATIONS;
  }
}

export function saveLocalApplications(apps: CandidateApplication[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_APPLICATIONS_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save applications locally:', e);
  }
}

/**
 * Converts a File to a base64 encoded string (without the data URL prefix)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result.includes('base64,')) {
        resolve(result.split('base64,')[1]);
      } else {
        resolve(result);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function uploadResumeFile(file: File, userId: string): Promise<string> {
  const fileName = `resumes/${userId || 'candidate'}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  try {
    const storageRef = ref(storage, fileName);
    // Timeout to fall back if Firebase Storage bucket is offline or pending CORS
    const uploadPromise = uploadBytes(storageRef, file).then((snap) => getDownloadURL(snap.ref));
    const timeoutPromise = new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error('Storage timeout - using instant fallback')), 2200)
    );
    const url = await Promise.race([uploadPromise, timeoutPromise]);
    return url;
  } catch (err) {
    console.warn('Firebase Storage upload notice; using local object URL fallback:', err);
    return URL.createObjectURL(file);
  }
}

export async function checkHasApplied(jobId: string, candidateId: string): Promise<boolean> {
  const localApps = getLocalApplications();
  const existsLocal = localApps.some((a) => a.jobId === jobId && (a.candidateId === candidateId || a.userId === candidateId));
  if (existsLocal) return true;

  try {
    const appsRef = collection(db, 'applications');
    const snap = await getDocs(appsRef);
    let found = false;
    snap.forEach((d) => {
      const data = d.data();
      if (data.jobId === jobId && (data.candidateId === candidateId || data.userId === candidateId)) {
        found = true;
      }
    });
    return found;
  } catch (e) {
    return false;
  }
}

export async function fetchUserApplications(candidateId: string): Promise<CandidateApplication[]> {
  const local = getLocalApplications();
  const appsRef = collection(db, 'applications');

  try {
    const snap = await getDocs(appsRef);
    const firestoreApps: CandidateApplication[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.candidateId === candidateId || data.userId === candidateId || !candidateId) {
        firestoreApps.push({
          id: d.id,
          jobId: data.jobId,
          jobTitle: data.jobTitle || 'Opportunity',
          company: data.company || 'HyperScale AI',
          candidateId: data.candidateId || candidateId,
          userId: data.userId || candidateId,
          candidateName: data.candidateName || 'Candidate',
          candidateEmail: data.candidateEmail || '',
          resumeFileName: data.resumeFileName || 'resume.pdf',
          resumeUrl: data.resumeUrl,
          coverNote: data.coverNote,
          aiScore: typeof data.aiScore === 'number' ? data.aiScore : (data.analysis?.overall_score || 85),
          aiSummary: data.aiSummary || data.analysis?.summary || 'Evaluation complete.',
          matchedSkills: data.matchedSkills || data.analysis?.matched_skills || [],
          missingSkills: data.missingSkills || data.analysis?.missing_skills || [],
          experienceYears: data.experienceYears || data.analysis?.total_years_experience || 4,
          analysis: data.analysis,
          notes: data.notes || [],
          status: data.status || 'Under review',
          createdAt: data.createdAt || new Date().toISOString(),
          appliedAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Recently'
        });
      }
    });

    if (firestoreApps.length > 0) {
      const ids = new Set(firestoreApps.map((a) => a.id));
      const merged = [...firestoreApps];
      for (const loc of local) {
        if (!ids.has(loc.id) && (loc.candidateId === candidateId || loc.userId === candidateId || !candidateId)) {
          merged.unshift(loc);
        }
      }
      return merged;
    }
  } catch (err) {
    console.warn('Firestore fetch applications notice; using local cache:', err);
  }

  const userApps = local.filter((a) => a.candidateId === candidateId || a.userId === candidateId || candidateId === 'demo-user');
  if (userApps.length > 0) return userApps;

  return local.slice(0, 2);
}

export async function fetchAllApplications(): Promise<CandidateApplication[]> {
  const local = getLocalApplications();
  const appsRef = collection(db, 'applications');

  try {
    const snap = await getDocs(appsRef);
    const firestoreApps: CandidateApplication[] = [];
    snap.forEach((d) => {
      const data = d.data();
      firestoreApps.push({
        id: d.id,
        jobId: data.jobId,
        jobTitle: data.jobTitle || 'Opportunity',
        company: data.company || 'HyperScale AI',
        candidateId: data.candidateId || 'candidate',
        userId: data.userId || 'candidate',
        candidateName: data.candidateName || 'Candidate',
        candidateEmail: data.candidateEmail || '',
        resumeFileName: data.resumeFileName || 'resume.pdf',
        resumeUrl: data.resumeUrl,
        coverNote: data.coverNote,
        aiScore: typeof data.aiScore === 'number' ? data.aiScore : (data.analysis?.overall_score || 85),
        aiSummary: data.aiSummary || data.analysis?.summary || 'Evaluation complete.',
        matchedSkills: data.matchedSkills || data.analysis?.matched_skills || [],
        missingSkills: data.missingSkills || data.analysis?.missing_skills || [],
        experienceYears: data.experienceYears || data.analysis?.total_years_experience || 4,
        analysis: data.analysis,
        notes: data.notes || [],
        status: data.status || 'Under review',
        createdAt: data.createdAt || new Date().toISOString(),
        appliedAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Recently'
      });
    });

    if (firestoreApps.length > 0) {
      const ids = new Set(firestoreApps.map((a) => a.id));
      const merged = [...firestoreApps];
      for (const loc of local) {
        if (!ids.has(loc.id)) merged.push(loc);
      }
      merged.sort((a, b) => b.aiScore - a.aiScore);
      return merged;
    }
  } catch (err) {
    console.warn('Firestore fetch all applications notice; using local list:', err);
  }

  return [...local].sort((a, b) => b.aiScore - a.aiScore);
}

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: 'Shortlisted' | 'Rejected' | 'Under review' | 'Submitted'
): Promise<void> {
  const local = getLocalApplications();
  const updated = local.map((app) => 
    app.id === applicationId ? { ...app, status: newStatus } : app
  );
  saveLocalApplications(updated);

  // Dispatch real-time reactive event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('talentscout_application_updated', {
      detail: { applicationId, status: newStatus }
    }));
  }

  try {
    const docRef = doc(db, 'applications', applicationId);
    await updateDoc(docRef, { status: newStatus });
  } catch (err) {
    console.warn('Firestore updateDoc application status notice:', err);
  }
}

export async function addApplicationNote(
  applicationId: string,
  noteText: string,
  authorName: string
): Promise<ApplicationNote> {
  const newNote: ApplicationNote = {
    id: 'note_' + Math.random().toString(36).substring(2, 9),
    text: noteText.trim(),
    author: authorName,
    createdAt: new Date().toISOString()
  };

  const local = getLocalApplications();
  let updatedNotes: ApplicationNote[] = [newNote];
  const updated = local.map((app) => {
    if (app.id === applicationId) {
      const existing = app.notes || [];
      updatedNotes = [newNote, ...existing];
      return { ...app, notes: updatedNotes };
    }
    return app;
  });
  saveLocalApplications(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('talentscout_application_note_added', {
      detail: { applicationId, note: newNote }
    }));
  }

  try {
    const docRef = doc(db, 'applications', applicationId);
    await updateDoc(docRef, { notes: updatedNotes });
  } catch (err) {
    console.warn('Firestore updateDoc notes notice:', err);
  }

  return newNote;
}

export async function bulkShortlistApplications(
  applicationIds: string[]
): Promise<number> {
  if (applicationIds.length === 0) return 0;
  const idSet = new Set(applicationIds);
  const local = getLocalApplications();
  const updated = local.map((app) => 
    idSet.has(app.id) ? { ...app, status: 'Shortlisted' as const } : app
  );
  saveLocalApplications(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('talentscout_application_updated', {
      detail: { ids: applicationIds, status: 'Shortlisted' }
    }));
  }

  for (const id of applicationIds) {
    try {
      const docRef = doc(db, 'applications', id);
      await updateDoc(docRef, { status: 'Shortlisted' });
    } catch (e) {
      // Continue with remaining
    }
  }

  return applicationIds.length;
}

/**
 * Intelligent evaluation function with 3 retries and exponential backoff
 */
export async function analyzeResumeWithAI(
  job: JobPosting,
  file: File,
  coverNote?: string
): Promise<AIAnalysisDetails> {
  const base64 = await fileToBase64(file);
  const weights = job.scoringWeights || DEFAULT_SCORING_WEIGHTS;

  return await executeWithRetry(
    async (attemptNumber) => {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64,
          jobTitle: job.title,
          jobDepartment: job.department,
          jobDescription: job.description,
          requiredSkills: job.skills || [],
          scoringWeights: weights,
          resumeFileName: file.name,
          coverNote: coverNote || ''
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status} on attempt ${attemptNumber}`);
      }

      const data = await response.json();
      return sanitizeAnalysisResponse(data, weights, job.skills || []);
    },
    3,
    1000 // 1s, 2s, 4s backoff
  );
}

export async function submitApplication(params: {
  job: JobPosting;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  resumeFile: File;
  coverNote?: string;
  onAnalysisProgress?: (step: string) => void;
}): Promise<CandidateApplication> {
  const { job, userId, candidateName, candidateEmail, resumeFile, coverNote, onAnalysisProgress } = params;

  onAnalysisProgress?.('Preparing and validating PDF resume for Gemini...');
  const resumeUrl = await uploadResumeFile(resumeFile, userId);

  onAnalysisProgress?.('Transmitting PDF to Gemini 2.5 Flash for deep resume parsing...');
  
  // Runs with 3 retries and exponential backoff
  const analysisResult = await analyzeResumeWithAI(job, resumeFile, coverNote);

  onAnalysisProgress?.('Computing weighted score and generating improvement recommendations...');
  await new Promise((r) => setTimeout(r, 400));

  const newApp: Omit<CandidateApplication, 'id'> = {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    userId: userId || 'candidate',
    candidateId: userId || 'candidate',
    candidateName,
    candidateEmail,
    resumeFileName: resumeFile.name,
    resumeUrl,
    coverNote,
    aiScore: analysisResult.overall_score,
    aiSummary: analysisResult.summary,
    matchedSkills: analysisResult.matched_skills,
    missingSkills: analysisResult.missing_skills,
    experienceYears: analysisResult.total_years_experience,
    analysis: analysisResult,
    status: 'Under review', // Set status to 'Under review' per specifications
    createdAt: new Date().toISOString(),
    appliedAt: 'Just now'
  };

  let createdId = 'app_' + Math.random().toString(36).substring(2, 9);

  try {
    const appsRef = collection(db, 'applications');
    const docRef = await addDoc(appsRef, newApp);
    createdId = docRef.id;
  } catch (err) {
    console.warn('Firestore addDoc notice, using local cache:', err);
  }

  const finalApp: CandidateApplication = {
    id: createdId,
    ...newApp
  };

  const local = getLocalApplications();
  saveLocalApplications([finalApp, ...local]);

  return finalApp;
}
