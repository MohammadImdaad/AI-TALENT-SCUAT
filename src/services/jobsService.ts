import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { JobPosting } from '../types';

const LOCAL_STORAGE_JOBS_KEY = 'talentscout_custom_jobs';

export const INITIAL_SEED_JOBS: Omit<JobPosting, 'id'>[] = [
  {
    title: 'AI Automation Specialist',
    department: 'AI & Robotics',
    location: 'Remote (US / Canada)',
    type: 'Full-time',
    experienceLevel: 'Mid-Level',
    salary: '$135,000 - $165,000',
    description: 'We are seeking an AI Automation Specialist to architect, build, and deploy automated agentic workflows using LLMs (specifically Gemini), function-calling integrations, and robotic process pipelines. You will collaborate closely with operations and software teams to automate complex business data transformations and intelligence retrieval.',
    requirements: [
      '3+ years experience with Python and LLM application frameworks',
      'Hands-on expertise deploying Gemini API or OpenAI SDK agent architectures',
      'Knowledge of workflow automation tooling (n8n, Temporal, LangChain)',
      'Strong understanding of prompt evaluation and structured JSON schemas'
    ],
    skills: ['Python', 'Gemini API', 'LangChain', 'n8n', 'FastAPI', 'Prompt Engineering'],
    scoringWeights: { skills: 50, experience: 30, suitability: 20 },
    closingDate: '2026-12-15',
    status: 'open',
    recruiterId: '',
    recruiterName: 'Recruiter Admin',
    company: 'HyperScale AI',
    applicantCount: 8,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    title: 'Full-Stack Developer',
    department: 'Engineering',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-time',
    experienceLevel: 'Senior',
    salary: '$160,000 - $190,000',
    description: 'Looking for a seasoned Full-Stack Developer to scale our core collaborative workflow suite. You will engineer resilient frontend user interfaces in React 19 and architect high-concurrency Node/PostgreSQL microservices. High attention to performance, micro-interactions, and type safety is required.',
    requirements: [
      '5+ years full-stack production software experience',
      'Mastery of modern React 19, TypeScript, and modern CSS/Tailwind',
      'Deep relational database design and PostgreSQL indexing skills',
      'Track record designing and shipping developer-facing APIs'
    ],
    skills: ['React 19', 'TypeScript', 'Node.js', 'PostgreSQL', 'TailwindCSS', 'Next.js'],
    scoringWeights: { skills: 50, experience: 30, suitability: 20 },
    closingDate: '2026-11-30',
    status: 'open',
    recruiterId: '',
    recruiterName: 'Recruiter Admin',
    company: 'HyperScale AI',
    applicantCount: 14,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    title: 'Data Analyst',
    department: 'Growth & Analytics',
    location: 'New York, NY (Hybrid)',
    type: 'Full-time',
    experienceLevel: 'Mid-Level',
    salary: '$115,000 - $140,000',
    description: 'Join our Growth & Analytics squad as a Data Analyst. You will translate complex funnel telemetry into actionable product decisions, develop automated dbt transformation pipelines in BigQuery, and build executive dashboards that drive retention and hiring efficiency.',
    requirements: [
      '3+ years in quantitative product analytics or business intelligence',
      'Advanced SQL and Python data manipulation skills (Pandas, NumPy)',
      'Experience building dashboards in Tableau, Metabase, or Looker',
      'Proven background in A/B test analysis and statistical experimentation'
    ],
    skills: ['SQL', 'Python', 'Tableau', 'dbt', 'Statistical Modeling', 'BigQuery'],
    scoringWeights: { skills: 50, experience: 30, suitability: 20 },
    closingDate: '2026-12-01',
    status: 'open',
    recruiterId: '',
    recruiterName: 'Recruiter Admin',
    company: 'HyperScale AI',
    applicantCount: 6,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  }
];

function getLocalJobs(): JobPosting[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalJobs(jobs: JobPosting[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_JOBS_KEY, JSON.stringify(jobs));
  } catch (e) {
    console.error('Could not save jobs locally:', e);
  }
}

