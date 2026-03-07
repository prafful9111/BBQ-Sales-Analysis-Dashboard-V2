'use client';

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'motion/react';
import {
    Star, Target, TrendingUp, TrendingDown, Phone, Clock, Flame,
    ChevronDown, ArrowLeft, AlertTriangle, Award, X,
    PhoneCall, Users, Zap, DollarSign, Eye, Medal, Crown,
    ArrowUpRight, ArrowDownRight, BarChart3, ChevronRight,
    CheckCircle2, XCircle, Hourglass
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CallData } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface AgentPerformancePageProps {
    data: CallData[];
    selectedAgent: string;
    setSelectedAgent: (agent: string) => void;
    goBack: () => void;
}

export default function AgentPerformancePage({ data, selectedAgent, setSelectedAgent, goBack }: AgentPerformancePageProps) {
    const [callFilter, setCallFilter] = React.useState<'All' | 'Converted' | 'Non-Converted' | 'Pending'>('All');
    const [sortBy, setSortBy] = React.useState<'date' | 'score' | 'duration'>('date');
    const [selectedCall, setSelectedCall] = React.useState<CallData | null>(null);

    const agents = React.useMemo(() => {
        return Array.from(new Set(data.map(d => d.agent_username))).sort();
    }, [data]);

    // Build aggregated data for all agents (for grid view)
    const allAgentStats = React.useMemo(() => {
        return agents.map(name => {
            const calls = data.filter(d => d.agent_username === name);
            const total = calls.length;
            const converted = calls.filter(d => d.crs_booking_status === 'Converted').length;
            const avgScore = calls.reduce((a, c) => a + c.final_score, 0) / total;
            const avgDuration = calls.reduce((a, c) => a + c.call_duration, 0) / total;
            const highIntent = calls.filter(d => d.initial_intent_tag === 'High Intent').length;
            const missedOpp = calls.filter(d => d.initial_intent_tag === 'High Intent' && d.crs_booking_status !== 'Converted').length;
            const convRate = (converted / total) * 100;
            const tl = calls[0]?.tl_name || 'N/A';

            // Determine performance tier
            let tier: 'excellent' | 'good' | 'average' | 'poor' = 'average';
            if (avgScore >= 90 && convRate >= 45) tier = 'excellent';
            else if (avgScore >= 85 && convRate >= 35) tier = 'good';
            else if (avgScore < 75 || convRate < 25) tier = 'poor';

            return { name, total, converted, avgScore, avgDuration, highIntent, missedOpp, convRate, tl, tier };
        }).sort((a, b) => b.avgScore - a.avgScore);
    }, [agents, data]);

    const agentData = React.useMemo(() => {
        if (!selectedAgent || selectedAgent === 'All') return null;
        return data.filter(d => d.agent_username === selectedAgent);
    }, [data, selectedAgent]);

    const agentStats = React.useMemo(() => {
        if (!agentData || agentData.length === 0) return null;
        const total = agentData.length;
        const converted = agentData.filter(d => d.crs_booking_status === 'Converted').length;
        const nonConverted = agentData.filter(d => d.crs_booking_status === 'Non-Converted').length;
        const pending = agentData.filter(d => d.crs_booking_status === 'Pending').length;
        const avgScore = agentData.reduce((a, c) => a + c.final_score, 0) / total;
        const avgDuration = agentData.reduce((a, c) => a + c.call_duration, 0) / total;
        const avgComm = agentData.reduce((a, c) => a + c.customer_experience_score, 0) / total;
        const avgProcess = agentData.reduce((a, c) => a + c.communication_score, 0) / total;
        const avgSales = agentData.reduce((a, c) => a + c.sales_strategy_score, 0) / total;
        const highIntent = agentData.filter(d => d.initial_intent_tag === 'High Intent').length;
        const missedOpp = agentData.filter(d => d.initial_intent_tag === 'High Intent' && d.crs_booking_status !== 'Converted').length;
        const tl = agentData[0]?.tl_name || 'N/A';

        const excellent = agentData.filter(d => d.final_score >= 90).length;
        const good = agentData.filter(d => d.final_score >= 75 && d.final_score < 90).length;
        const average = agentData.filter(d => d.final_score >= 60 && d.final_score < 75).length;
        const poor = agentData.filter(d => d.final_score < 60).length;

        const feedbackCounts: Record<string, number> = {};
        agentData.forEach(call => {
            call.coaching_feedback.forEach(tag => {
                feedbackCounts[tag] = (feedbackCounts[tag] || 0) + 1;
            });
        });
        const topFeedback = Object.entries(feedbackCounts)
            .map(([tag, count]) => ({ tag, count, pct: ((count / total) * 100).toFixed(1) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        const commPct = Number(((avgComm / 25) * 100).toFixed(1));
        const processPct = Number(((avgProcess / 40) * 100).toFixed(1));
        const salesPct = Number(((avgSales / 50) * 100).toFixed(1));

        const convRateRaw = (converted / total) * 100;
        let tier: 'excellent' | 'good' | 'average' | 'poor' = 'average';
        if (avgScore >= 90 && convRateRaw >= 45) tier = 'excellent';
        else if (avgScore >= 85 && convRateRaw >= 35) tier = 'good';
        else if (avgScore < 75 || convRateRaw < 25) tier = 'poor';

        const highlights = [
            avgScore >= 80 ? 'Consistently high quality scores' : null,
            convRateRaw >= 35 ? 'Strong conversion rate' : null,
            salesPct >= 65 ? 'Excellent sales skills' : null,
            processPct >= 65 ? 'Great process adherence' : null,
            commPct >= 65 ? 'Strong communication' : null,
            (avgDuration / 60) <= 3.5 ? 'Efficient call handling' : null,
        ].filter(Boolean) as string[];

        return {
            total, converted, nonConverted, pending,
            convRate: convRateRaw.toFixed(1),
            avgScore: avgScore.toFixed(1),
            avgDuration: (avgDuration / 60).toFixed(1),
            commPct, processPct, salesPct,
            highIntent, missedOpp, tl, tier, highlights,
            scoreDistribution: [
                { name: 'Excellent (90+)', value: excellent, color: '#10b981' },
                { name: 'Good (75-89)', value: good, color: '#f59e0b' },
                { name: 'Average (60-74)', value: average, color: '#fbbf24' },
                { name: 'Poor (<60)', value: poor, color: '#ef4444' },
            ],
            topFeedback,
        };
    }, [agentData]);

    const filteredCalls = React.useMemo(() => {
        if (!agentData) return [];
        let calls = [...agentData];
        if (callFilter !== 'All') calls = calls.filter(d => d.crs_booking_status === callFilter);
        if (sortBy === 'date') calls.sort((a, b) => parseISO(b.call_time).getTime() - parseISO(a.call_time).getTime());
        else if (sortBy === 'score') calls.sort((a, b) => b.final_score - a.final_score);
        else if (sortBy === 'duration') calls.sort((a, b) => b.call_duration - a.call_duration);
        return calls;
    }, [agentData, callFilter, sortBy]);

    // ───────────────── AGENT GRID VIEW ─────────────────
    if (!selectedAgent || selectedAgent === 'All' || !agentStats) {
        const topAgents = allAgentStats.filter(a => a.tier === 'excellent' || a.tier === 'good');
        const bottomAgents = allAgentStats.filter(a => a.tier === 'poor');
        const midAgents = allAgentStats.filter(a => a.tier === 'average');

        return (
            <div className="space-y-8">
                {/* Performance Legends */}
                <div className="flex items-center justify-end gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span> Top Performer</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-200"></span> Average</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></span> Needs Attention</span>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                        <div className="text-2xl font-bold text-slate-800">{agents.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Total Agents</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm text-center">
                        <div className="text-2xl font-bold text-emerald-600">{topAgents.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mt-1">Top Performers</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm text-center">
                        <div className="text-2xl font-bold text-amber-600">{midAgents.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mt-1">Average</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-rose-100 shadow-sm text-center">
                        <div className="text-2xl font-bold text-rose-600">{bottomAgents.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mt-1">Needs Attention</div>
                    </div>
                </div>

                {/* Agent Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allAgentStats.map((agent, i) => {
                        const tierConfig = {
                            excellent: { border: 'border-emerald-200', bg: 'bg-gradient-to-br from-emerald-50/50 to-white', badge: 'bg-emerald-100 text-emerald-700', icon: <Crown className="w-3.5 h-3.5 text-emerald-600" />, label: 'Top' },
                            good: { border: 'border-emerald-100', bg: 'bg-white', badge: 'bg-emerald-50 text-emerald-600', icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />, label: 'Good' },
                            average: { border: 'border-slate-100', bg: 'bg-white', badge: 'bg-amber-50 text-amber-600', icon: <BarChart3 className="w-3.5 h-3.5 text-amber-500" />, label: 'Average' },
                            poor: { border: 'border-rose-200', bg: 'bg-gradient-to-br from-rose-50/60 to-white', badge: 'bg-rose-100 text-rose-700', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />, label: 'Attention' },
                        }[agent.tier];

                        return (
                            <motion.div
                                key={agent.name}
                                whileHover={{ y: -4, scale: 1.01 }}
                                onClick={() => setSelectedAgent(agent.name)}
                                className={cn(
                                    "rounded-xl p-4 border shadow-sm cursor-pointer hover:shadow-lg transition-all group relative",
                                    tierConfig.border, tierConfig.bg,
                                    agent.tier === 'poor' && 'ring-1 ring-rose-100'
                                )}
                            >
                                {/* Tier Badge */}
                                <div className={cn("absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full", tierConfig.badge)}>
                                    {tierConfig.label}
                                </div>

                                {/* Agent Info */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn(
                                        "w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md",
                                        agent.tier === 'poor' ? 'bg-gradient-to-br from-rose-500 to-rose-600' :
                                            agent.tier === 'excellent' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                                                'bg-gradient-to-br from-[#E35205] to-[#FF6B00]'
                                    )}>
                                        {agent.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{agent.name}</h4>
                                        <p className="text-[10px] text-slate-400">{agent.total} calls · {agent.tl}</p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-white/80 rounded-lg p-2 border border-slate-50">
                                        <div className="text-[9px] text-slate-400 font-medium">Score</div>
                                        <div className={cn(
                                            "text-sm font-bold",
                                            agent.avgScore >= 85 ? 'text-emerald-600' : agent.avgScore >= 75 ? 'text-amber-600' : 'text-rose-600'
                                        )}>{agent.avgScore.toFixed(1)}</div>
                                    </div>
                                    <div className="bg-white/80 rounded-lg p-2 border border-slate-50">
                                        <div className="text-[9px] text-slate-400 font-medium">Conversion</div>
                                        <div className={cn(
                                            "text-sm font-bold",
                                            agent.convRate >= 40 ? 'text-emerald-600' : agent.convRate >= 30 ? 'text-amber-600' : 'text-rose-600'
                                        )}>{agent.convRate.toFixed(1)}%</div>
                                    </div>
                                </div>

                                {/* Score bar */}
                                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                                    <div className={cn(
                                        "h-1.5 rounded-full transition-all",
                                        agent.avgScore >= 85 ? 'bg-emerald-500' : agent.avgScore >= 75 ? 'bg-amber-400' : 'bg-rose-500'
                                    )} style={{ width: `${agent.avgScore}%` }}></div>
                                </div>

                                {/* Bottom row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2 text-[9px] text-slate-400">
                                        {agent.missedOpp > 0 && (
                                            <span className={cn("font-semibold", agent.missedOpp > 5 ? 'text-rose-500' : 'text-slate-400')}>
                                                {agent.missedOpp} missed opp.
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[9px] font-semibold text-[#E35205] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                        Details <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ───────────────── DETAILED AGENT VIEW ─────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedAgent('All')} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E35205] to-[#FF6B00] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-200">
                                {selectedAgent.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{selectedAgent}</h2>
                                <p className="text-xs text-slate-400 flex items-center gap-2">
                                    <Users className="w-3 h-3" /> Team Lead: <span className="font-semibold text-slate-600">{agentStats.tl}</span>
                                    <span className="text-slate-300">|</span>
                                    <Phone className="w-3 h-3" /> {agentStats.total} calls analyzed
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <select
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#E35205] cursor-pointer shadow-sm"
                    >
                        <option value="All">← All Agents</option>
                        {agents.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Avg Score', value: `${agentStats.avgScore}`, icon: <Star className="w-4 h-4" />, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Conversion', value: `${agentStats.convRate}%`, icon: <Target className="w-4 h-4" />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Calls', value: `${agentStats.total}`, icon: <PhoneCall className="w-4 h-4" />, color: 'text-slate-500', bg: 'bg-slate-50' },
                    { label: 'Avg Duration', value: `${agentStats.avgDuration}m`, icon: <Clock className="w-4 h-4" />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    { label: 'Missed Opp.', value: `${agentStats.missedOpp}`, icon: <DollarSign className="w-4 h-4" />, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'High Intent', value: `${agentStats.highIntent}`, icon: <Flame className="w-4 h-4" />, color: 'text-[#E35205]', bg: 'bg-orange-50' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={cn("p-1.5 rounded-lg", kpi.bg, kpi.color)}>{kpi.icon}</div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</span>
                        </div>
                        <div className="text-xl font-bold text-slate-800">{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Row 1: Skill Breakdown + Areas for Improvement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Skill Breakdown — Horizontal Bar Chart */}
                <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                        <div className="w-1 h-4 bg-[#E35205] rounded-full"></div>
                        Skill Breakdown
                    </h3>
                    <p className="text-[10px] text-slate-400 mb-4 ml-3">Score percentage across skill categories</p>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { skill: 'Customer Exp.', score: agentStats.commPct, fill: agentStats.commPct >= 75 ? '#10b981' : agentStats.commPct >= 50 ? '#f59e0b' : '#ef4444' },
                                    { skill: 'Communication', score: agentStats.processPct, fill: agentStats.processPct >= 75 ? '#10b981' : agentStats.processPct >= 50 ? '#f59e0b' : '#ef4444' },
                                    { skill: 'Sales Strategy', score: agentStats.salesPct, fill: agentStats.salesPct >= 75 ? '#10b981' : agentStats.salesPct >= 50 ? '#f59e0b' : '#ef4444' },
                                ]}
                                layout="vertical"
                                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                                <YAxis dataKey="skill" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={100} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                    formatter={(value: any) => [`${value}%`, 'Score']}
                                />
                                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={32} isAnimationActive={false}>
                                    {[
                                        { score: agentStats.commPct },
                                        { score: agentStats.processPct },
                                        { score: agentStats.salesPct },
                                    ].map((entry, idx) => (
                                        <Cell key={idx} fill={entry.score >= 75 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Overall Performance Grade */}
                    <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Award className={cn("w-5 h-5", Number(agentStats.avgScore) >= 85 ? 'text-emerald-500' : Number(agentStats.avgScore) >= 70 ? 'text-amber-500' : 'text-rose-500')} />
                            <span className="text-xs font-bold text-slate-600">Overall Score</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-2xl font-bold text-slate-800">{agentStats.avgScore}</span>
                            <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                    </div>
                </div>

                {/* Dynamic Block: Call Highlights (Top Performers) OR Areas for Improvement (Others) */}
                {agentStats.tier === 'excellent' || agentStats.tier === 'good' ? (
                    <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                            Call Highlights
                            <span className="text-[10px] font-medium text-slate-400 ml-auto">Top performance areas</span>
                        </h3>
                        {agentStats.highlights.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {agentStats.highlights.map((highlight, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                                        <div className="p-1.5 rounded-md bg-emerald-100">
                                            <Award className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <p className="text-xs font-semibold text-emerald-700 leading-tight">{highlight}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                                    <Star className="w-7 h-7 text-slate-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-600">Solid Work!</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-[250px]">Consistent performance across all areas.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                            Areas for Improvement
                            <span className="text-[10px] font-medium text-slate-400 ml-auto">Top coaching feedback tags</span>
                        </h3>
                        {agentStats.topFeedback.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {agentStats.topFeedback.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-rose-50/60 border border-rose-100">
                                        <div className="p-1.5 rounded-md bg-rose-100 mt-0.5">
                                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 leading-tight">{item.tag}</p>
                                            <p className="text-[10px] text-rose-500 mt-0.5">{item.count} calls · {item.pct}% occurrence</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3 border border-emerald-100">
                                    <Star className="w-7 h-7 text-emerald-500" />
                                </div>
                                <p className="text-sm font-bold text-emerald-700">Excellent Performance!</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-[250px]">This agent has no recurring coaching feedback. Keep up the great work!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Row 2: Score Distribution + Conversion Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-4 bg-[#E35205] rounded-full"></div>
                        Score Distribution
                    </h3>
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={agentStats.scoreDistribution.filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    dataKey="value"
                                    isAnimationActive={false}
                                    paddingAngle={3}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                >
                                    {agentStats.scoreDistribution.filter(d => d.value > 0).map((entry: any, idx: number) => (
                                        <Cell key={idx} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Conversion Breakdown */}
                <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1 h-4 bg-[#E35205] rounded-full"></div>
                        Conversion Breakdown
                    </h3>
                    <div className="space-y-5 mt-4">
                        {[
                            { label: 'Converted', count: agentStats.converted, color: 'bg-emerald-500', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', icon: <CheckCircle2 className="w-3 h-3" /> },
                            { label: 'Non-Converted', count: agentStats.nonConverted, color: 'bg-rose-500', textColor: 'text-rose-700', bgLight: 'bg-rose-50', icon: <XCircle className="w-3 h-3" /> },
                            { label: 'Pending', count: agentStats.pending, color: 'bg-amber-400', textColor: 'text-amber-700', bgLight: 'bg-amber-50', icon: <Hourglass className="w-3 h-3" /> },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                        <span className={item.textColor}>{item.icon}</span> {item.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("text-xs font-bold", item.textColor)}>{item.count}</span>
                                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", item.bgLight, item.textColor)}>
                                            {((item.count / agentStats.total) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3">
                                    <div className={cn("h-3 rounded-full transition-all", item.color)} style={{ width: `${(item.count / agentStats.total) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Funnel summary */}
                    <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                        <div className="text-center p-2 rounded-lg bg-emerald-50">
                            <div className="text-lg font-bold text-emerald-600">{agentStats.convRate}%</div>
                            <div className="text-[9px] text-emerald-500 font-bold">CONVERSION</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-orange-50">
                            <div className="text-lg font-bold text-[#E35205]">{agentStats.highIntent}</div>
                            <div className="text-[9px] text-orange-500 font-bold">HIGH INTENT</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-rose-50">
                            <div className="text-lg font-bold text-rose-600">{agentStats.missedOpp}</div>
                            <div className="text-[9px] text-rose-500 font-bold">MISSED OPP.</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call Log Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-1 h-4 bg-[#E35205] rounded-full"></div>
                        Call History
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{filteredCalls.length} calls</span>
                    </h3>
                    <div className="flex gap-2">
                        <div className="flex bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                            {(['All', 'Converted', 'Non-Converted', 'Pending'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setCallFilter(f)}
                                    className={cn(
                                        "px-3 py-1.5 text-[10px] font-bold transition-colors",
                                        callFilter === f ? 'bg-[#E35205] text-white' : 'text-slate-500 hover:text-slate-800'
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-[10px] font-bold text-slate-600 cursor-pointer"
                            >
                                <option value="date">Sort: Date</option>
                                <option value="score">Sort: Score</option>
                                <option value="duration">Sort: Duration</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-50 z-10">
                            <tr>
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Date & Time</th>
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</th>
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</th>
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Intent</th>
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</th>
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Issues</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCalls.slice(0, 100).map((call, idx) => (
                                <tr key={call.id} onClick={() => setSelectedCall(call)} className={cn("border-b border-slate-50 hover:bg-orange-50/30 transition-colors cursor-pointer", idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30')}>
                                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">{format(parseISO(call.call_time), 'MMM dd, hh:mm a')}</td>
                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-0.5 rounded",
                                            call.final_score >= 90 ? 'bg-emerald-50 text-emerald-700' :
                                                call.final_score >= 75 ? 'bg-amber-50 text-amber-700' :
                                                    call.final_score >= 60 ? 'bg-yellow-50 text-yellow-700' : 'bg-rose-50 text-rose-700'
                                        )}>{call.final_score}</span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-slate-600 max-w-[150px] truncate">{call.call_category}</td>
                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                            call.crs_booking_status === 'Converted' ? 'bg-emerald-50 text-emerald-600' :
                                                call.crs_booking_status === 'Non-Converted' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                        )}>{call.crs_booking_status}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                            call.initial_intent_tag === 'High Intent' ? 'bg-orange-50 text-[#E35205]' :
                                                call.initial_intent_tag === 'Medium Intent' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                                        )}>{call.initial_intent_tag}</span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">{Math.floor(call.call_duration / 60)}m {call.call_duration % 60}s</td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                                            {call.coaching_feedback.map((tag, j) => (
                                                <span key={j} className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100">{tag}</span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCalls.length > 100 && (
                        <div className="text-center py-3 text-xs text-slate-400">Showing 100 of {filteredCalls.length} calls</div>
                    )}
                </div>
            </div>

            {/* Call Detail Popup */}
            {selectedCall && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCall(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
                            <div>
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <PhoneCall className="w-4 h-4 text-[#E35205]" />
                                    Call Details
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">{selectedCall.agent_username} · {format(parseISO(selectedCall.call_time), 'MMM dd, yyyy hh:mm a')}</p>
                            </div>
                            <button onClick={() => setSelectedCall(null)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-5">
                            {/* Score & Status Row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className={cn(
                                        "text-2xl font-bold",
                                        selectedCall.final_score >= 90 ? 'text-emerald-600' :
                                            selectedCall.final_score >= 75 ? 'text-amber-600' :
                                                selectedCall.final_score >= 60 ? 'text-yellow-600' : 'text-rose-600'
                                    )}>{selectedCall.final_score}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Final Score</div>
                                    <div className={cn(
                                        "text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block",
                                        selectedCall.final_score_tag === 'Excellent' ? 'bg-emerald-50 text-emerald-600' :
                                            selectedCall.final_score_tag === 'Good' ? 'bg-amber-50 text-amber-600' :
                                                selectedCall.final_score_tag === 'Average' ? 'bg-yellow-50 text-yellow-600' : 'bg-rose-50 text-rose-600'
                                    )}>{selectedCall.final_score_tag}</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className={cn(
                                        "text-lg font-bold",
                                        selectedCall.crs_booking_status === 'Converted' ? 'text-emerald-600' :
                                            selectedCall.crs_booking_status === 'Non-Converted' ? 'text-rose-600' : 'text-amber-600'
                                    )}>{selectedCall.crs_booking_status}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Booking Status</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-slate-50 border border-slate-200">
                                    <div className={cn(
                                        "text-lg font-bold",
                                        selectedCall.initial_intent_tag === 'High Intent' ? 'text-[#E35205]' :
                                            selectedCall.initial_intent_tag === 'Medium Intent' ? 'text-amber-600' : 'text-slate-500'
                                    )}>{selectedCall.initial_intent_tag}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Customer Intent</div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                {[
                                    { label: 'Agent', value: selectedCall.agent_username },
                                    { label: 'Team Lead', value: selectedCall.tl_name },
                                    { label: 'Outlet', value: selectedCall.outlet_location },
                                    { label: 'Category', value: selectedCall.call_category },
                                    { label: 'Duration', value: `${Math.floor(selectedCall.call_duration / 60)}m ${selectedCall.call_duration % 60}s` },
                                    { label: 'Lead Score', value: `${selectedCall.lead_score} / 100` },
                                    { label: 'Booking Urgency', value: selectedCall.booking_urgency },
                                    { label: 'Technical Issues', value: selectedCall.major_language_clarity_or_technical_issue ? 'Yes' : 'No' },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50">
                                        <span className="text-[11px] text-slate-400 font-medium">{row.label}</span>
                                        <span className="text-xs font-semibold text-slate-700">{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Skill Scores */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-600 mb-3">Skill Scores</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Customer Experience', score: selectedCall.customer_experience_score, max: 25 },
                                        { label: 'Communication', score: selectedCall.communication_score, max: 40 },
                                        { label: 'Sales Strategy', score: selectedCall.sales_strategy_score, max: 50 },
                                    ].map((s, i) => {
                                        const pct = (s.score / s.max) * 100;
                                        return (
                                            <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[10px] font-medium text-slate-500">{s.label}</span>
                                                    <span className={cn(
                                                        "text-xs font-bold",
                                                        pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'
                                                    )}>{s.score}/{s.max}</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                    <div className={cn(
                                                        "h-1.5 rounded-full",
                                                        pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                                                    )} style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Coaching Feedback */}
                            {selectedCall.coaching_feedback.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-600 mb-3">Coaching Feedback</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCall.coaching_feedback.map((tag, j) => (
                                            <span key={j} className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
