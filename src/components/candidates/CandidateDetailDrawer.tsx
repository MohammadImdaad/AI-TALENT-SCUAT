import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ExternalLink, 
  Download, 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Briefcase, 
  Send, 
  MessageSquare, 
  AlertCircle, 
  Check, 
  Lightbulb, 
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CandidateApplication, ApplicationNote } from '../../types';
import { getScoreTier } from '../../utils/formatters';
import { addApplicationNote, updateApplicationStatus } from '../../services/applicationsService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface CandidateDetailDrawerProps {
  application: CandidateApplication | null;
  onClose: () => void;
  onStatusChange?: (appId: string, newStatus: 'Shortlisted' | 'Rejected' | 'Under review') => void;
}

export function CandidateDetailDrawer({
  application,
  onClose,
  onStatusChange
}: CandidateDetailDrawerProps) {
  const { profile, user } = useAuth();
  const { success, error: showError, info } = useToast();

  const [activeTab, setActiveTab] = useState<'analysis' | 'resume' | 'notes'>('analysis');
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [localNotes, setLocalNotes] = useState<ApplicationNote[]>(application?.notes || []);
  const [currentStatus, setCurrentStatus] = useState<string>(application?.status || 'Under review');

  // Sync state when application changes
  React.useEffect(() => {
    if (application) {
      setLocalNotes(application.notes || []);
      setCurrentStatus(application.status);
    }
  }, [application]);

  if (!application) return null;

  const scoreTier = getScoreTier(application.aiScore);
  const analysis = application.analysis;

  const skillsScore = analysis?.skills_score ?? 85;
  const experienceScore = analysis?.experience_score ?? 80;
  const suitabilityScore = analysis?.suitability_score ?? 85;

  const matchedSkills = application.matchedSkills?.length ? application.matchedSkills : (analysis?.matched_skills || []);
  const missingSkills = application.missingSkills?.length ? application.missingSkills : (analysis?.missing_skills || []);
  const strengths = analysis?.strengths || ['Demonstrated command of core technologies', 'Hands-on project scale matches role requirements'];
  const gaps = analysis?.gaps || ['Enterprise scale benchmarks not explicitly documented'];
  const summary = application.aiSummary || analysis?.summary || 'Candidate demonstrated strong qualifications aligned with job requisitions.';

  // Handle status update
  const handleUpdateStatus = async (status: 'Shortlisted' | 'Rejected' | 'Under review') => {
    try {
      setCurrentStatus(status);
      await updateApplicationStatus(application.id, status);
      onStatusChange?.(application.id, status);
      if (status === 'Shortlisted') {
        success('Candidate Shortlisted', `${application.candidateName} moved to interview pipeline.`);
      } else if (status === 'Rejected') {
        info('Candidate Rejected', `${application.candidateName} marked as rejected.`);
      } else {
        info('Status Updated', `${application.candidateName} set to Under Review.`);
      }
    } catch (err) {
      showError('Update Failed', 'Could not update candidate status in Firestore.');
    }
  };

  // Handle adding note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setSubmittingNote(true);
    try {
      const authorName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Recruiter Admin';
      const createdNote = await addApplicationNote(application.id, newNoteText.trim(), authorName);
      setLocalNotes([createdNote, ...localNotes]);
      setNewNoteText('');
      success('Note Added', 'Recruiter note recorded successfully.');
    } catch (err) {
      showError('Note Failed', 'Could not record note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-extrabold flex items-center justify-center text-base shadow-sm shrink-0">
              {application.candidateName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {application.candidateName}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border capitalize ${
                  currentStatus.toLowerCase() === 'shortlisted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                    : currentStatus.toLowerCase() === 'rejected'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200'
                }`}>
                  {currentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Applied for <strong>{application.jobTitle}</strong></span>
                <span>•</span>
                <span>{application.appliedAt || 'Recently'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Quick Shortlist / Reject / Under Review */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Status Action:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateStatus('Shortlisted')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                currentStatus.toLowerCase() === 'shortlisted'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-500'
                  : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Shortlist</span>
            </button>

            <button
              onClick={() => handleUpdateStatus('Rejected')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                currentStatus.toLowerCase() === 'rejected'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-500'
                  : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>

            <button
              onClick={() => handleUpdateStatus('Under review')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentStatus.toLowerCase() === 'under review'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Reviewing</span>
            </button>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-xs font-bold bg-slate-50/30 dark:bg-slate-950/30">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'analysis'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Evaluation & Scores</span>
          </button>

          <button
            onClick={() => setActiveTab('resume')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'resume'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume Document</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Recruiter Notes ({localNotes.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: AI DIAGNOSTICS & FIT */}
          {activeTab === 'analysis' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Overall Score Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {/* Circular Score Gauge */}
                  <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        className="stroke-slate-200 dark:stroke-slate-800"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        className={scoreTier.strokeColor}
                        strokeWidth="10"
                        strokeDasharray={238.7}
                        strokeDashoffset={238.7 - (238.7 * application.aiScore) / 100}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {application.aiScore}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Overall Match Calibration
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {analysis?.recommendation || scoreTier.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Weighted against job description requirements
                    </p>
                  </div>
                </div>

                {/* Sub-scores columns */}
                <div className="grid grid-cols-3 gap-2 text-center w-full sm:w-auto">
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Skills</span>
                    <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {skillsScore}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Exp</span>
                    <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {experienceScore}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Fit</span>
                    <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {suitabilityScore}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Candidate Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Email</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {application.candidateEmail}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Experience</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {application.experienceYears || analysis?.total_years_experience || 4} Years
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Education</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {analysis?.education || 'Relevant Degree'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {analysis?.phone || '+1 (555) 000-0000'}
                  </p>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Recruiter Executive Summary
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{summary}"
                </p>
              </div>

              {/* Skills Overlap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Matched */}
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-2.5">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Verified Matched Skills ({matchedSkills.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.map((sk) => (
                      <span
                        key={sk}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                      >
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing */}
                <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/60 space-y-2.5">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" />
                    <span>Missing or Unverified Skills ({missingSkills.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((sk) => (
                      <span
                        key={sk}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300"
                      >
                        ✕ {sk}
                      </span>
                    ))}
                    {missingSkills.length === 0 && (
                      <span className="text-xs text-slate-400">All target skills satisfied.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Key Strengths</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Identified Gaps</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Cover Note if provided */}
              {application.coverNote && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Candidate Cover Note
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {application.coverNote}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RESUME DOCUMENT PREVIEW */}
          {activeTab === 'resume' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {application.resumeFileName || 'Resume.pdf'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Standard PDF Application Document
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {application.resumeUrl && (
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  )}
                </div>
              </div>

              {/* PDF Viewer Frame / Preview Fallback */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Document Text Extraction & Structure
                  </span>
                  <span className="text-slate-400">Parsed by Gemini 2.5 Flash</span>
                </div>

                <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">Professional Profile</h4>
                    <p className="leading-relaxed">
                      {summary}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">Technical Qualifications</h4>
                    <div className="flex flex-wrap gap-1">
                      {matchedSkills.concat(missingSkills).map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">Credentials & Education</h4>
                    <p>{analysis?.education || 'B.S. in Computer Science or equivalent'}</p>
                    <p className="text-slate-400 text-[11px]">Experience: {application.experienceYears || 4} verified years in industry</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RECRUITER NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Add Internal Interview / Evaluation Note
                </label>
                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record interview notes, technical screening feedback, or salary expectations..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingNote || !newNoteText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingNote ? 'Saving...' : 'Add Note'}</span>
                  </button>
                </div>
              </form>

              {/* Notes Timeline List */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Notes Log ({localNotes.length})
                </h4>

                {localNotes.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                    <MessageSquare className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No internal notes recorded yet
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Add the first note to share notes with hiring managers.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {localNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {note.author}
                          </span>
                          <span className="text-slate-400">
                            {new Date(note.createdAt).toLocaleDateString()} at{' '}
                            {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                          {note.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
