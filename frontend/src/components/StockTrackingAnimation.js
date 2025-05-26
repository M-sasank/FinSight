import React from 'react';
import './StockTrackingAnimation.css';

const StockTrackingAnimation = () => {
  const viewBoxWidth = 260;
  const viewBoxHeight = 200;
  const centerX = viewBoxWidth / 2;
  const centerY = viewBoxHeight / 2;

  // Stylized chart path (gentle wave)
  const chartPathD = `M 30 ${centerY + 20} C 70 ${centerY - 30}, 110 ${centerY + 40}, 150 ${centerY - 10} S 200 ${centerY + 30}, 230 ${centerY}`;

  // Data points along the chart (approximate positions on the path)
  const dataPoints = [
    { id: 'dp_sta_1', cx: 50, cy: centerY + 5, delay: '0.5s' },
    { id: 'dp_sta_2', cx: 100, cy: centerY + 25, delay: '1s' },
    { id: 'dp_sta_3', cx: 150, cy: centerY - 10, delay: '1.5s' }, // Point of focus
    { id: 'dp_sta_4', cx: 200, cy: centerY + 15, delay: '2s' },
  ];

  const focusPoint = dataPoints[2]; // Magnifier will focus on this point

  return (
    <div className="stock-tracking-animation-container mind-blowing">
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="stock-tracking-animation-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="reticleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="pointFocusGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="focusBlur"/>
            <feMerge>
              <feMergeNode in="focusBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
           <radialGradient id="reticleHighlightGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="70%" stopColor="rgba(10, 132, 255, 0.3)" /> {/* Accent with alpha */}
            <stop offset="100%" stopColor="rgba(10, 132, 255, 0)" />
          </radialGradient>
        </defs>

        {/* Subtle background grid */}
        <g className="sta-background-grid">
            {[...Array(7)].map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * (viewBoxHeight/6)} x2={viewBoxWidth} y2={i * (viewBoxHeight/6)} />
            ))}
            {[...Array(9)].map((_, i) => (
                <line key={`v-${i}`} x1={i * (viewBoxWidth/8)} y1="0" x2={i * (viewBoxWidth/8)} y2={viewBoxHeight} />
            ))}
        </g>

        {/* Stylized Chart Line */}
        <path
          id="stockChartPath"
          className="sta-chart-line"
          d={chartPathD}
          fill="none"
          strokeWidth="1.5"
        />

        {/* Data Points */}
        {dataPoints.map(point => (
          <circle
            key={point.id}
            className={`sta-data-point ${point.id === focusPoint.id ? 'focus-point-target' : ''}`}
            cx={point.cx}
            cy={point.cy}
            r="3.5"
            style={{ animationDelay: point.delay }}
          />
        ))}

        {/* Analysis Reticle / Scanner */}
        <g className="sta-reticle-group" style={{ '--focusX': `${focusPoint.cx}px`, '--focusY': `${focusPoint.cy}px` }}>
          <circle className="sta-reticle-ring outer" cx="0" cy="0" r="30" />
          <circle className="sta-reticle-ring mid" cx="0" cy="0" r="20" />
          <circle className="sta-reticle-ring inner" cx="0" cy="0" r="10" />
          <line className="sta-reticle-crosshair" x1="-25" y1="0" x2="25" y2="0" />
          <line className="sta-reticle-crosshair" x1="0" y1="-25" x2="0" y2="25" />
          {/* Highlight effect within reticle */}
          <circle className="sta-reticle-highlight" cx="0" cy="0" r="18" fill="url(#reticleHighlightGradient)" />
        </g>
      </svg>
    </div>
  );
};

export default StockTrackingAnimation;