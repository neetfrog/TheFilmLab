import { useCallback, useEffect, useRef, type PointerEvent } from 'react';

type CurveChannel = 'master' | 'r' | 'g' | 'b';

type Curves = {
  master: [number, number][];
  r: [number, number][];
  g: [number, number][];
  b: [number, number][];
};

const channelLabels: Record<CurveChannel, string> = {
  master: 'Master',
  r: 'Red',
  g: 'Green',
  b: 'Blue',
};

const channelColors: Record<CurveChannel, string> = {
  master: '#facc15',
  r: '#f87171',
  g: '#4ade80',
  b: '#60a5fa',
};

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

export default function CurvesEditor({
  activeChannel,
  setActiveChannel,
  curves,
  onCurveChange,
}: {
  activeChannel: CurveChannel;
  setActiveChannel: (channel: CurveChannel) => void;
  curves: Curves;
  onCurveChange: (channel: CurveChannel, points: [number, number][]) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef<{ channel: CurveChannel; index: number } | null>(null);

  const activePoints = activeChannel === 'master' ? curves.master : curves[activeChannel];
  const activeColor = channelColors[activeChannel];

  const padding = 12;
  const size = 240;
  const innerSize = size - padding * 2;

  const getPointData = useCallback((points: [number, number][]) =>
    points.map(([x, y]) => `${padding + x * innerSize},${padding + (1 - y) * innerSize}`).join(' '),
  [padding, innerSize]);

  const updateDraggedPoint = useCallback((event: PointerEvent) => {
    const drag = draggingRef.current;
    if (!drag || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    let x = clamp((event.clientX - rect.left) / rect.width);
    let y = clamp(1 - (event.clientY - rect.top) / rect.height);

    const points = curves[drag.channel];
    const minX = drag.index === 0 ? 0 : points[drag.index - 1][0] + 0.02;
    const maxX = drag.index === points.length - 1 ? 1 : points[drag.index + 1][0] - 0.02;
    if (drag.index === 0) x = 0;
    if (drag.index === points.length - 1) x = 1;
    x = clamp(x, minX, maxX);

    const nextPoints = points.map((point, index) =>
      index === drag.index ? [x, y] as [number, number] : point,
    );

    onCurveChange(drag.channel, nextPoints);
  }, [curves, onCurveChange]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => updateDraggedPoint(event);
    const handlePointerUp = () => {
      draggingRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [updateDraggedPoint]);

  const startDrag = useCallback((channel: CurveChannel, index: number) => (event: PointerEvent<SVGCircleElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = { channel, index };
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold text-zinc-200">Curves</div>
        </div>
        <div className="flex gap-1">
          {(Object.keys(channelLabels) as CurveChannel[]).map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => setActiveChannel(channel)}
              className={`rounded-full p-2 transition ${activeChannel === channel ? 'bg-zinc-700' : 'bg-zinc-800 hover:bg-zinc-700'}`}
              style={activeChannel === channel ? { boxShadow: `0 0 0 1px ${channelColors[channel]}` } : undefined}
              aria-label={channelLabels[channel]}
            >
              <span
                className="inline-flex h-3.5 w-3.5 rounded-full border border-zinc-900 shadow-sm"
                style={{ backgroundColor: channel === 'master' ? '#ffffff' : channelColors[channel] }}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="px-3 pb-3">
        <div className="relative rounded-2xl bg-zinc-900 overflow-hidden aspect-square border border-zinc-800">
          <svg ref={svgRef} viewBox="0 0 240 240" className="w-full h-full touch-none">
            <rect x="0" y="0" width="240" height="240" fill="#0f172a" />
            {[0.2, 0.4, 0.6, 0.8].map((value) => {
              const pos = padding + value * innerSize;
              return (
                <g key={value} stroke="rgba(148,163,184,0.14)" strokeWidth="1">
                  <line x1={padding} y1={pos} x2={padding + innerSize} y2={pos} />
                  <line x1={pos} y1={padding} x2={pos} y2={padding + innerSize} />
                </g>
              );
            })}
            <polyline
              points={getPointData(activePoints)}
              fill="none"
              stroke={activeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {activePoints.map(([x, y], index) => (
              <g key={index} className="cursor-pointer" onPointerDown={startDrag(activeChannel, index)}>
                <circle
                  cx={padding + x * innerSize}
                  cy={padding + (1 - y) * innerSize}
                  r="10"
                  fill="rgba(255,255,255,0.12)"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="2"
                />
                <circle
                  cx={padding + x * innerSize}
                  cy={padding + (1 - y) * innerSize}
                  r="6"
                  fill={activeColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            ))}
            <path d={`M${padding},${padding + innerSize} L${padding + innerSize},${padding}`} stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </div>
  );
}
