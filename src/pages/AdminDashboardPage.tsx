import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  BarChart3, 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Building, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  X, 
  ChevronRight, 
  ExternalLink,
  Tag,
  AlertTriangle,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  LayoutDashboard,
  Check,
  RefreshCw,
  TrendingUp,
  FileText,
  Scale,
  Award
} from 'lucide-react';
import { ApplicantsBarChart } from '../components/analytics/ApplicantsBarChart';
import { RecommendationDonutChart } from '../components/analytics/RecommendationDonutChart';
import { CandidateDetailDrawer } from '../components/candidates/CandidateDetailDrawer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { JobPosting, CandidateApplication, ScoringWeights } from '../types';
import { getScoreTier } from '../utils/formatters';
import { 
  fetchRecruiterJobs, 
  createJobPosting, 
  updateJobPosting, 
  deleteJobPosting 
} from '../services/jobsService';
import { 
  fetchAllApplications, 
  updateApplicationStatus 
} from '../services/applicationsService';

type AdminTab = 'overview' | 'jobs' | 'candidates' | 'settings';

export function AdminDashboardPage() {
  const { profile, user } = useAuth();
  const { success, error: showError, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab state
  const initialTab = (searchParams.get('tab') as AdminTab) || 'jobs';
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Jobs state
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobSearch, setJobSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  // Job Drawer / Modal state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [savingJob, setSavingJob] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDepartment, setFormDepartment] = useState('Engineering');
  const [formLocation, setFormLocation] = useState('Remote (US)');
  const [formType, setFormType] = useState('Full-time');
  const [formExperienceLevel, setFormExperienceLevel] = useState('Mid-Level');
  const [formSalary, setFormSalary] = useState('$130,000 - $160,000');
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [formWeights, setFormWeights] = useState<ScoringWeights>({ skills: 50, experience: 30, suitability: 20 });
  const [skillInput, setSkillInput] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formClosingDate, setFormClosingDate] = useState('2026-12-31');
  const [formStatus, setFormStatus] = useState<'open' | 'closed'>('open');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Delete Confirmation Modal
  const [deleteModalJob, setDeleteModalJob] = useState<JobPosting | null>(null);
  const [deletingJob, setDeletingJob] = useState(false);

  // Candidates view state
  const navigate = useNavigate();
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [candidateList, setCandidateList] = useState<any[]>([]);
  const [rawApplications, setRawApplications] = useState<CandidateApplication[]>([]);
  const [drawerCandidate, setDrawerCandidate] = useState<CandidateApplication | null>(null);

  // Load jobs and candidate applications
  const loadData = async () => {
    setLoadingJobs(true);
    try {
      const [jobsData, appsData] = await Promise.all([
        fetchRecruiterJobs(
          user?.uid || 'default-recruiter',
          profile?.name || user?.displayName || 'Recruiter Admin',
          profile?.company || 'HyperScale AI'
        ),
        fetchAllApplications()
      ]);

      setRawApplications(appsData);

      const formattedCandidates = appsData.map((app) => ({
        id: app.id,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        name: app.candidateName,
        email: app.candidateEmail || 'candidate@talentscout.ai',
        phone: app.analysis?.phone || '+1 (555) 000-0000',
        education: app.analysis?.education || 'Degree in relevant field',
        score: app.aiScore,
        experience: `${app.experienceYears || app.analysis?.total_years_experience || 4} years exp`,
        status: app.status.toLowerCase(),
        resumeName: app.resumeFileName || 'Resume.pdf',
        summary: app.aiSummary || app.analysis?.summary,
        matchedSkills: app.matchedSkills || app.analysis?.matched_skills || [],
        missingSkills: app.missingSkills || app.analysis?.missing_skills || [],
        analysis: app.analysis,
        appliedAt: app.appliedAt || 'Recently'
      }));
      setCandidateList(formattedCandidates);

      // Compute applicant counts per job
      const countsByJob: Record<string, number> = {};
      for (const app of appsData) {
        countsByJob[app.jobId] = (countsByJob[app.jobId] || 0) + 1;
        countsByJob[app.jobTitle.toLowerCase()] = (countsByJob[app.jobTitle.toLowerCase()] || 0) + 1;
      }

      const updatedJobs = jobsData.map((j) => {
        const count = countsByJob[j.id] || countsByJob[j.title.toLowerCase()] || j.applicantCount || 0;
        return {
          ...j,
          applicantCount: count
        };
      });

      setJobs(updatedJobs);
    } catch (err) {
      console.error('Failed to load jobs and candidates:', err);
      showError('Error', 'Could not load data from database.');
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  // Sync tab with URL search params
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Open Create Job Drawer
  const handleOpenCreateDrawer = () => {
    setEditingJob(null);
    setFormTitle('');
    setFormDepartment('Engineering');
    setFormLocation('Remote (US)');
    setFormType('Full-time');
    setFormExperienceLevel('Mid-Level');
    setFormSalary('$130,000 - $160,000');
    setFormSkills(['TypeScript', 'React', 'Node.js']);
    setFormWeights({ skills: 50, experience: 30, suitability: 20 });
    setFormDescription(
      'We are looking for a high-performing professional to join our team. You will lead key technical initiatives, collaborate cross-functionally, and deliver mission-critical software features.'
    );
    setFormClosingDate('2026-12-31');
    setFormStatus('open');
    setFormErrors({});
    setDrawerOpen(true);
  };

  // Open Edit Job Drawer
  const handleOpenEditDrawer = (job: JobPosting) => {
    setEditingJob(job);
    setFormTitle(job.title);
    setFormDepartment(job.department);
    setFormLocation(job.location);
    setFormType(job.type);
    setFormExperienceLevel(job.experienceLevel || 'Mid-Level');
    setFormSalary(job.salary);
    setFormSkills(job.skills || []);
    setFormWeights(job.scoringWeights || { skills: 50, experience: 30, suitability: 20 });
    setFormDescription(job.description);
    setFormClosingDate(job.closingDate || '2026-12-31');
    setFormStatus(job.status);
    setFormErrors({});
    setDrawerOpen(true);
  };

  // Add skill tag
  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (!formSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setFormSkills([...formSkills, trimmed]);
    }
    setSkillInput('');
    if (formErrors.skills) {
      setFormErrors((prev) => ({ ...prev, skills: '' }));
    }
  };

  // Remove skill tag
  const handleRemoveSkill = (skillToRemove: string) => {
    setFormSkills(formSkills.filter((s) => s !== skillToRemove));
  };

  // Validate Job Form
  const validateJobForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formTitle.trim()) errors.title = 'Job title is required';
    if (!formDepartment.trim()) errors.department = 'Department is required';
    if (!formLocation.trim()) errors.location = 'Location is required';
    if (!formSalary.trim()) errors.salary = 'Salary range is required';
    if (!formDescription.trim()) errors.description = 'Job description is required';
    if (formSkills.length === 0) errors.skills = 'Please add at least one required skill tag';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Job to Firestore
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateJobForm()) return;

    setSavingJob(true);
    try {
      const jobPayload = {
        title: formTitle.trim(),
        department: formDepartment.trim(),
        location: formLocation.trim(),
        type: formType,
        experienceLevel: formExperienceLevel,
        salary: formSalary.trim(),
        skills: formSkills,
        scoringWeights: formWeights,
        description: formDescription.trim(),
        closingDate: formClosingDate,
        status: formStatus,
        recruiterId: user?.uid || 'recruiter',
        recruiterName: profile?.name || user?.displayName || 'Recruiter Admin',
        company: profile?.company || 'HyperScale AI',
        applicantCount: editingJob ? editingJob.applicantCount : 0,
        createdAt: editingJob ? editingJob.createdAt : new Date().toISOString(),
      };

      if (editingJob) {
        await updateJobPosting(editingJob.id, jobPayload);
        setJobs((prev) =>
          prev.map((j) => (j.id === editingJob.id ? { ...j, ...jobPayload } : j))
        );
        success('Job Updated', `Successfully updated "${formTitle}"`);
      } else {
        const created = await createJobPosting(jobPayload);
        setJobs([created, ...jobs]);
        success('Job Created', `"${formTitle}" is now live on TalentScout`);
      }

      setDrawerOpen(false);
    } catch (err) {
      console.error('Error saving job:', err);
      showError('Save Failed', 'Unable to save job to Firestore. Please try again.');
    } finally {
      setSavingJob(false);
    }
  };

  // Toggle Open / Closed status
  const handleToggleStatus = async (job: JobPosting) => {
    const nextStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      await updateJobPosting(job.id, { status: nextStatus });
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))
      );
      success(
        nextStatus === 'open' ? 'Job Reopened' : 'Job Closed',
        `"${job.title}" status set to ${nextStatus}.`
      );
    } catch (err) {
      showError('Update Failed', 'Could not update job status.');
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteModalJob) return;
    setDeletingJob(true);
    try {
      await deleteJobPosting(deleteModalJob.id);
      setJobs((prev) => prev.filter((j) => j.id !== deleteModalJob.id));
      success('Job Deleted', `"${deleteModalJob.title}" has been deleted.`);
      setDeleteModalJob(null);
    } catch (err) {
      showError('Delete Failed', 'Could not delete job.');
    } finally {
      setDeletingJob(false);
    }
  };

  // Candidate Actions
  const handleCandidateStatus = async (candId: string, candName: string, newStatus: 'shortlisted' | 'rejected') => {
    const formattedStatus = newStatus === 'shortlisted' ? 'Shortlisted' : 'Rejected';
    setCandidateList((prev) =>
      prev.map((c) => (c.id === candId ? { ...c, status: newStatus } : c))
    );
    try {
      await updateApplicationStatus(candId, formattedStatus);
    } catch (e) {
      console.warn('Update candidate status notice:', e);
    }
    if (newStatus === 'shortlisted') {
      success('Candidate Shortlisted', `${candName} moved to interview pipeline.`);
    } else {
      info('Candidate Rejected', `${candName} marked as rejected.`);
    }
  };

  // Filtered jobs table
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.department.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.location.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.skills.some((s) => s.toLowerCase().includes(jobSearch.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered candidate list
  const filteredCandidates = candidateList.filter((c) => {
    if (selectedJobFilter === 'all') return true;
    return c.jobTitle.toLowerCase().includes(selectedJobFilter.toLowerCase()) || c.jobId === selectedJobFilter;
  });

  // Derived metrics
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0) || rawApplications.length;
  const openJobsCount = jobs.filter((j) => j.status === 'open').length;
  const avgMatchScore = rawApplications.length
    ? Math.round(rawApplications.reduce((sum, a) => sum + a.aiScore, 0) / rawApplications.length)
    : 88;
  const shortlistedCount = rawApplications.filter(
    (a) => a.status.toLowerCase() === 'shortlisted'
  ).length;
  const topCandidatesThisWeek = [...rawApplications].sort((a, b) => b.aiScore - a.aiScore).slice(0, 5);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Recruiter / Organization identity card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/70 dark:border-slate-800/70 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {profile?.company || 'HyperScale AI'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {profile?.name || user?.displayName || 'Recruiter Admin'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Recruiter Console
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
              onClick={() => handleTabChange('jobs')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'jobs'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4" />
                <span>Jobs</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'jobs' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {jobs.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('candidates')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'candidates'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Candidates</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'candidates' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
              }`}>
                {candidateList.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Quick Create CTA in Sidebar */}
          <div className="pt-2">
            <button
              onClick={handleOpenCreateDrawer}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Requisition</span>
            </button>
          </div>
        </div>

        {/* Gemini Engine Badge */}
        <div className="mt-8 pt-4 border-t border-slate-200/70 dark:border-slate-800/70 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini 2.5 Flash Connected</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Firestore rules enforced. Secure resume OCR and scoring active.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Recruitment Overview
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Real-time pipeline health, candidate throughput, and active job requisitions.
                </p>
              </div>

              <button
                onClick={handleOpenCreateDrawer}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Job</span>
              </button>
            </div>

            {/* 4 Requested KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Open Jobs
                </span>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {openJobsCount}
                </div>
                <p className="text-xs text-slate-400 mt-1">{jobs.length} total requisitions</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Applicants
                </span>
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {totalApplicants}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +18% this week
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Avg Match Score
                </span>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {avgMatchScore}%
                </div>
                <p className="text-xs text-slate-400 mt-1">Top-tier candidate calibration</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Shortlisted
                </span>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {shortlistedCount}
                </div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                  {Math.round((shortlistedCount / (rawApplications.length || 1)) * 100)}% moved to interview queue
                </p>
              </div>
            </div>

            {/* Interactive Charts: Bar chart of applicants per job & Donut chart of recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ApplicantsBarChart
                jobs={jobs}
                onSelectJob={(jobId) => navigate(`/admin/jobs/${jobId}/candidates`)}
              />

              <RecommendationDonutChart
                applications={rawApplications}
                onSelectCategory={() => handleTabChange('candidates')}
              />
            </div>

            {/* "Top candidates this week" list */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Top Candidates This Week</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Highest AI-evaluated match scores across all active requisitions
                  </p>
                </div>

                <button
                  onClick={() => handleTabChange('candidates')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>View All Candidates</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Top candidates items */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {topCandidatesThisWeek.map((cand, idx) => {
                  const rank = idx + 1;
                  const tier = getScoreTier(cand.aiScore);
                  const matched = cand.matchedSkills?.length
                    ? cand.matchedSkills
                    : (cand.analysis?.matched_skills || []);

                  return (
                    <div
                      key={cand.id}
                      onClick={() => setDrawerCandidate(cand)}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Medal Rank */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {cand.candidateName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>

                        {/* Candidate Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                              {cand.candidateName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {cand.jobTitle}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {cand.candidateEmail} • {cand.experienceYears || cand.analysis?.total_years_experience || 4} years exp
                          </p>
                        </div>
                      </div>

                      {/* Score and Skills */}
                      <div className="flex items-center gap-4 shrink-0 pl-11 sm:pl-0">
                        {/* Matched skills chips */}
                        <div className="hidden md:flex flex-wrap gap-1 max-w-[200px]">
                          {matched.slice(0, 2).map((sk) => (
                            <span
                              key={sk}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50"
                            >
                              ✓ {sk}
                            </span>
                          ))}
                        </div>

                        {/* Score Pill */}
                        <div className="text-right">
                          <div className="text-base font-black text-slate-900 dark:text-white">
                            {cand.aiScore}%
                          </div>
                          <span className={`text-[10px] font-bold ${tier.color}`}>
                            {cand.analysis?.recommendation || tier.label}
                          </span>
                        </div>

                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                          Inspect →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Jobs strip */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Requisitions Quick View
                </h2>
                <button
                  onClick={() => handleTabChange('jobs')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>View All Jobs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {jobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/admin/jobs/${job.id}/candidates`)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {job.department}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${job.status === 'open' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {job.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>{job.salary}</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {job.applicantCount || 0} applicants →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JOBS (Main Requested View) */}
        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header & Create Job Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Job Requisitions
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage active postings, benchmark requirements, and view candidate applications.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadData}
                  title="Refresh jobs from Firestore"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingJobs ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleOpenCreateDrawer}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-all active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Job</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="Search jobs by title, department, or required skill..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {(['all', 'open', 'closed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {st === 'all' ? 'All Statuses' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs Table */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              {loadingJobs ? (
                <div className="p-16 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Syncing jobs from Firestore...
                  </p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      No matching job requisitions found
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Try adjusting your search criteria or create a new job posting for this recruiter account.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreateDrawer}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create a Job Now</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-6">Job Role & Department</th>
                        <th className="py-3.5 px-6">Type & Location</th>
                        <th className="py-3.5 px-6">Required Skills</th>
                        <th className="py-3.5 px-6">Applicants</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {filteredJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Title & Department */}
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{job.title}</span>
                                {job.experienceLevel && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                                    {job.experienceLevel}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{job.department}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {job.salary}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Type & Location */}
                          <td className="py-4 px-6">
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {job.type}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </div>
                            </div>
                          </td>

                          {/* Required Skills */}
                          <td className="py-4 px-6 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {job.skills.slice(0, 3).map((skill) => (
                                <span
                                  key={skill}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 3 && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  +{job.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Applicants Count Badge (links to that job's candidate list) */}
                          <td className="py-4 px-6">
                            <Link
                              to={`/admin/jobs/${job.id}/candidates`}
                              title={`View ${job.applicantCount || 0} applicants for ${job.title}`}
                              className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 transition-all cursor-pointer"
                            >
                              <Users className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                              <span>{job.applicantCount || 0} applicants</span>
                            </Link>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                job.status === 'open'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  job.status === 'open' ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              <span className="capitalize">{job.status}</span>
                            </span>
                          </td>

                          {/* Actions: Toggle Open/Close, Edit, Delete */}
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-1 justify-end">
                              {/* Close / Reopen */}
                              <button
                                onClick={() => handleToggleStatus(job)}
                                title={job.status === 'open' ? 'Close requisition' : 'Reopen requisition'}
                                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  job.status === 'open'
                                    ? 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                }`}
                              >
                                {job.status === 'open' ? 'Close' : 'Reopen'}
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => handleOpenEditDrawer(job)}
                                title="Edit job details"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeleteModalJob(job)}
                                title="Delete job"
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CANDIDATES */}
        {activeTab === 'candidates' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Ranked Candidates
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  AI-evaluated applicants scored against target job description requirements.
                </p>
              </div>

              {/* Filter by Job Requisition */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Filter by Job:</span>
                <select
                  value={selectedJobFilter}
                  onChange={(e) => setSelectedJobFilter(e.target.value)}
                  className="text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Requisitions ({candidateList.length})</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.title}>
                      {j.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-6">Candidate & Requisition</th>
                      <th className="py-3.5 px-6">AI Fit Score</th>
                      <th className="py-3.5 px-6">Gemini Assessment</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {filteredCandidates.map((cand, idx) => {
                      const tier = getScoreTier(cand.score);
                      return (
                        <tr key={cand.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-300">
                                #{idx + 1}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{cand.name}</span>
                                  <span className="text-xs font-normal text-slate-400">({cand.experience})</span>
                                </div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                  {cand.jobTitle}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-base font-extrabold ${tier.textColor}`}>
                                  {cand.score}%
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${tier.badgeClass}`}>
                                  {tier.label}
                                </span>
                              </div>
                              <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${tier.progressColor}`} style={{ width: `${cand.score}%` }} />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 max-w-sm">
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                              {cand.summary}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {cand.matchedSkills.slice(0, 3).map((m: string) => (
                                <span key={m} className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                  ✓ {m}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-4 px-6 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold capitalize whitespace-nowrap ${
                              cand.status === 'shortlisted'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : cand.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                cand.status === 'shortlisted'
                                  ? 'bg-emerald-500'
                                  : cand.status === 'rejected'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              }`} />
                              <span>{cand.status === 'under review' ? 'Under Review' : cand.status}</span>
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  const fullApp = rawApplications.find((a) => a.id === cand.id);
                                  if (fullApp) setDrawerCandidate(fullApp);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleCandidateStatus(cand.id, cand.name, 'shortlisted')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                  cand.status === 'shortlisted'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                                }`}
                              >
                                {cand.status === 'shortlisted' ? '✓ Shortlisted' : 'Shortlist'}
                              </button>
                              <button
                                onClick={() => handleCandidateStatus(cand.id, cand.name, 'rejected')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                  cand.status === 'rejected'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50'
                                }`}
                              >
                                {cand.status === 'rejected' ? '✕ Rejected' : 'Reject'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Recruiter Settings
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure your organization details and AI evaluation parameters.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Organization Profile
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile?.company || 'HyperScale AI'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recruiter Administrator Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || 'admin@hyperscale.ai'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Gemini 2.5 Flash Model Parameters
                </h3>
                <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Objective JD Scoring Threshold: 85%</span>
                  </div>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    Candidates scoring 85%+ are automatically tagged as "Top Tier Matches".
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT JOB DRAWER (MODAL) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingJob ? 'Edit Job Requisition' : 'Create New Job Requisition'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fill in the details for Gemini AI resume parsing & candidate matching.
                </p>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close drawer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form id="job-form" onSubmit={handleSaveJob} className="p-6 space-y-5 flex-1">
              {/* Job Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  placeholder="e.g. AI Automation Specialist"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border ${
                    formErrors.title ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
                />
                {formErrors.title && <p className="text-xs text-rose-500 mt-1">{formErrors.title}</p>}
              </div>

              {/* Department & Experience Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Department *
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="AI & Robotics">AI & Robotics</option>
                    <option value="Product">Product</option>
                    <option value="Growth & Analytics">Growth & Analytics</option>
                    <option value="Design">Design</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={formExperienceLevel}
                    onChange={(e) => setFormExperienceLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Entry-Level">Entry-Level</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead / Staff">Lead / Staff</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>

              {/* Employment Type & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Employment Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => {
                      setFormLocation(e.target.value);
                      if (formErrors.location) setFormErrors((prev) => ({ ...prev, location: '' }));
                    }}
                    placeholder="e.g. San Francisco, CA (Hybrid)"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Salary Range & Closing Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Salary Range *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSalary}
                    onChange={(e) => {
                      setFormSalary(e.target.value);
                      if (formErrors.salary) setFormErrors((prev) => ({ ...prev, salary: '' }));
                    }}
                    placeholder="e.g. $135,000 - $165,000"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formErrors.salary && <p className="text-xs text-rose-500 mt-1">{formErrors.salary}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Closing Date
                  </label>
                  <input
                    type="date"
                    value={formClosingDate}
                    onChange={(e) => setFormClosingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Required Skills (Tag Input) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Required Skills (Tag Input) *
                </label>
                
                {/* Active Tags */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        aria-label={`Remove ${skill}`}
                        className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 p-0.5 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Tag Add Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(skillInput);
                      }
                    }}
                    placeholder="Type skill and press Enter (e.g. Python, React, SQL)..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill(skillInput)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    Add
                  </button>
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                  <span>Suggestions:</span>
                  {['React 19', 'TypeScript', 'Gemini API', 'Python', 'SQL', 'FastAPI', 'Docker'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer text-[10px]"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
                {formErrors.skills && <p className="text-xs text-rose-500 mt-1">{formErrors.skills}</p>}
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Job Description (Textarea) *
                </label>
                <textarea
                  required
                  rows={6}
                  value={formDescription}
                  onChange={(e) => {
                    setFormDescription(e.target.value);
                    if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  placeholder="Detail responsibilities, tech stack, and ideal candidate profile for Gemini scoring..."
                  className={`w-full p-3.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border ${
                    formErrors.description ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                  } text-slate-900 dark:text-white focus:outline-none focus:ring-2 leading-relaxed`}
                />
                {formErrors.description && <p className="text-xs text-rose-500 mt-1">{formErrors.description}</p>}
              </div>

              {/* AI Scoring Weights (Configurable per job) */}
              <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      AI Scoring Weights
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      formWeights.skills + formWeights.experience + formWeights.suitability === 100
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      Total: {formWeights.skills + formWeights.experience + formWeights.suitability}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormWeights({ skills: 50, experience: 30, suitability: 20 })}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      Reset (50/30/20)
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Configure how Gemini 2.5 Flash calculates the candidate's final ranking score:
                  <code className="ml-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                    round({formWeights.skills}%*skills + {formWeights.experience}%*exp + {formWeights.suitability}%*fit)
                  </code>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Skills Weight */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Skills Match</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{formWeights.skills}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={formWeights.skills}
                      onChange={(e) => setFormWeights((prev) => ({ ...prev, skills: parseInt(e.target.value, 10) }))}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Experience Weight */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Experience</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{formWeights.experience}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={formWeights.experience}
                      onChange={(e) => setFormWeights((prev) => ({ ...prev, experience: parseInt(e.target.value, 10) }))}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Suitability Weight */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Role Fit</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{formWeights.suitability}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={formWeights.suitability}
                      onChange={(e) => setFormWeights((prev) => ({ ...prev, suitability: parseInt(e.target.value, 10) }))}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Requisition Status */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Requisition Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormStatus('open')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                      formStatus === 'open'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Open (Accepting Resumes)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('closed')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                      formStatus === 'closed'
                        ? 'border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Closed (Paused)</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky bottom-0 flex items-center justify-end gap-3 z-10">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="job-form"
                disabled={savingJob}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition-all cursor-pointer"
              >
                {savingJob ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingJob ? 'Update Job' : 'Publish Job'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Job Requisition?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action permanently removes the job posting from Firestore.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">{deleteModalJob.title}</div>
              <div className="text-slate-500">{deleteModalJob.department} • {deleteModalJob.applicantCount || 0} applicants</div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete this job posting? Candidates will no longer be able to submit applications for this role.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalJob(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingJob}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-60"
              >
                {deletingJob ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Requisition</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Drawer */}
      <CandidateDetailDrawer
        application={drawerCandidate}
        onClose={() => setDrawerCandidate(null)}
        onStatusChange={(appId, newStatus) => {
          if (drawerCandidate && drawerCandidate.id === appId) {
            setDrawerCandidate({
              ...drawerCandidate,
              status: newStatus
            });
          }
          loadData();
        }}
      />
    </div>
  );
}
