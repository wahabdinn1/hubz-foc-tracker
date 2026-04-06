"use client";

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f43f5e'];

export function DashboardDonutChart({ 
    availableCount, 
    onKolCount, 
    unreturnCount 
}: { 
    availableCount: number, 
    onKolCount: number, 
    unreturnCount: number 
}) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    const data = [
        { name: 'Available', value: availableCount },
        { name: 'On KOL', value: onKolCount },
        { name: 'Unreturn', value: unreturnCount },
    ];

    if (!isMounted) return <div className="h-[300px] w-full animate-pulse bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl" />;

    return (
        <div className="h-[300px] w-full flex flex-col items-center justify-center bg-white/50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 shadow-lg group hover:border-black/10 dark:hover:border-white/[0.15] transition-colors relative overflow-hidden">
            <h3 className="w-full text-left font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Inventory Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '12px', 
                            border: '1px solid rgba(0,0,0,0.1)', 
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        }}
                        itemStyle={{ fontWeight: 600 }}
                    />
                    <Legend 
                         verticalAlign="bottom" 
                         height={36} 
                         iconType="circle"
                         wrapperStyle={{ paddingTop: '20px' }}
                         formatter={(value: any) => <span className="text-neutral-600 dark:text-neutral-300 font-medium text-sm ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
