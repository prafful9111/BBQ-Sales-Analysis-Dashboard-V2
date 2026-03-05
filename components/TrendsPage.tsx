'use client';

import React from 'react';
import {
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    BarChart3,
    PieChart as PieChartIcon,
    Users,
    PhoneCall,
    Star,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { CallData } from '@/lib/mock-data';
import { subDays, subMonths, format, startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

interface TrendsPageProps {
    data: CallData[];
}

export default function TrendsPage({ data }: TrendsPageProps) {
    const [mode, setMode] = React.useState<'wow' | 'mom'>('wow');

    const stats = React.useMemo(() => {
        const now = new Date();
        let currentStart, currentEnd, prevStart, prevEnd;

        if (mode === 'wow') {
            currentStart = startOfWeek(subDays(now, 0));
            currentEnd = endOfWeek(subDays(now, 0));
            prevStart = startOfWeek(subDays(now, 7));
            prevEnd = endOfWeek(subDays(now, 7));
        } else {
            currentStart = startOfMonth(subDays(now, 0));
            currentEnd = endOfMonth(subDays(now, 0));
            prevStart = startOfMonth(subMonths(now, 1));
            prevEnd = endOfMonth(subMonths(now, 1));
        }

        const currentData = data.filter(d => {
            const date = new Date(d.call_time);
            return isWithinInterval(date, { start: currentStart, end: currentEnd });
        });

        const prevData = data.filter(d => {
            const date = new Date(d.call_time);
            return isWithinInterval(date, { start: prevStart, end: prevEnd });
        });

        const getMetrics = (items: CallData[]) => {
            if (items.length === 0) return { count: 0, score: 0, conv: 0, duration: 0 };
            const totalScore = items.reduce((acc, curr) => acc + curr.final_score, 0);
            const converted = items.filter(i => i.crs_booking_status === 'Converted').length;
            const totalDuration = items.reduce((acc, curr) => acc + curr.call_duration, 0);
            return {
                count: items.length,
                score: Math.round(totalScore / items.length),
                conv: Math.round((converted / items.length) * 100),
                duration: Math.round(totalDuration / items.length)
            };
        };

        const currentMetrics = getMetrics(currentData);
        const prevMetrics = getMetrics(prevData);

        const calculateDelta = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? '+100%' : '0%';
            const delta = ((curr - prev) / prev) * 100;
            return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`;
        };

        return {
            volume: { current: currentMetrics.count, delta: calculateDelta(currentMetrics.count, prevMetrics.count), isPos: currentMetrics.count >= prevMetrics.count },
            score: { current: currentMetrics.score, delta: calculateDelta(currentMetrics.score, prevMetrics.score), isPos: currentMetrics.score >= prevMetrics.score },
            conv: { current: currentMetrics.conv, delta: calculateDelta(currentMetrics.conv, prevMetrics.conv), isPos: currentMetrics.conv >= prevMetrics.conv },
            duration: { current: currentMetrics.duration, delta: calculateDelta(currentMetrics.duration, prevMetrics.duration), isPos: currentMetrics.duration <= prevMetrics.duration } // Lower duration is often better
        };
    }, [data, mode]);

    // Mock Trend Chart Data
    const trendData = React.useMemo(() => {
        if (mode === 'wow') {
            return [
                { name: 'Mon', score: 72, calls: 45 },
                { name: 'Tue', score: 75, calls: 52 },
                { name: 'Wed', score: 71, calls: 48 },
                { name: 'Thu', score: 78, calls: 61 },
                { name: 'Fri', score: 82, calls: 58 },
                { name: 'Sat', score: 80, calls: 65 },
                { name: 'Sun', score: 83, calls: 42 },
            ];
        } else {
            return [
                { name: 'Week 1', score: 71, calls: 240 },
                { name: 'Week 2', score: 74, calls: 280 },
                { name: 'Week 3', score: 79, calls: 310 },
                { name: 'Week 4', score: 81, calls: 295 },
            ];
        }
    }, [mode]);

    return (
        <div className="space-y-8">
            {/* Mode Selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setMode('wow')}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                            mode === 'wow' ? "bg-orange-50 text-[#E35205] shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        Week on Week
                    </button>
                    <button
                        onClick={() => setMode('mom')}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                            mode === 'mom' ? "bg-orange-50 text-[#E35205] shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        Month on Month
                    </button>
                </div>

                <div className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#E35205]" />
                    Showing trends for <span className="text-slate-800">{mode === 'wow' ? 'Current Week vs Last Week' : 'Current Month vs Last Month'}</span>
                </div>
            </div>

            {/* Improvement KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <TrendCard
                    title="Call Volume"
                    value={stats.volume.current}
                    delta={stats.volume.delta}
                    isPos={stats.volume.isPos}
                    icon={<PhoneCall className="w-5 h-5" />}
                    color="blue"
                />
                <TrendCard
                    title="Avg Quality Score"
                    value={`${stats.score.current}/100`}
                    delta={stats.score.delta}
                    isPos={stats.score.isPos}
                    icon={<Star className="w-5 h-5" />}
                    color="orange"
                />
                <TrendCard
                    title="Conversion Rate"
                    value={`${stats.conv.current}%`}
                    delta={stats.conv.delta}
                    isPos={stats.conv.isPos}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="emerald"
                />
                <TrendCard
                    title="Avg Duration"
                    value={`${Math.floor(stats.duration.current / 60)}m ${stats.duration.current % 60}s`}
                    delta={stats.duration.delta}
                    isPos={!stats.duration.isPos} // Lower duration is better
                    icon={<Clock className="w-5 h-5" />}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quality Trend Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Quality Score Trend</h3>
                            <p className="text-xs text-slate-400 mt-1">Average performance score over time</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <TrendingUp className="w-3 h-3" />
                            Improving
                        </div>
                    </div>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#E35205" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#E35205" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[60, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#E35205" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Call Volume Trend */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Call Volume Distribution</h3>
                            <p className="text-xs text-slate-400 mt-1">Total analyzed calls per period</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="calls" fill="#E35205" fillOpacity={0.6} radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Improvement Highlights */}
            <div className="bg-gradient-to-br from-[#FFF5F0] to-white rounded-2xl p-8 border border-orange-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-[#E35205] rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-900">Improvement Highlights</h3>
                        <p className="text-slate-500 text-sm font-medium">Key areas where the team has performed better</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <HighlightItem
                        title="Greeting & Intro"
                        improvement="+12.4%"
                        desc="Agents are consistently following the standardized greeting script."
                    />
                    <HighlightItem
                        title="Objection Handling"
                        improvement="+8.7%"
                        desc="Refined responses to 'Price' concerns have increased conversion."
                    />
                    <HighlightItem
                        title="Closing Technique"
                        improvement="+15.2%"
                        desc="Assumptive closes are being used more effectively across all outlets."
                    />
                </div>
            </div>
        </div>
    );
}

function TrendCard({ title, value, delta, isPos, icon, color }: any) {
    const colorClasses: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        orange: "bg-orange-50 text-[#E35205] border-orange-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-all duration-300">
            <div className={cn("p-3 rounded-xl mb-4 transition-transform group-hover:scale-110 duration-300", colorClasses[color])}>
                {icon}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h4 className="text-2xl font-black text-slate-800 mb-3">{value}</h4>
            <div className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-colors",
                isPos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}>
                {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {delta}
            </div>
        </div>
    );
}

function HighlightItem({ title, improvement, desc }: any) {
    return (
        <div className="bg-white border border-slate-100 rounded-xl p-5 hover:border-orange-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                <span className="text-[#E35205] font-black text-sm">{improvement}</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">{desc}</p>
        </div>
    );
}
