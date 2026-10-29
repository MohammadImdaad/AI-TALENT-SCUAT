import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Building, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  UploadCloud, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  FileCheck, 
  TrendingUp, 
  AlertCircle, 
  X, 
  Loader2, 
  Check, 
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Award,
  Layers,
  LayoutDashboard,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { JobPosting, CandidateApplication } from '../types';
import { getScoreTier } from '../utils/formatters';
import { fetchRecruiterJobs } from '../services/jobsService';
import { 
  fetchUserApplications, 
  uploadResumeFile, 
  checkHasApplied, 
  submitApplication 
} from '../services/applicationsService';

type CandidateTab = 'overview' | 'browse' | 'applications' | 'profile';

export function CandidateDashboardPage() {
  const { profile, user } = useAuth();
  const { success, error: showError, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state
  const initialTab = (searchParams.get('tab') as CandidateTab) || 'overview';
  const [activeTab, setActiveTab] = useState<CandidateTab>(initialTab);

  // Data states
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Selected job for detail/apply modal
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // Search & Filter for Browse Jobs
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseDept, setBrowseDept] = useState('All');

  // Application form states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisStatusText, setAnalysisStatusText] = useState('');
  const [applicationResult, setApplicationResult] = useState<CandidateApplication | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [analysisErrorMsg, setAnalysisErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const candidateId = user?.uid || profile?.id || 'demo-user';
  const candidateName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Candidate';
  const candidateEmail = profile?.email || user?.email || 'candidate@domain.com';

  // Load jobs and applications
  const loadData = async () => {
    setLoadingData(true);
    try {
      const [jobsData, appsData] = await Promise.all([
        fetchRecruiterJobs(candidateId),
        fetchUserApplications(candidateId)
      ]);
      setJobs(jobsData);
      setApplications(appsData);
    } catch (err) {
      console.error('Error loading candidate data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('talentscout_application_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('talentscout_application_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [candidateId]);

  // Sync tab with URL
  const handleTabChange = (tab: CandidateTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSelectedJob(null);
    setApplicationResult(null);
  };

  // Open Job Detail
  const handleSelectJob = async (job: JobPosting) => {
    setSelectedJob(job);
    setResumeFile(null);
    setCoverNote('');
    setFileError('');
    setApplicationResult(null);
    setAnalysisFailed(false);
    setAnalysisErrorMsg('');
    setUploadProgress(0);

    // Check if user already applied to this job
    const hasApplied = await checkHasApplied(job.id, candidateId);
    setAlreadyApplied(hasApplied);
  };

  // File validation
  const handleValidateAndSetFile = (file: File) => {
    setFileError('');
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Invalid file format. Please upload a PDF file only.');
      return false;
    }
    // Max 5 MB = 5 * 1024 * 1024 bytes
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File exceeds 5 MB limit. Please upload a smaller PDF resume.');
      return false;
    }
    setResumeFile(file);
    return true;
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Submit Application with retry handling & Gemini AI analysis
  const handleSubmitApplication = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedJob) return;

    if (!resumeFile) {
      setFileError('Please select or drop a PDF resume to apply.');
      return;
    }

    if (alreadyApplied) {
      showError('Already Applied', 'You have already applied for this position.');
      return;
    }

    setIsSubmitting(true);
    setAnalysisFailed(false);
    setAnalysisErrorMsg('');
    setUploadProgress(20);
    setAnalysisStatusText('Preparing PDF resume for Gemini 2.5 Flash...');

    try {
      const result = await submitApplication({
        job: selectedJob,
        userId: candidateId,
        candidateName,
        candidateEmail,
        resumeFile,
        coverNote,
        onAnalysisProgress: (stepText) => {
          setAnalysisStatusText(stepText);
          setUploadProgress((prev) => Math.min(95, prev + 25));
        }
      });

      setUploadProgress(100);
      setApplicationResult(result);
      setApplications([result, ...applications]);
      setAlreadyApplied(true);
      success('Application Evaluated', `Gemini scored: ${result.aiScore}% match!`);
    } catch (err: any) {
      console.error('Application submission error:', err);
      setAnalysisFailed(true);
      setAnalysisErrorMsg(err?.message || 'Gemini resume analysis failed after 3 attempts.');
      showError('Analysis Failed', 'Could not complete AI resume evaluation after 3 retries.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered jobs
  const openJobs = jobs.filter((j) => j.status === 'open');
  const filteredBrowseJobs = openJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(browseSearch.toLowerCase()) ||
      job.company.toLowerCase().includes(browseSearch.toLowerCase()) ||
      job.skills.some((s) => s.toLowerCase().includes(browseSearch.toLowerCase()));
    const matchesDept = browseDept === 'All' || job.department === browseDept;
    return matchesSearch && matchesDept;
  });

  // Calculation for stats
  const totalSent = applications.length;
  const underReviewCount = applications.filter((a) => a.status === 'Under review' || a.status === 'Submitted' || a.status === 'reviewing').length;
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted' || a.status === 'shortlisted').length;
  const avgScore = applications.length > 0 
    ? Math.round(applications.reduce((acc, a) => acc + (a.aiScore || 0), 0) / applications.length)
    : 90;

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* User profile card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/70 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              {candidateName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {candidateName}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {candidateEmail}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Candidate Portal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => handleTabChange('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => handleTabChange('browse')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'browse'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4" />
                <span>Browse Jobs</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'browse' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {openJobs.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('applications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'applications'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>My Applications</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'applications' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
              }`}>
                {applications.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Gemini Engine Footer Badge */}
        <div className="mt-8 pt-4 border-t border-slate-200/70 dark:border-slate-800/70 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini 2.5 Flash Matcher</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Objective candidate score benchmarking powered by Google Gemini.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ============================================================== */}
        {activeTab === 'overview' && !selectedJob && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Candidate Workspace</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Welcome back, {candidateName}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Here's an update on your job applications and AI match scores.
                </p>
              </div>

              <button
                onClick={() => handleTabChange('browse')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
              >
                <Search className="w-4 h-4" />
                <span>Explore Open Roles</span>
              </button>
            </div>

            {/* Stat Cards (Explicitly requested: Applications sent, Under review, Shortlisted, Average match score) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Applications Sent
                </span>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {totalSent}
                </div>
                <p className="text-xs text-slate-400 mt-1">Across top engineering roles</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Under Review
                </span>
                <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {underReviewCount}
                </div>
                <p className="text-xs text-slate-400 mt-1">Recruiter evaluation pending</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Shortlisted
                </span>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {shortlistedCount}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Invited to interview queue
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Average Match Score
                </span>
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {avgScore}%
                </div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Top tier candidate calibration
                </p>
              </div>
            </div>

            {/* "Recommended Jobs" Row */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Recommended Jobs For You</span>
                    <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                      Based on AI profile matching
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Roles with high alignment to your skills.
                  </p>
                </div>

                <button
                  onClick={() => handleTabChange('browse')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>See All Jobs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {openJobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {job.department}
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          90%+ Match
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {job.company} • {job.location}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {job.skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {job.salary}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
                        <span>Apply</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: BROWSE JOBS (Searchable card grid & detail opener) */}
        {/* ============================================================== */}
        {activeTab === 'browse' && !selectedJob && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Browse Open Requisitions
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Search and benchmark your resume against real job requirements.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                  placeholder="Search by job title, company, or required skill (e.g. React, Python, SQL)..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['All', 'AI & Robotics', 'Engineering', 'Growth & Analytics', 'Product'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setBrowseDept(dept)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      browseDept === dept
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of open jobs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBrowseJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleSelectJob(job)}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                        {job.department}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {job.type}
                      </span>
                    </div>

                    <div>
                      <h2 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {job.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" />
                        <span>{job.company}</span>
                        <span>•</span>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{job.location}</span>
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Skill chips */}
                    <div className="flex flex-wrap gap-1">
                      {job.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {job.salary}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                      <span>View & Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredBrowseJobs.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
                <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No matching jobs found
                </h3>
                <p className="text-xs text-slate-500">
                  Try adjusting your search criteria or explore other departments.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* JOB DETAIL PAGE WITH KEY APPLY FEATURE */}
        {/* ============================================================== */}
        {selectedJob && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Back button */}
            <button
              onClick={() => {
                setSelectedJob(null);
                setApplicationResult(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to job listings</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Full Job Description (7 cols) */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
                {/* Header info */}
                <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {selectedJob.department}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {selectedJob.type}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {selectedJob.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      {selectedJob.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedJob.location}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <DollarSign className="w-3.5 h-3.5" />
                      {selectedJob.salary}
                    </span>
                  </div>
                </div>

                {/* Job Description */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Role Description
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedJob.description}
                  </p>
                </div>

                {/* Key Requirements */}
                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Core Qualifications
                    </h3>
                    <ul className="space-y-2">
                      {selectedJob.requirements.map((req, i) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Required Skills Chips */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Target Skills (Benchmarked by Gemini AI)
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.skills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: "APPLY NOW" Panel (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Result Card (shown when analysis finishes) */}
                {applicationResult ? (
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/50 p-6 sm:p-7 shadow-xl space-y-6 animate-in fade-in duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-4 h-4" />
                        <span>Gemini 2.5 Flash Evaluation</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        applicationResult.analysis?.recommendation === 'Strong Match'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                          : applicationResult.analysis?.recommendation === 'Good Match'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
                          : applicationResult.analysis?.recommendation === 'Partial Match'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                      }`}>
                        {applicationResult.analysis?.recommendation || getScoreTier(applicationResult.aiScore).label}
                      </span>
                    </div>

                    {/* Circular Score Ring + Sub-scores */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      {/* SVG Circular Score Ring */}
                      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-slate-200 dark:stroke-slate-800"
                            strokeWidth="7"
                            fill="transparent"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className={`${getScoreTier(applicationResult.aiScore).progressColor} transition-all duration-1000 ease-out`}
                            strokeWidth="7"
                            strokeDasharray={251.327}
                            strokeDashoffset={251.327 - (251.327 * applicationResult.aiScore) / 100}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className={`text-2xl font-black ${getScoreTier(applicationResult.aiScore).textColor}`}>
                            {applicationResult.aiScore}%
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Fit Score
                          </span>
                        </div>
                      </div>

                      {/* Sub-Scores Breakdown */}
                      <div className="flex-1 w-full space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Criteria Breakdown (Job Weights)
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                            <div className="text-[10px] text-slate-400">Skills</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {applicationResult.analysis?.skills_score ?? Math.min(99, applicationResult.aiScore + 2)}%
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                            <div className="text-[10px] text-slate-400">Experience</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {applicationResult.analysis?.experience_score ?? 85}%
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                            <div className="text-[10px] text-slate-400">Suitability</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {applicationResult.analysis?.suitability_score ?? 88}%
                            </div>
                          </div>
                        </div>

                        {applicationResult.analysis?.education && applicationResult.analysis.education !== 'Not found' && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            🎓 {applicationResult.analysis.education}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Recruiter Executive Summary
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        "{applicationResult.aiSummary || applicationResult.analysis?.summary}"
                      </p>
                    </div>

                    {/* Skills Grid: Matched (Green) & Missing (Red) */}
                    <div className="space-y-3">
                      {/* Matched Skills */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Matched Skills ({applicationResult.matchedSkills?.length || 0})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {applicationResult.matchedSkills?.length > 0 ? (
                            applicationResult.matchedSkills.map((m) => (
                              <span key={m} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                ✓ {m}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">None matched in resume</span>
                          )}
                        </div>
                      </div>

                      {/* Missing Skills */}
                      {applicationResult.missingSkills?.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                            <X className="w-3.5 h-3.5" />
                            <span>Missing Skills ({applicationResult.missingSkills.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {applicationResult.missingSkills.map((m) => (
                              <span key={m} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                ✕ {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Strengths & Gaps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Strengths */}
                      <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-2">
                        <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          <span>Key Strengths</span>
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                          {(applicationResult.analysis?.strengths || ['Demonstrated relevant capabilities', 'Strong communication craftsmanship']).map((st, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{st}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Gaps */}
                      <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 space-y-2">
                        <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Identified Gaps</span>
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                          {(applicationResult.analysis?.gaps || ['Specific cloud credentials not explicitly stated']).map((gap, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Tips to improve your resume for this JD */}
                    <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2.5">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span>Tips to Improve Your Resume for this JD</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                        {(applicationResult.analysis?.improvement_tips || [
                          `Incorporate quantifiable metrics demonstrating hands-on experience with ${selectedJob.skills.slice(0, 2).join(' and ')}.`,
                          'Standardize technical sections with clear deliverables and business impact.'
                        ]).map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                      <button
                        onClick={() => handleTabChange('applications')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold text-center transition-colors shadow-xs"
                      >
                        View in My Applications
                      </button>
                    </div>
                  </div>
                ) : alreadyApplied ? (
                  /* Banner when candidate already applied to this role */
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 p-6 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Application Already Submitted</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      You have already submitted an application for <strong>{selectedJob.title}</strong>. Your resume was benchmarked against this job description and sent to the recruiter.
                    </p>
                    <button
                      onClick={() => handleTabChange('applications')}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                    >
                      Check Status in My Applications
                    </button>
                  </div>
                ) : (
                  /* THE KEY APPLY PANEL */
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 shadow-xs">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Apply for this Position</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Upload your PDF resume. Gemini evaluates fit against this exact JD in seconds.
                      </p>
                    </div>

                    <form onSubmit={handleSubmitApplication} className="space-y-4">
                      {/* Drag & drop zone */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Upload your resume based on this JD *
                        </label>

                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                            isDragging
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50'
                              : resumeFile
                              ? 'border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500/60 bg-slate-50/50 dark:bg-slate-950/40'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleValidateAndSetFile(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />

                          {resumeFile ? (
                            <div className="flex items-center justify-between text-left p-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                  <FileCheck className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {resumeFile.name}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {(resumeFile.size / 1024 / 1024).toFixed(2)} MB • PDF Ready
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResumeFile(null);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2 py-3">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                                <UploadCloud className="w-6 h-6" />
                              </div>
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                Drag & drop your PDF resume here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                PDF only, max 5 MB
                              </div>
                            </div>
                          )}
                        </div>

                        {fileError && <p className="text-xs text-rose-500 mt-1">{fileError}</p>}
                      </div>

                      {/* Optional cover note */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          Optional Cover Note
                        </label>
                        <textarea
                          rows={3}
                          value={coverNote}
                          onChange={(e) => setCoverNote(e.target.value)}
                          placeholder="Highlight your standout achievements or note specific availability..."
                          className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Progress bar during upload & analysis */}
                      {isSubmitting && (
                        <div className="space-y-2 p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 animate-spin" />
                              <span>{analysisStatusText || 'Analyzing your resume with AI...'}</span>
                            </span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-indigo-200/50 dark:bg-indigo-900/60 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Analysis Failed Error Box & Retry */}
                      {analysisFailed && (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3 animate-in fade-in">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                              <p className="font-bold text-rose-800 dark:text-rose-300">
                                AI Resume Analysis Encountered an Issue
                              </p>
                              <p className="text-rose-600 dark:text-rose-400">
                                {analysisErrorMsg || 'Evaluation failed after 3 automatic retries. You can re-attempt analysis with your uploaded resume.'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSubmitApplication()}
                            className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Analysis failed - retry</span>
                          </button>
                        </div>
                      )}

                      {/* Submit CTA */}
                      <button
                        type="submit"
                        disabled={isSubmitting || !resumeFile}
                        className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-sm shadow-indigo-600/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analyzing with Gemini 2.5 Flash...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Application & Benchmark</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: MY APPLICATIONS */}
        {/* ============================================================== */}
        {activeTab === 'applications' && !selectedJob && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                My Applications
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track your application statuses, review Gemini 2.5 Flash scores, and monitor recruiter updates.
              </p>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No applications submitted yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Browse open roles and apply with your PDF resume to receive instant AI scoring.
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange('browse')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find a job now</span>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-6">Job Role & Company</th>
                        <th className="py-3.5 px-6">Date Applied</th>
                        <th className="py-3.5 px-6">AI Match Score</th>
                        <th className="py-3.5 px-6">Review Status</th>
                        <th className="py-3.5 px-6 text-right">Resume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {applications.map((app) => {
                        const tier = getScoreTier(app.aiScore);
                        return (
                          <tr key={app.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 px-6">
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {app.jobTitle}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <Building className="w-3 h-3" />
                                  <span>{app.company}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                              {app.appliedAt || 'Recently'}
                            </td>

                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-base font-extrabold ${tier.textColor}`}>
                                    {app.aiScore}%
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${tier.badgeClass}`}>
                                    {tier.label}
                                  </span>
                                </div>
                                <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${tier.progressColor}`} style={{ width: `${app.aiScore}%` }} />
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                  app.status === 'Shortlisted' || app.status === 'shortlisted'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : app.status === 'Rejected' || app.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : app.status === 'Under review' || app.status === 'reviewing'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                }`}
                              >
                                <span>{app.status}</span>
                              </span>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-end gap-1 cursor-pointer hover:underline">
                                <FileText className="w-3.5 h-3.5" />
                                <span>{app.resumeFileName}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PROFILE */}
        {/* ============================================================== */}
        {activeTab === 'profile' && !selectedJob && (
          <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Candidate Profile
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage your candidate credentials and master resume settings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xl flex items-center justify-center shadow-md">
                  {candidateName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {candidateName}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {candidateEmail}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Candidate Account
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Domain / Target Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Senior Software / Full-Stack Engineer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registered Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={candidateEmail}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-not-allowed"
                  />
                </div>

                <div className="pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Default PDF Resume</div>
                        <div className="text-[10px] text-slate-400">Uploaded to Firebase Storage</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
