"use client";

import React from 'react';

const SEGMENTS = [
    { key: 'available', label: 'Available', color: '#22c55e' },
    { key: 'onKol', label: 'On KOL', color: '#3b82f6' },
    { key: 'unreturn', label: 'Unreturn', color: '#f43f5e' },
] as const;

export function DashboardDonutChart({
    availableCount,
    onKolCount,
    unreturnCount
}: {
    availableCount: number,
    onKolCount: number,
    unreturnCount: number
}) {
    const total = availableCount + onKolCount + unreturnCount;
    const values = [availableCount, onKolCount, unreturnCount];

    // Build SVG arcs
    const radius = 80;
    const strokeWidth = 28;
    const center = 100;
    const circumference = 2 * Math.PI * radius;
    const gap = 8; // gap in degrees between segments

    const arcs: { offset: number; length: number; color: string }[] = [];
    let accumulated = 0;

    if (total > 0) {
        const totalGap = gap * values.filter(v => v > 0).length;
        const availableDeg = 360 - totalGap;

        values.forEach((value, i) => {
            if (value <= 0) return;
            const segDeg = (value / total) * availableDeg;
            const segLen = (segDeg / 360) * circumference;
            const segOffset = (accumulated / 360) * circumference;
            arcs.push({
                offset: segOffset,
                length: segLen,
                color: SEGMENTS[i].color,
            });
            accumulated += segDeg + gap;
        });
    }

    return (
        <div className="h-[300px] w-full flex flex-col items-center justify-center bg-white/50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 shadow-lg group hover:border-black/10 dark:hover:border-white/[0.15] transition-colors relative overflow-hidden">
            <h3 className="w-full text-left font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Inventory Distribution</h3>

            <div className="flex-1 flex items-center justify-center w-full">
                <svg viewBox="0 0 200 200" className="w-[180px] h-[180px]" role="img" aria-label={`Inventory distribution: ${availableCount} Available, ${onKolCount} On KOL, ${unreturnCount} Unreturn out of ${total} total units`}>
                    {/* Background ring */}
                    <circle
                        cx={center} cy={center} r={radius}
                        fill="none"
                        stroke="currentColor"
                        className="text-neutral-200 dark:text-neutral-800"
                        strokeWidth={strokeWidth}
                    />
                    {/* Segments */}
                    {arcs.map((arc, i) => (
                        <circle
                            key={i}
                            cx={center} cy={center} r={radius}
                            fill="none"
                            stroke={arc.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                            strokeDashoffset={-arc.offset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${center} ${center})`}
                            className="transition-all duration-700 ease-out"
                        />
                    ))}
                    {/* Center text */}
                    <text x={center} y={center - 6} textAnchor="middle" className="fill-neutral-900 dark:fill-white text-2xl font-bold" style={{ fontSize: '28px', fontWeight: 800 }}>
                        {total}
                    </text>
                    <text x={center} y={center + 14} textAnchor="middle" className="fill-neutral-500 text-xs" style={{ fontSize: '11px' }}>
                        Total Units
                    </text>
                </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-2">
                {SEGMENTS.map((seg, i) => (
                    <div key={seg.key} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                            {seg.label} ({values[i]})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
