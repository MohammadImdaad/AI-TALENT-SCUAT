import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Briefcase, 
  Search, 
  SlidersHorizontal, 
  Download, 
  Scale, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Award, 
  Filter, 
  Users, 
  Building, 
  MapPin, 
  DollarSign, 
  RefreshCw, 
  Check, 
  ChevronDown, 
  CheckSquare, 
  Square,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { JobPosting, CandidateApplication } from '../types';
import { getScoreTier } from '../utils/formatters';
import { fetchRecruiterJobs } from '../services/jobsService';
import { 
  fetchAllApplications, 
  updateApplicationStatus, 
  bulkShortlistApplications 
} from '../services/applicationsService';
import { CandidateDetailDrawer } from '../components/candidates/CandidateDetailDrawer';
import { CandidateCompareModal } from '../components/candidates/CandidateCompareModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export function JobCandidatesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { success, error: showError, info } = useToast();

  const [job, setJob] = useState<JobPosting | null>(null);
  const [candidates, setCandidates] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [minScore, setMinScore] = useState<number>(0);
  const [recommendationFilter, setRecommendationFilter] = useState<string>('all');
  const [skillSearch, setSkillSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'exp_desc' | 'name_asc'>('score_desc');

  // Selected for Compare mode (2-3 candidates)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Side Drawer for single candidate inspection
  const [activeDrawerCandidate, setActiveDrawerCandidate] = useState<CandidateApplication | null>(null);

  // Bulk Shortlist Modal / State
  const [bulkThreshold, setBulkThreshold] = useState<number>(85);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  // Load job and candidates
  const loadJobData = async () => {
    setLoading(true);
    try {
      const [jobsData, appsData] = await Promise.all([
        fetchRecruiterJobs(user?.uid || 'recruiter'),
        fetchAllApplications()
      ]);

      const matchedJob = jobsData.find((j) => j.id === id) || jobsData[0];
      setJob(matchedJob || null);

      // Filter candidates for this specific job
      const jobApplications = appsData.filter((a) => {
        if (!matchedJob) return true;
        return a.jobId === matchedJob.id || 
               a.jobTitle.toLowerCase() === matchedJob.title.toLowerCase();
      });

      setCandidates(jobApplications);
    } catch (err) {
      console.error('Failed to load job candidates:', err);
      showError('Error', 'Could not load job candidates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobData();

    // Listen for real-time updates from other tabs / components
    const handleUpdate = () => {
      loadJobData();
    };
    window.addEventListener('talentscout_application_updated', handleUpdate);
    window.addEventListener('talentscout_application_note_added', handleUpdate);

    return () => {
      window.removeEventListener('talentscout_application_updated', handleUpdate);
      window.removeEventListener('talentscout_application_note_added', handleUpdate);
    };
  }, [id, user?.uid]);

  // Update candidate status
  const handleUpdateStatus = async (appId: string, newStatus: 'Shortlisted' | 'Rejected' | 'Under review') => {
    try {
      await updateApplicationStatus(appId, newStatus);
      setCandidates((prev) =>
        prev.map((c) => (c.id === appId ? { ...c, status: newStatus } : c))
      );
      if (activeDrawerCandidate && activeDrawerCandidate.id === appId) {
        setActiveDrawerCandidate({ ...activeDrawerCandidate, status: newStatus });
      }
    } catch (err) {
      showError('Update Failed', 'Could not update status in database.');
    }
  };

  // Toggle selection for comparison
  const handleToggleSelectCandidate = (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCandidateIds.includes(candidateId)) {
      setSelectedCandidateIds(selectedCandidateIds.filter((cid) => cid !== candidateId));
    } else {
      if (selectedCandidateIds.length >= 3) {
        info('Comparison Limit', 'You can compare up to 3 candidates simultaneously.');
        return;
      }
      setSelectedCandidateIds([...selectedCandidateIds, candidateId]);
    }
  };

  // Bulk Shortlist Action
  const handleExecuteBulkShortlist = async () => {
    const eligibleIds = filteredAndSortedCandidates
      .filter((c) => c.aiScore >= bulkThreshold && c.status.toLowerCase() !== 'shortlisted')
      .map((c) => c.id);

    if (eligibleIds.length === 0) {
      info('No Eligible Candidates', `No candidates have score ≥ ${bulkThreshold}% that aren't already shortlisted.`);
      return;
    }

    setBulkRunning(true);
    try {
      const count = await bulkShortlistApplications(eligibleIds);
      setCandidates((prev) =>
        prev.map((c) => (eligibleIds.includes(c.id) ? { ...c, status: 'Shortlisted' } : c))
      );
      success('Bulk Shortlist Complete', `Shortlisted ${count} candidates with match scores ≥ ${bulkThreshold}%.`);
      setShowBulkPanel(false);
    } catch (e) {
      showError('Bulk Action Failed', 'Could not complete bulk shortlist.');
    } finally {
      setBulkRunning(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredAndSortedCandidates.length === 0) {
      info('Nothing to Export', 'There are no candidates in the current filter.');
      return;
    }

    const headers = [
      'Rank',
      'Candidate Name',
      'Email',
      'Phone',
      'Job Title',
      'Overall Fit Score',
      'Skills Score',
      'Experience Score',
      'Suitability Score',
      'Recommendation',
      'Status',
      'Matched Skills',
      'Missing Skills',
      'Years Experience',
      'Education',
      'Date Applied'
    ];

    const rows = filteredAndSortedCandidates.map((c, idx) => [
      `#${idx + 1}`,
      `"${c.candidateName.replace(/"/g, '""')}"`,
      `"${c.candidateEmail.replace(/"/g, '""')}"`,
      `"${(c.analysis?.phone || '').replace(/"/g, '""')}"`,
      `"${c.jobTitle.replace(/"/g, '""')}"`,
      `${c.aiScore}%`,
      `${c.analysis?.skills_score || 85}%`,
      `${c.analysis?.experience_score || 80}%`,
      `${c.analysis?.suitability_score || 85}%`,
      `"${c.analysis?.recommendation || getScoreTier(c.aiScore).label}"`,
      `"${c.status}"`,
      `"${(c.matchedSkills || c.analysis?.matched_skills || []).join(', ')}"`,
      `"${(c.missingSkills || c.analysis?.missing_skills || []).join(', ')}"`,
      c.experienceYears || c.analysis?.total_years_experience || 4,
      `"${(c.analysis?.education || '').replace(/"/g, '""')}"`,
      `"${c.appliedAt || 'Recently'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `${(job?.title || 'Candidates').replace(/[^a-zA-Z0-9]/g, '_')}_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', `Downloaded ${fileName}`);
  };

  // Filter and Sort Candidates
  const filteredAndSortedCandidates = candidates
    .filter((c) => {
      // Score filter
      if (c.aiScore < minScore) return false;

      // Recommendation filter
      if (recommendationFilter !== 'all') {
        const rec = c.analysis?.recommendation || getScoreTier(c.aiScore).label;
        if (rec.toLowerCase() !== recommendationFilter.toLowerCase()) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (c.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // Skill search
      if (skillSearch.trim()) {
        const query = skillSearch.toLowerCase();
        const matched = (c.matchedSkills || c.analysis?.matched_skills || []).some((s) =>
          s.toLowerCase().includes(query)
        );
        const nameMatch = c.candidateName.toLowerCase().includes(query);
        if (!matched && !nameMatch) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score_desc') return b.aiScore - a.aiScore;
      if (sortBy === 'score_asc') return a.aiScore - b.aiScore;
      if (sortBy === 'exp_desc') {
        const expA = a.experienceYears || a.analysis?.total_years_experience || 0;
        const expB = b.experienceYears || b.analysis?.total_years_experience || 0;
        return expB - expA;
      }
      if (sortBy === 'name_asc') return a.candidateName.localeCompare(b.candidateName);
      return 0;
    });

  const selectedCandidatesList = candidates.filter((c) => selectedCandidateIds.includes(c.id));

  // Compute stats for this job
  const avgScore = candidates.length
    ? Math.round(candidates.reduce((sum, c) => sum + c.aiScore, 0) / candidates.length)
    : 0;
  const shortlistedCount = candidates.filter((c) => c.status.toLowerCase() === 'shortlisted').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin?tab=jobs"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors shadow-xs"
            title="Back to Requisitions"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Link to="/admin?tab=jobs" className="hover:underline">Requisitions</Link>
              <span>/</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{job?.title || 'Job'}</span>
              <span>/</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Candidates Leaderboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {job?.title || 'Job Candidates'}
            </h1>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowBulkPanel(!showBulkPanel)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 transition-colors shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Bulk Shortlist</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={loadJobData}
            title="Refresh candidate data"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-500 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Job Requisition Overview Banner */}
      {job && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {job.department}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {job.type}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                job.status === 'open' 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-slate-100 text-slate-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'open' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="capitalize">{job.status} Requisition</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <DollarSign className="w-3.5 h-3.5" />
                {job.salary}
              </span>
            </div>

            {/* Target Skills */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                JD Skills:
              </span>
              {job.skills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-bold text-slate-400">Applicants</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {candidates.length}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-bold text-slate-400">Avg Fit Score</span>
              <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {avgScore}%
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-bold text-slate-400">Shortlisted</span>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {shortlistedCount}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-bold text-slate-400">Weights</span>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                {job.scoringWeights?.skills || 50}/{job.scoringWeights?.experience || 30}/{job.scoringWeights?.suitability || 20}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Panel (Collapsible) */}
      {showBulkPanel && (
        <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bulk Shortlist Qualified Candidates
              </h3>
            </div>
            <button
              onClick={() => setShowBulkPanel(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Automatically move all candidates scoring at or above the threshold directly into the <strong>Shortlisted</strong> interview queue.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex-1 w-full space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Minimum AI Fit Score Threshold</span>
                <span className="text-indigo-600 dark:text-indigo-400">{bulkThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="1"
                value={bulkThreshold}
                onChange={(e) => setBulkThreshold(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-xs text-slate-500">
                Eligible: <strong className="text-slate-900 dark:text-white">
                  {filteredAndSortedCandidates.filter((c) => c.aiScore >= bulkThreshold && c.status.toLowerCase() !== 'shortlisted').length}
                </strong> candidates
              </div>
              <button
                onClick={handleExecuteBulkShortlist}
                disabled={bulkRunning}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{bulkRunning ? 'Shortlisting...' : 'Shortlist Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Compare Action Bar when candidates are selected */}
      {selectedCandidateIds.length > 0 && (
        <div className="sticky top-20 z-30 p-3.5 rounded-2xl bg-indigo-900 text-white shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center">
              <Scale className="w-4 h-4 text-indigo-200" />
            </div>
            <div>
              <span className="text-xs font-bold">
                {selectedCandidateIds.length} {selectedCandidateIds.length === 1 ? 'Candidate' : 'Candidates'} Selected for Comparison
              </span>
              <p className="text-[11px] text-indigo-300">
                Select 2 or 3 candidates to compare side by side.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCandidateIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-200 hover:text-white hover:bg-indigo-800 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCompareModalOpen(true)}
              disabled={selectedCandidateIds.length < 2}
              className="px-4 py-1.5 rounded-lg bg-white text-indigo-900 hover:bg-indigo-50 disabled:opacity-50 text-xs font-extrabold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare Side-by-Side ({selectedCandidateIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Skill search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Search by skill or candidate name..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Recommendation Filter */}
          <div className="md:col-span-3">
            <select
              value={recommendationFilter}
              onChange={(e) => setRecommendationFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Recommendations</option>
              <option value="strong match">Strong Match</option>
              <option value="good match">Good Match</option>
              <option value="partial match">Partial Match</option>
              <option value="not a match">Not a Match</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="under review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Sort By Toggle */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="score_desc">Sort: Highest Match Score</option>
              <option value="score_asc">Sort: Lowest Match Score</option>
              <option value="exp_desc">Sort: Most Years Experience</option>
              <option value="name_asc">Sort: Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Score Range Slider */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-80">
            <span className="font-semibold text-slate-500 shrink-0">
              Min Match Score:
            </span>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 w-10 text-right">
              {minScore}%
            </span>
          </div>

          <div className="text-slate-400 text-xs">
            Showing <strong className="text-slate-900 dark:text-white">{filteredAndSortedCandidates.length}</strong> of {candidates.length} candidates
          </div>
        </div>
      </div>

      {/* Ranked Leaderboard Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Ranking candidates with Gemini AI...</p>
          </div>
        ) : filteredAndSortedCandidates.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No candidates match your filters
            </h3>
            <p className="text-xs text-slate-500">
              Try lowering the minimum score or clearing your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 w-10 text-center">Compare</th>
                  <th className="py-3.5 px-4 w-16">Rank</th>
                  <th className="py-3.5 px-6">Candidate</th>
                  <th className="py-3.5 px-6">Overall Score</th>
                  <th className="py-3.5 px-6">Mini-Scores (S / E / F)</th>
                  <th className="py-3.5 px-6">Matched Skills</th>
                  <th className="py-3.5 px-6">Recommendation</th>
                  <th className="py-3.5 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredAndSortedCandidates.map((cand, idx) => {
                  const rank = idx + 1;
                  const isSelected = selectedCandidateIds.includes(cand.id);
                  const scoreTier = getScoreTier(cand.aiScore);
                  const analysis = cand.analysis;
                  const skillsScore = analysis?.skills_score ?? 85;
                  const expScore = analysis?.experience_score ?? 80;
                  const fitScore = analysis?.suitability_score ?? 85;
                  const matched = cand.matchedSkills?.length ? cand.matchedSkills : (analysis?.matched_skills || []);

                  return (
                    <tr
                      key={cand.id}
                      onClick={() => setActiveDrawerCandidate(cand)}
                      className={`hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      {/* Checkbox for compare mode */}
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleSelectCandidate(cand.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Select to compare"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                          )}
                        </button>
                      </td>

                      {/* Rank Column with Medals for Top 3 */}
                      <td className="py-4 px-4 font-black text-sm">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 shadow-xs border border-amber-300 text-base" title="Rank #1 Gold Medal">
                            🥇
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs border border-slate-300 text-base" title="Rank #2 Silver Medal">
                            🥈
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 shadow-xs border border-amber-200 text-base" title="Rank #3 Bronze Medal">
                            🥉
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold pl-1 text-xs">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* Candidate Name & Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {cand.candidateName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate block">
                              {cand.candidateName}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                              {cand.candidateEmail}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Overall Score Progress Bar */}
                      <td className="py-4 px-6 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {cand.aiScore}%
                            </span>
                            <span className={`text-[10px] font-bold ${scoreTier.color}`}>
                              {scoreTier.label}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                              style={{ width: `${cand.aiScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Mini Scores: Skills / Exp / Fit */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300" title="Skills Match Score">
                            S: {skillsScore}%
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300" title="Experience Depth Score">
                            E: {expScore}%
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" title="Role Fit Score">
                            F: {fitScore}%
                          </span>
                        </div>
                      </td>

                      {/* Matched Skills Chips */}
                      <td className="py-4 px-6 max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {matched.slice(0, 3).map((sk) => (
                            <span
                              key={sk}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                            >
                              ✓ {sk}
                            </span>
                          ))}
                          {matched.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                              +{matched.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Recommendation Badge */}
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${
                          (analysis?.recommendation || scoreTier.label) === 'Strong Match'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300'
                            : (analysis?.recommendation || scoreTier.label) === 'Good Match'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300'
                            : (analysis?.recommendation || scoreTier.label) === 'Partial Match'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300'
                        }`}>
                          {analysis?.recommendation || scoreTier.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          cand.status.toLowerCase() === 'shortlisted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : cand.status.toLowerCase() === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            cand.status.toLowerCase() === 'shortlisted'
                              ? 'bg-emerald-500'
                              : cand.status.toLowerCase() === 'rejected'
                              ? 'bg-rose-500'
                              : 'bg-indigo-500'
                          }`} />
                          <span>{cand.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side Drawer for Full Candidate Inspection & Actions */}
      <CandidateDetailDrawer
        application={activeDrawerCandidate}
        onClose={() => setActiveDrawerCandidate(null)}
        onStatusChange={(appId, newStatus) => handleUpdateStatus(appId, newStatus)}
      />

      {/* Side-by-Side Candidate Comparison Modal */}
      {isCompareModalOpen && (
        <CandidateCompareModal
          candidates={selectedCandidatesList}
          onClose={() => setIsCompareModalOpen(false)}
          onShortlist={(id) => handleUpdateStatus(id, 'Shortlisted')}
          onReject={(id) => handleUpdateStatus(id, 'Rejected')}
          onRemoveCandidate={(id) => setSelectedCandidateIds(selectedCandidateIds.filter((cid) => cid !== id))}
        />
      )}
    </div>
  );
}
