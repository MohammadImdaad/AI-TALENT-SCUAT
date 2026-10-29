import React from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Award, 
  AlertCircle, 
  Check, 
  GraduationCap, 
  Briefcase, 
  ArrowRight,
  SlidersHorizontal,
  Scale
} from 'lucide-react';
import { CandidateApplication } from '../../types';
import { getScoreTier } from '../../utils/formatters';

interface CandidateCompareModalProps {
  candidates: CandidateApplication[];
  onClose: () => void;
  onShortlist: (id: string, name: string) => void;
  onReject: (id: string, name: string) => void;
  onRemoveCandidate?: (id: string) => void;
}

export function CandidateCompareModal({
  candidates,
  onClose,
  onShortlist,
  onReject,
  onRemoveCandidate
}: CandidateCompareModalProps) {
  if (candidates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Side-by-Side Candidate Comparison</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                  {candidates.length} Selected
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct benchmark of technical competencies, AI scores, and experience gaps.
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

        {/* Comparison Body - Grid with 2 or 3 columns */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={`grid grid-cols-1 md:grid-cols-${candidates.length} gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800`}>
            {candidates.map((cand, idx) => {
              const scoreTier = getScoreTier(cand.aiScore);
              const analysis = cand.analysis;
              const skillsScore = analysis?.skills_score ?? 85;
              const expScore = analysis?.experience_score ?? 80;
              const fitScore = analysis?.suitability_score ?? 85;
              const matched = cand.matchedSkills?.length ? cand.matchedSkills : (analysis?.matched_skills || []);
              const missing = cand.missingSkills?.length ? cand.missingSkills : (analysis?.missing_skills || []);

              return (
                <div key={cand.id} className={`space-y-6 ${idx > 0 ? 'pt-6 md:pt-0 md:pl-6' : ''}`}>
                  {/* Candidate Identity Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                        {cand.candidateName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                          {cand.candidateName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {cand.candidateEmail}
                        </p>
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                          {cand.jobTitle}
                        </span>
                      </div>
                    </div>

                    {candidates.length > 2 && onRemoveCandidate && (
                      <button
                        onClick={() => onRemoveCandidate(cand.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Overall Fit Ring & Tier */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Overall Score
                      </span>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {cand.aiScore}%
                      </div>
                      <span className={`text-[11px] font-bold ${scoreTier.color}`}>
                        {analysis?.recommendation || scoreTier.label}
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => onShortlist(cand.id, cand.candidateName)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Shortlist</span>
                      </button>
                      <button
                        onClick={() => onReject(cand.id, cand.candidateName)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1 border border-rose-200 dark:border-rose-800 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-Score Bars */}
                  <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Criteria Scoring Breakdown
                    </span>

                    {/* Skills */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300">Technical Skills</span>
                        <span className="font-bold text-slate-900 dark:text-white">{skillsScore}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${skillsScore}%` }} />
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300">Experience Depth</span>
                        <span className="font-bold text-slate-900 dark:text-white">{expScore}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${expScore}%` }} />
                      </div>
                    </div>

                    {/* Suitability */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300">Role Suitability</span>
                        <span className="font-bold text-slate-900 dark:text-white">{fitScore}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${fitScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Background & Education */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      <span>{analysis?.education || 'Degree in relevant field'}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 pl-5 text-[11px]">
                      {cand.experienceYears || analysis?.total_years_experience || 4} verified years of experience
                    </p>
                  </div>

                  {/* Matched Skills */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Matched Skills ({matched.length})</span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {matched.map((sk) => (
                        <span
                          key={sk}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" />
                      <span>Missing Skills ({missing.length})</span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {missing.map((sk) => (
                        <span
                          key={sk}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60"
                        >
                          {sk}
                        </span>
                      ))}
                      {missing.length === 0 && (
                        <span className="text-[11px] text-slate-400">Zero missing skills</span>
                      )}
                    </div>
                  </div>

                  {/* Strengths bullet points */}
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Top Strengths</span>
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {(analysis?.strengths || ['Demonstrated relevant capabilities']).map((st, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-emerald-500">•</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
