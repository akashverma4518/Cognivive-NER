import React from 'react';

interface DomainScores {
  working_memory_score?: number | string;
  processing_speed_score?: number | string;
  attention_score?: number | string;
  reminiscence_score?: number | string;
  problem_solving_score?: number | string;
}

interface CognitiveRadarChartProps {
  scores?: DomainScores | null;
  overallScore?: number | string;
}

export const CognitiveRadarChart: React.FC<CognitiveRadarChartProps> = ({ scores, overallScore }) => {
  const domains = [
    { label: 'Working Memory', key: 'working_memory_score', value: parseFloat(String(scores?.working_memory_score || 50)) },
    { label: 'Processing Speed', key: 'processing_speed_score', value: parseFloat(String(scores?.processing_speed_score || 50)) },
    { label: 'Attention', key: 'attention_score', value: parseFloat(String(scores?.attention_score || 50)) },
    { label: 'Reminiscence', key: 'reminiscence_score', value: parseFloat(String(scores?.reminiscence_score || 50)) },
    { label: 'Problem Solving', key: 'problem_solving_score', value: parseFloat(String(scores?.problem_solving_score || 50)) }
  ];

  const size = 320;
  const center = size / 2;
  const radius = 105;
  const total = domains.length;

  // Compute vertex coordinates for polygon
  const getCoordinates = (index: number, val: number) => {
    // Top is -pi/2
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const distance = (val / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y, angle };
  };

  // Concentric grid rings (20, 40, 60, 80, 100)
  const rings = [20, 40, 60, 80, 100];

  const getRingPoints = (ringVal: number) => {
    return domains
      .map((_, i) => {
        const { x, y } = getCoordinates(i, ringVal);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Data polygon points
  const dataPoints = domains.map((d, i) => getCoordinates(i, Math.min(Math.max(d.value, 0), 100)));
  const polygonPoints = dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="card-elder bg-white border-2 border-purple-100 shadow-[0_4px_20px_-2px_rgba(108,62,220,0.06)] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#6C3EDC] bg-[#EDE9FE] px-2.5 py-1 rounded-full">
            Cognitive Activity Profile
          </span>
          <h3 className="text-xl font-black text-elder-navy mt-1">
            5-Domain Activity Radar
          </h3>
        </div>
        {overallScore !== undefined && (
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase">Composite Activity</span>
            <p className="text-2xl font-black text-[#6C3EDC]">{Number(overallScore).toFixed(1)}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center relative py-2">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background grid rings */}
          {rings.map((ring) => (
            <polygon
              key={`ring-${ring}`}
              points={getRingPoints(ring)}
              fill={ring === 100 ? '#faf5ff' : 'none'}
              stroke="#e2e8f0"
              strokeWidth="1.5"
              strokeDasharray={ring < 100 ? '3 3' : undefined}
            />
          ))}

          {/* Radial axis lines */}
          {domains.map((_, i) => {
            const { x, y } = getCoordinates(i, 100);
            return (
              <line
                key={`axis-${i}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Filled Data Polygon */}
          <polygon
            points={polygonPoints}
            fill="rgba(108, 62, 220, 0.2)"
            stroke="#6C3EDC"
            strokeWidth="3"
            className="transition-all duration-500 ease-out"
          />

          {/* Markers & Value Badges */}
          {dataPoints.map((p, i) => (
            <g key={`marker-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#6C3EDC"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          ))}

          {/* Labels */}
          {domains.map((d, i) => {
            const { x, y, angle } = getCoordinates(i, 122);
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (Math.cos(angle) > 0.3) textAnchor = 'start';
            else if (Math.cos(angle) < -0.3) textAnchor = 'end';

            return (
              <g key={`label-${i}`}>
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  fill="#1e293b"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {d.label}
                </text>
                <text
                  x={x}
                  y={y + 13}
                  textAnchor={textAnchor}
                  fill="#0284c7"
                  fontSize="12"
                  fontWeight="900"
                >
                  {d.value.toFixed(1)}/100
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Domain score chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
        {domains.map((d) => (
          <div key={d.key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block truncate">{d.label}</span>
            <span className="text-base font-black text-elder-navy">{d.value.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Mandatory Non-Diagnostic Disclaimer */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs leading-relaxed">
        <p className="font-semibold">
          ℹ️ These scores represent activity performance within this platform. They are not medical or diagnostic scores.
        </p>
      </div>
    </div>
  );
};