export async function fetchRecruiterJobs(recruiterId: string, recruiterName?: string, company?: string): Promise<JobPosting[]> {
  const localCustom = getLocalJobs();
  const jobsRef = collection(db, 'jobs');
  try {
    const snap = await getDocs(jobsRef);
    const firestoreJobs: JobPosting[] = [];
    snap.forEach((d) => {
      const data = d.data();
      firestoreJobs.push({
        id: d.id,
        title: data.title || '',
        company: data.company || company || 'HyperScale AI',
        location: data.location || 'Remote',
        department: data.department || 'General',
        type: data.type || 'Full-time',
        experienceLevel: data.experienceLevel || 'Mid-Level',
        salary: data.salary || '$120,000 - $150,000',
        description: data.description || '',
        requirements: data.requirements || [],
        skills: data.skills || [],
        scoringWeights: data.scoringWeights || { skills: 50, experience: 30, suitability: 20 },
        closingDate: data.closingDate || '',
        recruiterId: data.recruiterId || recruiterId,
        recruiterName: data.recruiterName || recruiterName || 'Recruiter',
        applicantCount: typeof data.applicantCount === 'number' ? data.applicantCount : 0,
        status: data.status === 'closed' ? 'closed' : 'open',
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });

    if (firestoreJobs.length > 0) {
      // Merge any user created jobs from current session
      const existingIds = new Set(firestoreJobs.map((j) => j.id));
      const merged = [...firestoreJobs];
      for (const custom of localCustom) {
        if (!existingIds.has(custom.id)) {
          merged.unshift(custom);
        }
      }
      return merged;
    }
  } catch (err) {
    console.warn('Could not read jobs from Firestore, using seed and local custom jobs:', err);
  }

  // Base 3 sample seed jobs
  const seedJobs: JobPosting[] = INITIAL_SEED_JOBS.map((j, idx) => ({
    id: `seed-job-${idx + 1}`,
    ...j,
    recruiterId: recruiterId || 'default-recruiter',
    recruiterName: recruiterName || 'Recruiter Admin',
    company: company || 'HyperScale AI',
  }));

  const existingIds = new Set(seedJobs.map((j) => j.id));
  const merged = [...localCustom.filter((c) => !existingIds.has(c.id)), ...seedJobs];
  return merged;
}

export async function createJobPosting(jobData: Omit<JobPosting, 'id'>): Promise<JobPosting> {
  const jobsRef = collection(db, 'jobs');
  let newId = 'job_' + Math.random().toString(36).substring(2, 9);

  if (auth.currentUser) {
    try {
      const docRef = await addDoc(jobsRef, jobData);
      newId = docRef.id;
    } catch (err) {
      console.warn('Firestore addDoc fallback to local cache:', err);
    }
  }

  const createdJob: JobPosting = {
    id: newId,
    ...jobData,
  };

  const local = getLocalJobs();
  saveLocalJobs([createdJob, ...local]);
  return createdJob;
}

export async function updateJobPosting(jobId: string, updates: Partial<JobPosting>): Promise<void> {
  if (auth.currentUser && !jobId.startsWith('job_') && !jobId.startsWith('seed-job-')) {
    try {
      const jobDoc = doc(db, 'jobs', jobId);
      await updateDoc(jobDoc, updates);
    } catch (err) {
      console.warn('Firestore updateDoc fallback to local cache:', err);
    }
  }

  const local = getLocalJobs();
  const updatedLocal = local.map((j) => (j.id === jobId ? { ...j, ...updates } : j));
  saveLocalJobs(updatedLocal);
}

export async function deleteJobPosting(jobId: string): Promise<void> {
  if (auth.currentUser && !jobId.startsWith('job_') && !jobId.startsWith('seed-job-')) {
    try {
      const jobDoc = doc(db, 'jobs', jobId);
      await deleteDoc(jobDoc);
    } catch (err) {
      console.warn('Firestore deleteDoc fallback to local cache:', err);
    }
  }

  const local = getLocalJobs();
  saveLocalJobs(local.filter((j) => j.id !== jobId));
}
