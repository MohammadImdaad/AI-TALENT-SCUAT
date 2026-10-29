import React, { useState } from 'react';
import { PieChart } from 'lucide-react';
import { CandidateApplication } from '../../types';

interface RecommendationDonutChartProps {
  applications: CandidateApplication[];
  onSelectCategory?: (category: string) => void;
}

export function RecommendationDonutChart({ applications, onSelectCategory }: RecommendationDonutChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Categorize
  let strongCount = 0;
  let goodCount = 0;
  let partialCount = 0;
  let notMatchCount = 0;

  applications.forEach((app) => {
    const rec = app.analysis?.recommendation;
    if (rec === 'Strong Match' || app.aiScore >= 85) {
      strongCount++;
    } else if (rec === 'Good Match' || (app.aiScore >= 70 && app.aiScore < 85)) {
      goodCount++;
    } else if (rec === 'Partial Match' || (app.aiScore >= 50 && app.aiScore < 70)) {
      partialCount++;
    } else {
      notMatchCount++;
    }
  });

  const total = applications.length || 1;

  const categories = [
    {
      label: 'Strong Match',
      count: strongCount,
      percentage: Math.round((strongCount / total) * 100),
      color: '#10b981', // emerald-500
      bgClass: 'bg-emerald-500',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800'
    },
    {
      label: 'Good Match',
      count: goodCount,
      percentage: Math.round((goodCount / total) * 100),
      color: '#3b82f6', // blue-500
      bgClass: 'bg-blue-500',
      textClass: 'text-blue-700 dark:text-blue-400',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800'
    },
    {
      label: 'Partial Match',
      count: partialCount,
      percentage: Math.round((partialCount / total) * 100),
      color: '#f59e0b', // amber-500
      bgClass: 'bg-amber-500',
      textClass: 'text-amber-700 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800'
    },
    {
      label: 'Not a Match',
      count: notMatchCount,
      percentage: Math.round((notMatchCount / total) * 100),
      color: '#f43f5e', // rose-500
      bgClass: 'bg-rose-500',
      textClass: 'text-rose-700 dark:text-rose-400',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800'
    }
  ];

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const segments = categories.map((cat) => {
    const strokeDasharray = `${(cat.count / total) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += (cat.count / total) * 100;
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset
    };
  });

  const activeInfo = hoveredCategory
    ? categories.find((c) => c.label === hoveredCategory)
    : categories[0];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Recommendation Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI-evaluated match tiers across all candidate profiles
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {strongCount + goodCount} Top Fits
          </span>
        </div>

        {/* Donut and Legend grid */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-8">
          {/* SVG Donut Chart */}
          <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox={`0 0 ${size} ${size}`}
            >
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth={strokeWidth}
                fill="none"
              />

              {/* Segments */}
              {segments.map((seg) => (
                <circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={hoveredCategory === seg.label ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredCategory(seg.label)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => onSelectCategory && onSelectCategory(seg.label)}
                />
              ))}
            </svg>

            {/* Centered Total / Hover Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {activeInfo ? activeInfo.count : applications.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[100px]">
                {activeInfo ? activeInfo.label : 'Candidates'}
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex-1 space-y-2.5 w-full">
            {categories.map((cat) => {
              const isHovered = hoveredCategory === cat.label;
              return (
                <div
                  key={cat.label}
                  onMouseEnter={() => setHoveredCategory(cat.label)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => onSelectCategory && onSelectCategory(cat.label)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-slate-100 dark:bg-slate-800 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {cat.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {cat.count}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium w-8 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Scored by Gemini 2.5 Flash</span>
        <span>{applications.length} Total Evaluated</span>
      </div>
    </div>
  );
}
