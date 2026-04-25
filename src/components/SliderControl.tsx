import type { ReactNode } from 'react';
import { ResetIcon, SliderLabelIcon } from '../App.helpers';

export default function SliderControl({
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  onChange,
  format,
  icon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  onChange: (v: number | null) => void;
  format: (v: number) => string;
  icon?: ReactNode;
}) {
  const isModified = Math.abs(value - defaultValue) > step * 0.5;

  const displayedIcon = icon ?? <SliderLabelIcon />;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-0.5">
        <label className={`text-[11px] font-medium transition-colors ${isModified ? 'text-amber-500/80' : 'text-zinc-500'}`}>
          <span className="inline-flex items-center gap-2">
            {displayedIcon}
            {label}
          </span>
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600 font-mono tabular-nums">{format(value)}</span>
          {isModified && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="text-zinc-700 hover:text-amber-400 transition-colors p-0.5"
              title="Reset"
            >
              <ResetIcon />
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
      />
    </div>
  );
}
