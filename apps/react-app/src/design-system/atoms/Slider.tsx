import React, { useState } from 'react';
import { colors, radii, spacing } from '../tokens';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = false,
  formatValue = (v) => v.toString(),
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ width: '100%', opacity: disabled ? 0.5 : 1 }}>
      <div style={{ position: 'relative' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: radii.full,
            outline: 'none',
            appearance: 'none',
            background: `linear-gradient(to right, ${colors.brand.primary} 0%, ${colors.brand.primary} ${percentage}%, ${colors.bg.tertiary} ${percentage}%, ${colors.bg.tertiary} 100%)`,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
        {showValue && (
          <div
            style={{
              position: 'absolute',
              top: '-32px',
              left: `calc(${percentage}% - 20px)`,
              backgroundColor: colors.bg.elevated,
              color: colors.text.primary,
              padding: `${spacing[1]} ${spacing[2]}`,
              borderRadius: radii.sm,
              fontSize: '12px',
              opacity: isDragging ? 1 : 0,
              transition: 'opacity 150ms ease-out',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {formatValue(value)}
          </div>
        )}
      </div>
      <style>
        {`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${colors.brand.primary};
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${colors.brand.primary};
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          input[type="range"]:disabled::-webkit-slider-thumb {
            cursor: not-allowed;
          }
          input[type="range"]:disabled::-moz-range-thumb {
            cursor: not-allowed;
          }
        `}
      </style>
    </div>
  );
};
