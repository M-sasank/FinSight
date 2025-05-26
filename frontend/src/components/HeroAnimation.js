import React, { useState, useEffect } from 'react';
import './HeroAnimation.css';

const HeroAnimation = () => {
  // Path data based on image observation
  const wavyLine1Path = "M 30 70 Q 55 50 80 70 T 130 70";
  const curveLine2Path = "M 20 100 Q 70 60 150 100 T 250 80";
  // Dotted path - two rows of dots as seen in the image
  const dottedLinePath1 = "M 40 130 L 55 130 L 70 130 L 85 130 L 100 130 L 115 130";
  const dottedLinePath2 = "M 40 145 L 55 145 L 70 145 L 85 145 L 100 145 L 115 145";

  const zigZagPoints = "70,220 130,170 190,190 250,150 310,170";
  const nodes = [
    { cx: 70, cy: 220 },
    { cx: 130, cy: 170 },
    { cx: 190, cy: 190 },
    { cx: 250, cy: 150 },
    { cx: 310, cy: 170 },
  ];

  // Percentage box position, near the peak (250,150) of the zigzag
  const percentageBoxX = 230; // x-coordinate for the group
  const percentageBoxY = 105; // y-coordinate for the group (above the peak at y=150)

  // State for the dynamic percentage
  const initialPercentage = 1.52;
  const [currentPercentage, setCurrentPercentage] = useState(initialPercentage);
  const [isIncrementing, setIsIncrementing] = useState(true);

  const minPercentage = 1.40;
  const maxPercentage = 1.60;
  const step = 0.01;
  const intervalDuration = 150; // milliseconds

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentPercentage(prevPercentage => {
        let nextPercentage;
        if (isIncrementing) {
          nextPercentage = prevPercentage + step;
          if (nextPercentage >= maxPercentage) {
            nextPercentage = maxPercentage;
            setIsIncrementing(false);
          }
        } else {
          nextPercentage = prevPercentage - step;
          if (nextPercentage <= minPercentage) {
            nextPercentage = minPercentage;
            setIsIncrementing(true);
          }
        }
        return parseFloat(nextPercentage.toFixed(2)); // Ensure two decimal places
      });
    }, intervalDuration);

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [isIncrementing, minPercentage, maxPercentage, step, intervalDuration]);


  return (
    <div className="hero-animation-container">
      <svg viewBox="0 0 400 300" className="hero-animation-svg" preserveAspectRatio="xMidYMid meet">
        {/* Wavy Line 1 (top-left, lighter blue) */}
        <path
          className="ha-wavy-line-1"
          d={wavyLine1Path}
          fill="none"
          strokeWidth="2.5"
        />

        {/* Curve Line 2 (top-left, darker, smoother) */}
         <path
          className="ha-curve-line-2"
          d={curveLine2Path}
          fill="none"
          strokeWidth="2"
        />

        {/* Dotted Path (multiple dots in two rows) */}
        {/* Using stroke-dasharray on a line for dots is easier for animation */}
        <path
            className="ha-dotted-line"
            d={dottedLinePath1}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
        />
         <path
            className="ha-dotted-line-2" /* Separate class for potentially different timing/styling */
            d={dottedLinePath2}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
        />


        {/* Bar Chart (top-right) */}
        {/* Bars are shorter and start higher up in the image */}
        <rect className="ha-bar-1" x="290" y="70" width="12" height="30" />
        <rect className="ha-bar-2" x="312" y="55" width="12" height="45" />
        <rect className="ha-bar-3" x="334" y="40" width="12" height="60" />

        {/* Main ZigZag Line (center-right, white) */}
        <polyline
            className="ha-zigzag-line"
            points={zigZagPoints}
            fill="none"
            strokeWidth="2.5"
        />
        {/* Nodes for ZigZag Line */}
        {nodes.map((node, index) => (
          <circle
            key={`node-${index}`}
            className="ha-node" /* nth-of-type will apply based on this class */
            cx={node.cx}
            cy={node.cy}
            r="3.5"
          />
        ))}

        {/* Percentage Box (near the peak of the zigzag line) */}
        <g className="ha-percentage-box" transform={`translate(${percentageBoxX}, ${percentageBoxY})`}>
            {/* Simple rect for now */}
            <rect x="0" y="0" width="65" height="28" rx="4" />
            {/* Text inside the box - now dynamic */}
            <text x="32.5" y="18" fontSize="10" textAnchor="middle">
              {currentPercentage >= 0 ? '+' : ''}{currentPercentage.toFixed(2)}%
            </text>
        </g>
      </svg>
    </div>
  );
};

export default HeroAnimation; 