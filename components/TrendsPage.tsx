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
    Clock,
    Zap,
    MessageCircle,
    ClipboardCheck,
    Target,
    AlertTriangle,
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
    Cell,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
} from 'recharts';
import { cn } from '@/lib/utils';
import { CallData } from '@/lib/mock-data';
import { subDays, subMonths, format, startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';

interface TrendsPageProps {
    data: CallData[];
}

export default function TrendsPage({ data }: TrendsPageProps) {
    const [mode, setMode] = React.useState<'wow' | 'mom'>('wow');

    const maxDate = React.useMemo(() => {
        if (!data || data.length === 0) return new Date();
        const maxTime = Math.max(...data.map(d => parseISO(d.call_time).getTime()));
        return new Date(maxTime);
    }, [data]);

    const stats = React.useMemo(() => {
        const now = maxDate;
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
            if (items.length === 0) return { count: 0, score: 0, conv: 0, duration: 0, leadScore: 0, comm: 0, process: 0, sales: 0 };
            const totalScore = items.reduce((acc, curr) => acc + curr.final_score, 0);
            const converted = items.filter(i => i.crs_booking_status === 'Converted').length;
            const totalDuration = items.reduce((acc, curr) => acc + curr.call_duration, 0);
            const totalLead = items.reduce((acc, curr) => acc + curr.lead_score, 0);
            const totalComm = items.reduce((acc, curr) => acc + curr.customer_experience_score, 0);
            const totalProcess = items.reduce((acc, curr) => acc + curr.communication_score, 0);
            const totalSales = items.reduce((acc, curr) => acc + curr.sales_strategy_score, 0);
            return {
                count: items.length,
                score: Math.round(totalScore / items.length),
                conv: Math.round((converted / items.length) * 100),
                duration: Math.round(totalDuration / items.length),
                leadScore: Math.round(totalLead / items.length),
                comm: Math.round((totalComm / items.length / 25) * 100),
                process: Math.round((totalProcess / items.length / 40) * 100),
                sales: Math.round((totalSales / items.length / 50) * 100),
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
            duration: { current: currentMetrics.duration, delta: calculateDelta(currentMetrics.duration, prevMetrics.duration), isPos: currentMetrics.duration <= prevMetrics.duration },
            leadScore: { current: currentMetrics.leadScore, delta: calculateDelta(currentMetrics.leadScore, prevMetrics.leadScore), isPos: currentMetrics.leadScore >= prevMetrics.leadScore },
            comm: { current: currentMetrics.comm, prev: prevMetrics.comm, delta: calculateDelta(currentMetrics.comm, prevMetrics.comm), isPos: currentMetrics.comm >= prevMetrics.comm },
            process: { current: currentMetrics.process, prev: prevMetrics.process, delta: calculateDelta(currentMetrics.process, prevMetrics.process), isPos: currentMetrics.process >= prevMetrics.process },
            sales: { current: currentMetrics.sales, prev: prevMetrics.sales, delta: calculateDelta(currentMetrics.sales, prevMetrics.sales), isPos: currentMetrics.sales >= prevMetrics.sales },
        };
    }, [data, mode]);

    // Skill sub-score trend data (computed from actual data)
    const skillTrendData = React.useMemo(() => {
        const now = maxDate;
        if (mode === 'wow') {
            const days = eachDayOfInterval({ start: subDays(now, 6), end: now });
            return days.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayCalls = data.filter(d => d.call_time.startsWith(dayStr));
                if (dayCalls.length === 0) return { name: format(day, 'EEE'), comm: 0, process: 0, sales: 0, leadScore: 0 };
                return {
                    name: format(day, 'EEE'),
                    comm: Math.round((dayCalls.reduce((a, c) => a + c.customer_experience_score, 0) / dayCalls.length / 25) * 100),
                    process: Math.round((dayCalls.reduce((a, c) => a + c.communication_score, 0) / dayCalls.length / 40) * 100),
                    sales: Math.round((dayCalls.reduce((a, c) => a + c.sales_strategy_score, 0) / dayCalls.length / 50) * 100),
                    leadScore: Math.round(dayCalls.reduce((a, c) => a + c.lead_score, 0) / dayCalls.length),
                };
            });
        } else {
            const weeks = eachWeekOfInterval({ start: subDays(now, 28), end: now });
            return weeks.map((weekStart, i) => {
                const weekEnd = subDays(weekStart, -6);
                const weekCalls = data.filter(d => {
                    const date = parseISO(d.call_time);
                    return date >= weekStart && date <= weekEnd;
                });
                if (weekCalls.length === 0) return { name: `W${i + 1}`, comm: 0, process: 0, sales: 0, leadScore: 0 };
                return {
                    name: `W${i + 1}`,
                    comm: Math.round((weekCalls.reduce((a, c) => a + c.customer_experience_score, 0) / weekCalls.length / 25) * 100),
                    process: Math.round((weekCalls.reduce((a, c) => a + c.communication_score, 0) / weekCalls.length / 40) * 100),
                    sales: Math.round((weekCalls.reduce((a, c) => a + c.sales_strategy_score, 0) / weekCalls.length / 50) * 100),
                    leadScore: Math.round(weekCalls.reduce((a, c) => a + c.lead_score, 0) / weekCalls.length),
                };
            });
        }
    }, [data, mode]);

    // Quality score trend data (computed from actual data)
    const trendData = React.useMemo(() => {
        const now = maxDate;
        if (mode === 'wow') {
            const days = eachDayOfInterval({ start: subDays(now, 6), end: now });
            return days.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayCalls = data.filter(d => d.call_time.startsWith(dayStr));
                return {
                    name: format(day, 'EEE'),
                    score: dayCalls.length > 0 ? Math.round(dayCalls.reduce((a, c) => a + c.final_score, 0) / dayCalls.length) : 0,
                    calls: dayCalls.length,
                };
            });
        } else {
            const weeks = eachWeekOfInterval({ start: subDays(now, 28), end: now });
            return weeks.map((weekStart, i) => {
                const weekEnd = subDays(weekStart, -6);
                const weekCalls = data.filter(d => {
                    const date = parseISO(d.call_time);
                    return date >= weekStart && date <= weekEnd;
                });
                return {
                    name: `Week ${i + 1}`,
                    score: weekCalls.length > 0 ? Math.round(weekCalls.reduce((a, c) => a + c.final_score, 0) / weekCalls.length) : 0,
                    calls: weekCalls.length,
                };
            });
        }
    }, [data, mode]);

    // Coaching feedback tag trends (computed from actual data)
    const feedbackTrend = React.useMemo(() => {
        const now = new Date();
        const prevStart = mode === 'wow' ? startOfWeek(subDays(now, 7)) : startOfMonth(subMonths(now, 1));
        const prevEnd = mode === 'wow' ? endOfWeek(subDays(now, 7)) : endOfMonth(subMonths(now, 1));
        const currStart = mode === 'wow' ? startOfWeek(now) : startOfMonth(now);
        const currEnd = mode === 'wow' ? endOfWeek(now) : endOfMonth(now);

        const getTagCounts = (items: CallData[]) => {
            const counts: Record<string, number> = {};
            items.forEach(call => {
                call.coaching_feedback.forEach(tag => {
                    counts[tag] = (counts[tag] || 0) + 1;
                });
            });
            return counts;
        };

        const prevCalls = data.filter(d => {
            const date = parseISO(d.call_time);
            return isWithinInterval(date, { start: prevStart, end: prevEnd });
        });

        const currCalls = data.filter(d => {
            const date = parseISO(d.call_time);
            return isWithinInterval(date, { start: currStart, end: currEnd });
        });

        const prevCounts = getTagCounts(prevCalls);
        const currCounts = getTagCounts(currCalls);

        const allTags = Array.from(new Set([...Object.keys(prevCounts), ...Object.keys(currCounts)]));

        return allTags.map(tag => ({
            tag,
            prev: prevCounts[tag] || 0,
            curr: currCounts[tag] || 0,
            delta: (currCounts[tag] || 0) - (prevCounts[tag] || 0),
        })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 6);
    }, [data, mode]);

    // Data-driven improvement highlights
    const improvementHighlights = React.useMemo(() => {
        const highlights: { title: string; improvement: string; desc: string; isPos: boolean }[] = [];

        if (stats.comm.isPos && stats.comm.current > 0) {
            highlights.push({
                title: 'Customer Experience',
                improvement: stats.comm.delta,
                desc: `Customer Experience improved from ${stats.comm.prev}% to ${stats.comm.current}%.`,
                isPos: true,
            });
        }
        if (stats.process.isPos && stats.process.current > 0) {
            highlights.push({
                title: 'Communication',
                improvement: stats.process.delta,
                desc: `Communication scores moved from ${stats.process.prev}% to ${stats.process.current}%.`,
                isPos: true,
            });
        }
        if (stats.sales.isPos && stats.sales.current > 0) {
            highlights.push({
                title: 'Sales Strategy',
                improvement: stats.sales.delta,
                desc: `Sales strategy rating went from ${stats.sales.prev}% to ${stats.sales.current}%.`,
                isPos: true,
            });
        }

        // Add negative ones if no positives
        if (!stats.comm.isPos && stats.comm.current > 0) {
            highlights.push({
                title: 'Customer Experience',
                improvement: stats.comm.delta,
                desc: `Customer Experience dropped from ${stats.comm.prev}% to ${stats.comm.current}%. Needs focus.`,
                isPos: false,
            });
        }
        if (!stats.process.isPos && stats.process.current > 0) {
            highlights.push({
                title: 'Communication',
                improvement: stats.process.delta,
                desc: `Communication scores dipped from ${stats.process.prev}% to ${stats.process.current}%.`,
                isPos: false,
            });
        }
        if (!stats.sales.isPos && stats.sales.current > 0) {
            highlights.push({
                title: 'Sales Strategy',
                improvement: stats.sales.delta,
                desc: `Sales strategy scores declined from ${stats.sales.prev}% to ${stats.sales.current}%.`,
                isPos: false,
            });
        }

        return highlights.slice(0, 3);
    }, [stats]);

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

            {/* Core KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                <TrendCard title="Call Volume" value={stats.volume.current} delta={stats.volume.delta} isPos={stats.volume.isPos} icon={<PhoneCall className="w-5 h-5" />} color="blue" />
                <TrendCard title="Avg Quality Score" value={`${stats.score.current}/100`} delta={stats.score.delta} isPos={stats.score.isPos} icon={<Star className="w-5 h-5" />} color="orange" />
                <TrendCard title="Conversion Rate" value={`${stats.conv.current}%`} delta={stats.conv.delta} isPos={stats.conv.isPos} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
                <TrendCard title="Avg Lead Score" value={stats.leadScore.current} delta={stats.leadScore.delta} isPos={stats.leadScore.isPos} icon={<Zap className="w-5 h-5" />} color="purple" />
                <TrendCard title="Avg Duration" value={`${Math.floor(stats.duration.current / 60)}m ${stats.duration.current % 60}s`} delta={stats.duration.delta} isPos={!stats.duration.isPos} icon={<Clock className="w-5 h-5" />} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quality Trend Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Quality Score Trend</h3>
                            <p className="text-xs text-slate-400 mt-1">Average performance score over time</p>
                        </div>
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            stats.score.isPos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        )}>
                            {stats.score.isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {stats.score.isPos ? 'Improving' : 'Declining'}
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
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[0, 100]} />
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

            {/* NEW: Skill Sub-Score Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Skill Sub-Score Trends</h3>
                            <p className="text-xs text-slate-400 mt-1">Communication, Process & Sales skills over time</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={skillTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                                <Line type="monotone" dataKey="comm" name="Customer Exp %" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                                <Line type="monotone" dataKey="process" name="Communication %" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                                <Line type="monotone" dataKey="sales" name="Sales Strategy %" stroke="#E35205" strokeWidth={3} dot={{ fill: '#E35205', r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Lead Score Trend */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Lead Score Trend</h3>
                            <p className="text-xs text-slate-400 mt-1">Average lead quality score over time</p>
                        </div>
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            stats.leadScore.isPos ? "bg-purple-50 text-purple-700" : "bg-rose-50 text-rose-700"
                        )}>
                            {stats.leadScore.isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {stats.leadScore.delta}
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={skillTrendData}>
                                <defs>
                                    <linearGradient id="colorLead" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="leadScore" name="Lead Score" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorLead)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* NEW: Coaching Feedback Tag Trends */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Coaching Feedback Trends</h3>
                        <p className="text-xs text-slate-400 mt-1">How feedback tag frequency changed {mode === 'wow' ? 'week over week' : 'month over month'}</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-slate-300" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {feedbackTrend.map((item) => (
                        <div key={item.tag} className="border border-slate-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-md transition-all duration-300">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-slate-700 text-xs leading-tight pr-2">{item.tag}</h4>
                                <span className={cn(
                                    "text-xs font-black px-2 py-0.5 rounded-full shrink-0",
                                    item.delta < 0 ? "bg-emerald-50 text-emerald-700" : item.delta > 0 ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-500"
                                )}>
                                    {item.delta > 0 ? '+' : ''}{item.delta}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                <span>Prev: <span className="font-bold text-slate-600">{item.prev}</span></span>
                                <span>→</span>
                                <span>Current: <span className="font-bold text-slate-600">{item.curr}</span></span>
                            </div>
                            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                                <div
                                    className={cn("h-1.5 rounded-full transition-all",
                                        item.delta < 0 ? "bg-emerald-500" : item.delta > 0 ? "bg-rose-500" : "bg-slate-300"
                                    )}
                                    style={{ width: `${Math.min(100, Math.max(10, (item.curr / Math.max(item.prev, item.curr, 1)) * 100))}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Data-Driven Improvement Highlights */}
            <div className="bg-gradient-to-br from-[#FFF5F0] to-white rounded-2xl p-8 border border-orange-100 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-[#E35205] rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-900">Improvement Highlights</h3>
                        <p className="text-slate-500 text-sm font-medium">Data-driven insights from {mode === 'wow' ? 'week-over-week' : 'month-over-month'} comparison</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {improvementHighlights.length > 0 ? improvementHighlights.map((h, i) => (
                        <HighlightItem key={i} title={h.title} improvement={h.improvement} desc={h.desc} isPos={h.isPos} />
                    )) : (
                        <div className="col-span-3 text-center py-8 text-slate-400">
                            <p className="text-sm font-semibold">Not enough data to compute improvement trends yet.</p>
                        </div>
                    )}
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
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-all duration-300">
            <div className={cn("p-3 rounded-xl mb-3 transition-transform group-hover:scale-110 duration-300", colorClasses[color])}>
                {icon}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h4 className="text-xl font-black text-slate-800 mb-2">{value}</h4>
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

function HighlightItem({ title, improvement, desc, isPos }: any) {
    return (
        <div className="bg-white border border-slate-100 rounded-xl p-5 hover:border-orange-200 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                <span className={cn(
                    "font-black text-sm",
                    isPos ? "text-emerald-600" : "text-rose-600"
                )}>{improvement}</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">{desc}</p>
        </div>
    );
}
