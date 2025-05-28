import React from 'react';
import './NewsPageLoader.css'; // Import the CSS for the animation

const NewsPageLoader = () => {
  return (
    <svg width="100px" height="100px" viewBox="0 0 100 100" className="newspaper-loader-svg">
      <defs>
        <linearGradient id="paperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:'#E0E0E0', stopOpacity:1}} /> {/* Lightest part of gradient */}
          <stop offset="100%" style={{stopColor:'#BDBDBD', stopOpacity:1}} /> {/* Darker part for depth */}
        </linearGradient>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
          <feOffset in="blur" dx="1" dy="2" result="offsetBlur"/>
          <feMerge>
            <feMergeNode in="offsetBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Stacked pages underneath for depth */}
      <rect className="np-page-bottom" x="10" y="20" width="80" height="70" rx="2" ry="2" filter="url(#dropShadow)" />
      <rect className="np-page-middle" x="13" y="17" width="80" height="70" rx="2" ry="2" filter="url(#dropShadow)" />

      {/* Top flipping page - this will be animated */}
      <g className="np-page-top-group">
        <rect className="np-page-top" x="16" y="14" width="80" height="70" rx="2" ry="2" />
        {/* Lines on the top page to represent text/content */}
        <line className="np-line" x1="22" y1="24" x2="88" y2="24" />
        <line className="np-line" x1="22" y1="34" x2="78" y2="34" />
        <line className="np-line" x1="22" y1="44" x2="90" y2="44" />
        <line className="np-line" x1="22" y1="54" x2="82" y2="54" />
        <line className="np-line" x1="22" y1="64" x2="88" y2="64" />
        <line className="np-line" x1="22" y1="74" x2="75" y2="74" />
      </g>
    </svg>
  );
};

export default NewsPageLoader; 