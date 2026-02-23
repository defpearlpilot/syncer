import React from 'react';
import { ScoringDimension } from '../../types';

interface Props {
  dimension: ScoringDimension;
  value: number | null;
  onChange: (value: number) => void;
  readOnly?: boolean;
}

export function ScoreInput({ dimension, value, onChange, readOnly }: Props) {
  const { scale_type, scale_config } = dimension;

  if (scale_type === 'numeric_range') {
    const min = scale_config.min ?? 1;
    const max = scale_config.max ?? 5;
    const step = scale_config.step ?? 1;

    return (
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={readOnly}
          className="flex-1 h-2 accent-indigo-600"
        />
        <span className="text-sm font-mono w-8 text-center text-gray-700">
          {value ?? '-'}
        </span>
      </div>
    );
  }

  if (scale_type === 't_shirt') {
    const options = scale_config.options || [];
    const values = scale_config.values || [];

    return (
      <div className="flex gap-1">
        {options.map((label: string, idx: number) => {
          const val = values[idx];
          const isSelected = value === val;
          return (
            <button
              key={label}
              type="button"
              onClick={() => !readOnly && onChange(val)}
              disabled={readOnly}
              className={`px-2 py-1 text-xs rounded border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  if (scale_type === 'custom_labels') {
    const options = scale_config.options || [];

    return (
      <div className="flex gap-1">
        {options.map((opt: { label: string; value: number }) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => !readOnly && onChange(opt.value)}
              disabled={readOnly}
              className={`px-2 py-1 text-xs rounded border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return <span className="text-sm text-gray-400">Unknown scale</span>;
}
