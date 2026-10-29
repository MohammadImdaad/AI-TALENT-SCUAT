import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  FileText, 
  BarChart3, 
  CheckCircle2, 
  UploadCloud, 
  ShieldCheck, 
  Zap, 
  Search, 
  Briefcase, 
  Users, 
  Filter, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  SlidersHorizontal,
  Star
} from 'lucide-react';
import { getScoreTier } from '../utils/formatters';

export function LandingPage() {
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);

  const mockLeaderboard = [
    {
      name: 'Elena Rostova',
      role: 'Staff Frontend Architect',
      score: 96,
      experience: '7 years exp',
      summary: 'Exceptional fit for React 19, TypeScript and Design Systems. Built high-scale micro-frontends at FinTech unicorn. Strong engineering leadership.',
      matched: ['React 19', 'TypeScript', 'Tailwind', 'Performance Optimization', 'GraphQL', 'Next.js'],
      missing: ['AWS CDK'],
      status: 'Shortlisted'
    },
    {
      name: 'Marcus Chen',
      role: 'Senior Full Stack Engineer',
      score: 89,
      experience: '5 years exp',
      summary: 'Solid backend and frontend background with Node.js and TypeScript. Deep PostgreSQL and distributed systems knowledge.',
      matched: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs'],
      missing: ['React Server Components'],
      status: 'In Review'
    },
    {
      name: 'Devon Vance',
      role: 'Full Stack Developer',
      score: 74,
      experience: '3 years exp',
      summary: 'Competent engineer with good React fundamentals. Light on large-scale distributed systems and cloud infrastructure.',
      matched: ['JavaScript', 'React', 'Tailwind', 'Git'],
      missing: ['TypeScript', 'Kubernetes', 'GraphQL'],
      status: 'Applied'
    }
  ];

  const activeCandidate = mockLeaderboard[selectedCandidateIndex];
  const activeTier = getScoreTier(activeCandidate.score);

  return (
    <div className="relative overflow-hidden">
      {/* Background subtle ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold">Next-Gen AI Screening</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-600 dark:text-slate-400">Gemini 2.5 Flash Resume Analysis</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Match top talent with precision using{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
              AI candidate scoring
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
            TalentScout AI transforms raw resume PDFs into ranked, objective leaderboards. Benchmark applicants against your exact job description in seconds.
          </p>

          {/* CTA Buttons - Explicitly "Find a job" and "Hire talent" */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/jobs"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-base shadow-sm shadow-indigo-600/25 active:scale-[0.99] transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Find a job</span>
            </Link>

            <Link
              to="/admin/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-medium text-base border border-slate-200 dark:border-slate-800 shadow-xs active:scale-[0.99] transition-all"
            >
              <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Hire talent</span>
            </Link>
          </div>

          {/* Trust stats micro-strip */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No manual keyword filtering</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Contextual semantic evaluation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Objective 0–100 fit score</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Preview: Recruiter Leaderboard & Candidate Inspector */}
        <div className="mt-12 lg:mt-16 max-w-5xl mx-auto rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/70 dark:bg-slate-900/70 shadow-xl backdrop-blur-md overflow-hidden">
          {/* Mock Window Top Bar */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                job_requisition / sr-staff-frontend-042
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>AI Evaluation Live</span>
            </div>
          </div>

          {/* Interactive Leaderboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
            {/* Left Column: Ranked Candidates List */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ranked Applicants (3)
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  Sorted by AI Score ↓
                </span>
              </div>

              <div className="space-y-2">
                {mockLeaderboard.map((cand, idx) => {
                  const tier = getScoreTier(cand.score);
                  const isSelected = selectedCandidateIndex === idx;
                  return (
                    <button
                      key={cand.name}
                      onClick={() => setSelectedCandidateIndex(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all text-left flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {cand.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {cand.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className={`text-base font-bold ${tier.textColor}`}>
                            {cand.score}%
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {tier.label}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <div className="p-3 rounded-lg bg-slate-100/70 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Resumes ingested via PDF parser & scored with Gemini 2.5 Flash</span>
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Candidate Breakdown */}
            <div className="lg:col-span-7 p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {activeCandidate.name}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${activeTier.badgeClass} font-semibold`}>
                        {activeTier.label} ({activeCandidate.score}/100)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {activeCandidate.role} • {activeCandidate.experience}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      {activeCandidate.status}
                    </span>
                  </div>
                </div>

                {/* Score breakdown progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-600 dark:text-slate-400">JD Fit Calibration</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeCandidate.score}% Match</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${activeTier.progressColor}`}
                      style={{ width: `${activeCandidate.score}%` }}
                    />
                  </div>
                </div>

                {/* Gemini AI Summary */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini 2.5 Flash Synthesis</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    "{activeCandidate.summary}"
                  </p>
                </div>

                {/* Matched vs Missing Skills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1.5">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Matched Skills ({activeCandidate.matched.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {activeCandidate.matched.map((m) => (
                        <span key={m} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800/60 text-[11px]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                      Gaps to Discuss
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {activeCandidate.missing.map((m) => (
                        <span key={m} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700 text-[11px]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to test with your own resumes?
                </span>
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  <span>Open Full Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Main Feature Cards (Explicitly requested) */}
      <section id="features" className="py-16 sm:py-24 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 lg:mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Intelligent Pipeline
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Engineered for velocity and recruitment precision
            </p>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Replace gut-feeling keyword matching with verifiable semantic intelligence.
            </p>
          </div>

          {/* 3 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1 */}
            <div className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-7 shadow-xs hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2.5">
                  Smart Resume Extraction
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Extracts complete candidate work histories, technical proficiencies, key achievements, and education directly from PDF resumes without manual data entry.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Native PDF multi-page parsing</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified skill normalization</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-7 shadow-xs hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2.5">
                  Automated JD Scoring
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Gemini benchmarks each candidate against the exact nuances of your job description, assessing depth of experience, tool overlap, and structural qualifications.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>0–100 objective score calibration</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Semantic skill matching</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-7 shadow-xs hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2.5">
                  Recruiter Leaderboard
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Review candidates ranked by fit in a sleek, Notion-style table. One-click shortlisting, candidate interview queues, and concise AI synthesis for your hiring team.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>1-click shortlist / reject actions</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Instant candidate status tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / Core Flow Section */}
      <section id="how-it-works" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Frictionless Recruitment
          </h2>
          <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            From Job Description to Ranked Shortlist in 3 steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="space-y-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Recruiter Posts Job Spec
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Define the role, required core technologies, preferred competencies, and experience expectations.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Candidate Uploads Resume PDF
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Applicants browse open roles and submit their resume with a quick drag & drop. No lengthy, repetitive forms.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Instant AI Scoring & Leaderboard
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Gemini evaluates semantic match, highlights strengths and gaps, and surfaces the top candidates instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-b from-indigo-900 to-indigo-950 text-white p-8 sm:p-12 lg:p-16 overflow-hidden border border-indigo-800 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-2xl space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to elevate your hiring pipeline?
            </h2>
            <p className="text-indigo-200 text-base sm:text-lg leading-relaxed">
              Whether you are a recruiter building an elite team or a candidate seeking your next high-impact role, TalentScout AI gives you unfair clarity.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                to="/jobs"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-sm transition-colors shadow-sm"
              >
                <Search className="w-4 h-4 text-indigo-600" />
                <span>Find a job</span>
              </Link>
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-800/80 hover:bg-indigo-800 text-white font-semibold text-sm border border-indigo-700/80 transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                <span>Hire talent</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
