import React from 'react';
import './ChatAssistAnimation.css'; // Will have significantly updated styles

const ChatAssistAnimation = () => {
  const viewBoxWidth = 260;
  const viewBoxHeight = 200;
  const coreCenterX = viewBoxWidth / 2;
  const coreCenterY = viewBoxHeight / 2;

  // Define paths for particles to travel on. These are illustrative.
  // Paths start outside or at edge and curve towards/around center.
  const particlePaths = [
    { id: 'pPath1', d: `M -20 ${coreCenterY - 50} Q ${coreCenterX - 50} ${coreCenterY - 20}, ${coreCenterX - 25} ${coreCenterY}` },
    { id: 'pPath2', d: `M ${viewBoxWidth + 20} ${coreCenterY + 40} Q ${coreCenterX + 60} ${coreCenterY + 10}, ${coreCenterX + 20} ${coreCenterY - 5}` },
    { id: 'pPath3', d: `M ${coreCenterX - 40} ${viewBoxHeight + 20} Q ${coreCenterX - 10} ${coreCenterY + 50}, ${coreCenterX} ${coreCenterY + 25}` },
    { id: 'pPath4', d: `M ${coreCenterX + 50} -20 Q ${coreCenterX + 20} ${coreCenterY - 50}, ${coreCenterX - 5} ${coreCenterY - 20}` },
    { id: 'pPath5', d: `M -10 ${coreCenterY + 60} C ${coreCenterX - 80} ${coreCenterY + 30}, ${coreCenterX - 30} ${coreCenterY - 60}, ${coreCenterX - 10} ${coreCenterY - 30}` },
    { id: 'pPath6', d: `M ${viewBoxWidth + 10} ${coreCenterY - 70} C ${coreCenterX + 90} ${coreCenterY - 40}, ${coreCenterX + 40} ${coreCenterY + 50}, ${coreCenterX + 15} ${coreCenterY + 35}` },
  ];

  // Particle elements that will use these paths
  const particles = [
    { id: 'particle1', pathId: particlePaths[0].id, delay: '0s', duration: '6s', size: 2 },
    { id: 'particle2', pathId: particlePaths[1].id, delay: '0.5s', duration: '5.5s', size: 1.5 },
    { id: 'particle3', pathId: particlePaths[2].id, delay: '1s', duration: '6.5s', size: 2.2 },
    { id: 'particle4', pathId: particlePaths[3].id, delay: '1.5s', duration: '5s', size: 1.8 },
    { id: 'particle5', pathId: particlePaths[4].id, delay: '2s', duration: '7s', size: 1.7 },
    { id: 'particle6', pathId: particlePaths[5].id, delay: '2.5s', duration: '6.2s', size: 2.1 },
  ];


  return (
    <div className="chat-assist-animation-container mind-blowing">
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="chat-assist-animation-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Glow Filter */}
          <filter id="aiCoreGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="particleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="particleBlur"/>
            <feMerge>
              <feMergeNode in="particleBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Paths for particle motion */}
          {particlePaths.map(p => (
            <path key={p.id} id={p.id} d={p.d} fill="none" stroke="none" />
          ))}

          {/* Gradient for Core Shimmer */}
           <radialGradient id="coreShimmerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" className="grad-stop-inner" />
            <stop offset="60%" className="grad-stop-mid" />
            <stop offset="100%" className="grad-stop-outer" />
          </radialGradient>
        </defs>

        {/* Optional: Subtle animated background grid/plexus for depth */}
        <g className="caa-background-plexus">
          {[...Array(5)].map((_, i) => (
            <line key={`plexus-h-${i}`} x1="-20" y1={(i * viewBoxHeight/4) - 10} x2={viewBoxWidth + 20} y2={(i * viewBoxHeight/4) + 10} />
          ))}
          {[...Array(7)].map((_, i) => (
            <line key={`plexus-v-${i}`} x1={(i * viewBoxWidth/6) -10} y1="-20" x2={(i * viewBoxWidth/6) + 10} y2={viewBoxHeight + 20} />
          ))}
        </g>

        {/* Central AI Core */}
        <g className="caa-ai-core-group" filter="url(#aiCoreGlow)">
          {/* Outermost soft pulse / atmosphere */}
          <circle className="caa-core-atmosphere" cx={coreCenterX} cy={coreCenterY} r="40" />
          {/* Shimmering layer */}
          <circle className="caa-core-shimmer" cx={coreCenterX} cy={coreCenterY} r="30" fill="url(#coreShimmerGradient)" />
          {/* Innermost distinct shape / "kernel" */}
          <circle className="caa-core-kernel" cx={coreCenterX} cy={coreCenterY} r="15" />
        </g>

        {/* Neural Particles Flowing */}
        <g className="caa-particles">
          {particles.map(p => (
            <circle
              key={p.id}
              className={`caa-particle particle-${p.id}`}
              r={p.size}
              filter="url(#particleGlow)"
            >
              <animateMotion
                dur={p.duration}
                begin={p.delay}
                repeatCount="indefinite"
                fill="freeze" // Keeps it on the path, opacity will handle visibility
              >
                <mpath href={`#${p.pathId}`} />
              </animateMotion>
            </circle>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default ChatAssistAnimation;