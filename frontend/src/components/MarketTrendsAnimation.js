import React, { useState, useEffect, useMemo } from 'react';
import './MarketTrendsAnimation.css';

const MarketTrendsAnimation = () => {
  const viewBoxWidth = 260;
  const viewBoxHeight = 200;
  const centerX = viewBoxWidth / 2;
  const centerY = viewBoxHeight / 2;

  // Combined data for asteroids and their text
  const financeDataNodes = useMemo(() => [
    { id: 'node1', text: "", x: centerX - 90, y: centerY - 70, accent: true, size: "small", asteroidR: 3.5 },
    { id: 'node2', text: "", x: centerX + 60, y: centerY - 55, accent: false, size: "medium", asteroidR: 4 },
    { id: 'node3', text: "", x: centerX - 80, y: centerY + 50, accent: true, size: "small", asteroidR: 3 },
    { id: 'node4', text: "", x: centerX + 40, y: centerY + 70, accent: false, size: "medium", asteroidR: 4.5 },
    { id: 'node5', text: "", x: centerX - 40, y: viewBoxHeight - 25, accent: true, size: "small", asteroidR: 3.5 },
    { id: 'node6', text: "", x: centerX + 70, y: centerY + 10, accent: false, size: "small", asteroidR: 3 },
    { id: 'node7', text: "", x: centerX + 10, y: centerY - 20, accent: true, size: "medium", asteroidR: 4 },
    { id: 'node8', text: "", x: centerX - 100, y: centerY + 15, accent: false, size: "small", asteroidR: 3.5 },
  ], [centerX, centerY, viewBoxHeight]);

  const [visibleDataNodes, setVisibleDataNodes] = useState([]);

  useEffect(() => {
    const updateVisibleNodes = () => {
      const numToShow = 3; // Number of asteroid-text pairs to show at once
      const shuffled = [...financeDataNodes].sort(() => 0.5 - Math.random());
      setVisibleDataNodes(shuffled.slice(0, numToShow).map(node => ({
        ...node,
        displayKey: `${node.id}-${Math.random()}`, // Forcing re-render for animation restart
        animationDelay: `${Math.random() * 0.5}s` // Slight random delay for appearance
      })));
    };
    updateVisibleNodes();
    const intervalId = setInterval(updateVisibleNodes, 4500); // Change nodes every 4.5 seconds
    return () => clearInterval(intervalId);
  }, [financeDataNodes]);

  const stars = useMemo(() => {
    const numStars = 30;
    return Array.from({ length: numStars }).map((_, i) => ({
      id: `star${i}`,
      cx: Math.random() * viewBoxWidth,
      cy: Math.random() * viewBoxHeight,
      r: Math.random() * 1.2 + 0.5,
      animationDuration: `${Math.random() * 2 + 3}s`, // for mtaStarTwinkleScreenshot
      animationDelay: `${Math.random() * 2}s`,
    }));
  }, [viewBoxWidth, viewBoxHeight]);

  return (
    <div className="market-trends-animation-container data-hub">
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="market-trends-animation-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="mtaHubGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g className="mta-stars">
          {stars.map(star => (
            <circle
              key={star.id}
              className="mta-star"
              cx={star.cx}
              cy={star.cy}
              r={star.r}
              style={{
                animationDuration: star.animationDuration,
                animationDelay: star.animationDelay,
              }}
            />
          ))}
        </g>

        <circle
          className="mta-central-orb"
          cx={centerX}
          cy={centerY}
          r="22"
          filter="url(#mtaHubGlow)"
        />
         <circle
          className="mta-central-orb-inner"
          cx={centerX}
          cy={centerY}
          r="12"
        />

        {/* Asteroids with Text */}
        <g className="mta-data-nodes-container">
          {visibleDataNodes.map(node => (
            <g key={node.displayKey} className="mta-data-node" style={{ animationDelay: node.animationDelay }}>
              <circle
                className="mta-asteroid" 
                cx={node.x}
                cy={node.y}
                r={node.asteroidR}
              />
              <text
                className={`mta-snippet-text ${node.accent ? 'accent' : ''} size-${node.size}`}
                x={node.x} 
                y={node.y - (node.asteroidR + 6)} // Position text above the asteroid
                textAnchor="middle"
              >
                {node.text}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default MarketTrendsAnimation;