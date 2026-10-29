import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { JobPosting } from '../../types';

interface ApplicantsBarChartProps {
  jobs: JobPosting[];
  onSelectJob?: (jobId: string) => void;
}

export function ApplicantsBarChart({ jobs, onSelectJob }: ApplicantsBarChartProps) {
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);

  // Take top jobs or all up to 6
  const chartJobs = jobs.slice(0, 6);
  const maxApplicants = Math.max(...chartJobs.map((j) => j.applicantCount || 0), 5);

  const totalApplicants = chartJobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Applicants per Requisition</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of incoming candidate resumes across active roles
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            {totalApplicants} Total Applications
          </span>
        </div>

        {/* Bar chart canvas */}
        <div className="pt-6 space-y-4">
          {chartJobs.map((job) => {
            const count = job.applicantCount || 0;
            const percentage = Math.round((count / maxApplicants) * 100);
            const isHovered = hoveredJobId === job.id;

            return (
              <div
                key={job.id}
                onMouseEnter={() => setHoveredJobId(job.id)}
                onMouseLeave={() => setHoveredJobId(null)}
                onClick={() => onSelectJob && onSelectJob(job.id)}
                className={`group cursor-pointer rounded-xl p-2.5 transition-all ${
                  isHovered
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-300 dark:ring-indigo-700'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[260px]">
                    {job.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      {job.department}
                    </span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                      {count} {count === 1 ? 'applicant' : 'applicants'}
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHovered
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                        : 'bg-gradient-to-r from-indigo-500/80 to-indigo-600/90'
                    }`}
                    style={{ width: `${Math.max(percentage, 6)}%` }}
                  />
                </div>
              </div>
            );
          })}

          {chartJobs.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No job postings available to display.
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Click any job row to view candidates</span>
        <span>Updated in real-time</span>
      </div>
    </div>
  );
}
