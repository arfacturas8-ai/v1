import React from 'react';
export const ProgressIndicator = ({
  value = 0,
  max = 100,
  label,
  showPercentage = true,
  variant = 'bar',
  size = 'md'
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  if (variant === 'circular') {
    const radius = size === 'sm' ? 20 : size === 'lg' ? 40 : 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const sizeClass = size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';

    return (
      <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px'
}} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <svg className={'transform -rotate-90 ' + sizeClass}>
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            style={{
  color: '#c9d1d9'
}}
          />
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-blue-500">"
          />
        </svg>
        {showPercentage && (
          <span style={{
  color: '#c9d1d9'
}}>{Math.round(percentage)}%</span>
        )}
        {label && <span style={{
  color: '#c9d1d9'
}}>{label}</span>}
      </div>
    );
  }

  return (
    <div style={{
  width: '100%'
}} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      {label && (
        <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
          <span style={{
  color: '#c9d1d9'
}}>{label}</span>
          {showPercentage && (
            <span style={{
  color: '#c9d1d9'
}}>{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div style={{
  width: '100%',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '50%',
  height: '8px',
  overflow: 'hidden'
}}>
        <div
          style={{
  height: '100%',
  borderRadius: '50%'
}}
        />
      </div>
    </div>
  );
};




export default ProgressIndicator
