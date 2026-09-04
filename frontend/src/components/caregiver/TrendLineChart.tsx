import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface SessionDataPoint {
  index: number;
  id: string;
  game_id: string;
  date: string;
  accuracy: number;
  reaction_time: number;
  score: number;
  difficulty: number;
  mistakes: number;
}

interface TrendLineChartProps {
  timeline?: SessionDataPoint[];
  overallAvgAccuracy?: number;
  overallAvgReactionTime?: number;
  trendDirection?: 'IMPROVING' | 'STABLE' | 'LOWER';
}

type MetricType = 'accuracy' | 'reaction_time' | 'score' | 'difficulty';

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  timeline = [],
  overallAvgAccuracy = 0,
  overallAvgReactionTime = 0,
  trendDirection = 'STABLE'
}) => {
  const [metric, setMetric] = useState<MetricType>('accuracy');
  const [hoveredPoint, setHoveredPoint] = useState<SessionDataPoint | null>(null);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="card-elder bg-white border-2 border-slate-200 p-8 text-center text-slate-500">
        <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="font-bold">No historical gameplay sessions recorded yet.</p>
        <p className="text-xs text-slate-400 mt-1">Sessions played by the elder will automatically chart trends here.</p>
      </div>
    );
  }

  // Determine values and y-axis bounds based on selected metric
  const getVal = (pt: SessionDataPoint) => {
    switch (metric) {
      case 'accuracy': return pt.accuracy;
      case 'reaction_time': return pt.reaction_time;
      case 'score': return pt.score;
      case 'difficulty': return pt.difficulty;
    }
  };

  const getUnit = () => {
    switch (metric) {
      case 'accuracy': return '%';
      case 'reaction_time': return 'ms';
      case 'score': return 'pts';
      case 'difficulty': return 'lvl';
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'accuracy': return 'Accuracy Over Time';
      case 'reaction_time': return 'Reaction Time Over Time';
      case 'score': return 'Session Score Over Time';
      case 'difficulty': return 'Difficulty Progression';
    }
  };

  const values = timeline.map(getVal);
  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);

  // Set nice bounds
  if (metric === 'accuracy') {
    minVal = Math.max(0, Math.min(minVal, 40));
    maxVal = 100;
  } else if (metric === 'difficulty') {
    minVal = 1;
    maxVal = 8;
  } else {
    // Add padding
    const pad = (maxVal - minVal) * 0.1 || 10;
    minVal = Math.max(0, Math.floor(minVal - pad));
    maxVal = Math.ceil(maxVal + pad);
  }

  const chartWidth = 640;
  const chartHeight = 220;
  const padLeft = 50;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;

  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const points = timeline.map((pt, i) => {
    const x = padLeft + (timeline.length > 1 ? (i / (timeline.length - 1)) * innerWidth : innerWidth / 2);
    const range = maxVal - minVal || 1;
    const y = padTop + innerHeight - ((getVal(pt) - minVal) / range) * innerHeight;
    return { x, y, pt, val: getVal(pt) };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${padTop + innerHeight} L ${points[0].x},${padTop + innerHeight} Z`
    : '';

  return (
    <div className="card-elder bg-white border-2 border-purple-100 shadow-[0_4px_20px_-2px_rgba(108,62,220,0.06)] p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
              Longitudinal Trends
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase flex items-center gap-1 ${
              trendDirection === 'IMPROVING' ? 'bg-emerald-100 text-emerald-800' :
              trendDirection === 'LOWER' ? 'bg-purple-100 text-[#6C3EDC]' :
              'bg-slate-100 text-slate-700'
            }`}>
              {trendDirection === 'IMPROVING' && <TrendingUp className="w-3.5 h-3.5" />}
              {trendDirection === 'LOWER' && <TrendingDown className="w-3.5 h-3.5" />}
              {trendDirection === 'STABLE' && <Minus className="w-3.5 h-3.5" />}
              Trend: {trendDirection}
            </span>
          </div>
          <h3 className="text-xl font-black text-elder-navy mt-1">
            {getMetricLabel()}
          </h3>
        </div>

        {/* Metric Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold self-stretch sm:self-auto overflow-x-auto">
          {(['accuracy', 'reaction_time', 'score', 'difficulty'] as MetricType[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                metric === m
                  ? 'bg-white text-elder-navy shadow-sm border border-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[500px]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padTop + innerHeight * (1 - ratio);
              const labelVal = Math.round(minVal + (maxVal - minVal) * ratio);
              return (
                <g key={`grid-${ratio}`}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={chartWidth - padRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1.5"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                    fontWeight="bold"
                  >
                    {labelVal}{getUnit()}
                  </text>
                </g>
              );
            })}

            {/* Filled Area */}
            <path d={areaD} fill="url(#areaGradient)" />

            {/* Line Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#6366f1"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Data Dots */}
            {points.map((p, i) => (
              <g key={`pt-${i}`} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(p.pt)}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#ffffff"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  className="transition-transform hover:scale-150"
                />
                {/* X-axis tick */}
                <text
                  x={p.x}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#94a3b8"
                  fontWeight="bold"
                >
                  #{p.pt.index}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Hover Tooltip Card / Footer */}
      {hoveredPoint ? (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-indigo-900">Session #{hoveredPoint.index}</span>
            <span className="text-indigo-700 ml-2">({hoveredPoint.game_id.replace('_', ' ')})</span>
            <span className="text-slate-500 ml-2">
              {new Date(hoveredPoint.date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-4 font-black text-elder-navy">
            <span>Accuracy: {hoveredPoint.accuracy}%</span>
            <span>Speed: {hoveredPoint.reaction_time}ms</span>
            <span>Level: {hoveredPoint.difficulty}</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-center">
          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Avg Accuracy</span>
            <p className="text-lg font-black text-indigo-600">{overallAvgAccuracy}%</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Avg Reaction</span>
            <p className="text-lg font-black text-slate-800">{overallAvgReactionTime}ms</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Sessions Total</span>
            <p className="text-lg font-black text-emerald-600">{timeline.length}</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Recent Level</span>
            <p className="text-lg font-black text-[#6C3EDC]">Lvl {timeline[timeline.length - 1]?.difficulty || 1}</p>
          </div>
        </div>
      )}
    </div>
  );
};
