import React from 'react';
import './MarketTrendsAnimation.css';

const MarketTrendsAnimation = () => {
  const viewBoxWidth = 260;
  const viewBoxHeight = 200;
  const orbCenterX = viewBoxWidth / 2;
  const orbCenterY = viewBoxHeight / 2;
  const orbRadius = 45;

  // Paths for trend streams (illustrative, can be refined)
  const trendStreamPaths = [
    { id: 'tsPath1', d: `M -20 ${orbCenterY - 60} C 50 ${orbCenterY - 70}, ${orbCenterX - 70} ${orbCenterY + 20}, ${orbCenterX - 30} ${orbCenterY}` },
    { id: 'tsPath2', d: `M ${viewBoxWidth + 20} ${orbCenterY + 50} C ${viewBoxWidth - 50} ${orbCenterY + 60}, ${orbCenterX + 60} ${orbCenterY - 30}, ${orbCenterX + 20} ${orbCenterY - 5}` },
    { id: 'tsPath3', d: `M ${orbCenterX} -20 C ${orbCenterX + 70} 50, ${orbCenterX - 70} ${viewBoxHeight - 50}, ${orbCenterX} ${viewBoxHeight - orbRadius - 10}` },
  ];

  // News Pings locations
  const newsPings = [
    { id: 'np1', cx: orbCenterX + 60, cy: orbCenterY - 30, delay: '0s' },
    { id: 'np2', cx: orbCenterX - 55, cy: orbCenterY + 40, delay: '1.5s' },
    { id: 'np3', cx: orbCenterX + 10, cy: orbCenterY + 65, delay: '3s' },
    { id: 'np4', cx: orbCenterX - 30, cy: orbCenterY - 70, delay: '4.5s' },
  ];

  return (
    <div className="market-trends-animation-container mind-blowing">
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="market-trends-animation-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Orb Glow Filter */}
          <filter id="orbGlow" x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Turbulence Filter for Orb's internal texture */}
          <filter id="orbTexture" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="3" seed="10" result="turbulence"/>
            <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G"/>
            <feGaussianBlur stdDeviation="0.5"/> 
          </filter>
          
          {/* Mask for the orb's textured fill */}
          <mask id="orbMask">
            <circle cx={orbCenterX} cy={orbCenterY} r={orbRadius} fill="white" />
          </mask>

          {/* Gradient for Trend Streams */}
          <linearGradient id="trendStreamGradient" gradientTransform="rotate(90)">
            <stop offset="0%" className="ts-grad-stop1" />
            <stop offset="50%" className="ts-grad-stop2" />
            <stop offset="100%" className="ts-grad-stop3" />
          </linearGradient>
        </defs>

        {/* Subtle Background Grid/Elements (optional) */}
        <g className="mta-background-elements">
          {[...Array(6)].map((_, i) => (
            <circle key={`bgc-${i}`} className="mta-bg-circle" 
                    cx={Math.random() * viewBoxWidth} 
                    cy={Math.random() * viewBoxHeight} 
                    r={Math.random() * 2 + 0.5} />
          ))}
        </g>

        {/* Central Data Orb */}
        <g filter="url(#orbGlow)">
          {/* Textured fill layer for the orb */}
          <rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight}
                fill="var(--accent-color-primary-veteran, #0A84FF)" 
                mask="url(#orbMask)" 
                className="mta-orb-texture-fill" />
          {/* Orb outline / main body */}
          <circle className="mta-data-orb" cx={orbCenterX} cy={orbCenterY} r={orbRadius} />
        </g>

        {/* Trend Streams */}
        {trendStreamPaths.map((path, index) => (
          <path
            key={path.id}
            className={`mta-trend-stream ts-stream-${index + 1}`}
            d={path.d}
            fill="none"
            strokeWidth="1.5"
            stroke="url(#trendStreamGradient)"
          />
        ))}

        {/* News Pings */}
        {newsPings.map(ping => (
          <circle
            key={ping.id}
            className="mta-news-ping"
            cx={ping.cx}
            cy={ping.cy}
            r="0" // Starts with radius 0
            style={{ animationDelay: ping.delay }}
          />
        ))}
      </svg>
    </div>
  );
};

export default MarketTrendsAnimation;