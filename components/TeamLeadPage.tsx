'use client';

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import {
    Users, Trophy, Target, TrendingUp, AlertTriangle,
    CheckCircle2, ArrowUpRight, ArrowDownRight, Star,
    ChevronRight, BarChart3,
} from 'lucide-react';
import { CallData } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface TeamLeadPageProps {
    data: CallData[];
}

export default function TeamLeadPage({ data }: TeamLeadPageProps) {
    const [selectedTL, setSelectedTL] = React.useState<string>('All');

    const tls = React.useMemo(() => Array.from(new Set(data.map(d => d.tl_name))).sort(), [data]);

    // TL-level aggregated stats
    const tlStats = React.useMemo(() => {
        return tls.map(tl => {
            const tlCalls = data.filter(d => d.tl_name === tl);
            const agents = Array.from(new Set(tlCalls.map(d => d.agent_username)));
            const totalScore = tlCalls.reduce((a, c) => a + c.final_score, 0);
            const converted = tlCalls.filter(d => d.crs_booking_status === 'Converted').length;
            const totalComm = tlCalls.reduce((a, c) => a + c.customer_experience_score, 0);
            const totalProcess = tlCalls.reduce((a, c) => a + c.communication_score, 0);
            const totalSales = tlCalls.reduce((a, c) => a + c.sales_strategy_score, 0);
            const totalLead = tlCalls.reduce((a, c) => a + c.lead_score, 0);

            // Coaching gap analysis
            const feedbackMap: Record<string, number> = {};
            tlCalls.forEach(call => {
                call.coaching_feedback.forEach(tag => {
                    feedbackMap[tag] = (feedbackMap[tag] || 0) + 1;
                });
            });
            const topFeedback = Object.entries(feedbackMap)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([tag, count]) => ({ tag, count }));

            return {
                name: tl,
                agents,
                agentCount: agents.length,
                totalCalls: tlCalls.length,
                avgScore: parseFloat((totalScore / tlCalls.length).toFixed(1)),
                convRate: parseFloat(((converted / tlCalls.length) * 100).toFixed(1)),
                comm: parseFloat(((totalComm / tlCalls.length / 25) * 100).toFixed(1)),
                process: parseFloat(((totalProcess / tlCalls.length / 40) * 100).toFixed(1)),
                sales: parseFloat(((totalSales / tlCalls.length / 50) * 100).toFixed(1)),
                avgLead: parseFloat((totalLead / tlCalls.length).toFixed(1)),
                topFeedback,
            };
        }).sort((a, b) => b.avgScore - a.avgScore);
    }, [data, tls]);

    // Per-agent stats for selected TL
    const agentStatsForTL = React.useMemo(() => {
        const filteredCalls = selectedTL === 'All' ? data : data.filter(d => d.tl_name === selectedTL);
        const agentNames = Array.from(new Set(filteredCalls.map(d => d.agent_username)));

        return agentNames.map(agent => {
            const agentCalls = filteredCalls.filter(d => d.agent_username === agent);
            const totalScore = agentCalls.reduce((a, c) => a + c.final_score, 0);
            const converted = agentCalls.filter(d => d.crs_booking_status === 'Converted').length;
            const totalComm = agentCalls.reduce((a, c) => a + c.customer_experience_score, 0);
            const totalProcess = agentCalls.reduce((a, c) => a + c.communication_score, 0);
            const totalSales = agentCalls.reduce((a, c) => a + c.sales_strategy_score, 0);

            return {
                name: agent,
                tl: agentCalls[0]?.tl_name || '',
                calls: agentCalls.length,
                avgScore: parseFloat((totalScore / agentCalls.length).toFixed(1)),
                convRate: parseFloat(((converted / agentCalls.length) * 100).toFixed(1)),
                comm: parseFloat(((totalComm / agentCalls.length / 25) * 100).toFixed(1)),
                process: parseFloat(((totalProcess / agentCalls.length / 40) * 100).toFixed(1)),
                sales: parseFloat(((totalSales / agentCalls.length / 50) * 100).toFixed(1)),
            };
        }).sort((a, b) => b.avgScore - a.avgScore);
    }, [data, selectedTL]);

    // Radar data for selected TL
    const radarData = React.useMemo(() => {
        const activeTLs = selectedTL === 'All' ? tlStats : tlStats.filter(t => t.name === selectedTL);
        if (activeTLs.length === 0) return [];
        return [
            { metric: 'Customer Exp.', ...Object.fromEntries(activeTLs.map(t => [t.name, t.comm])) },
            { metric: 'Communication', ...Object.fromEntries(activeTLs.map(t => [t.name, t.process])) },
            { metric: 'Sales Strategy', ...Object.fromEntries(activeTLs.map(t => [t.name, t.sales])) },
            { metric: 'Conversion', ...Object.fromEntries(activeTLs.map(t => [t.name, t.convRate])) },
            { metric: 'Quality', ...Object.fromEntries(activeTLs.map(t => [t.name, t.avgScore])) },
        ];
    }, [tlStats, selectedTL]);

    // Coaching gaps for selected TL
    const selectedTLData = selectedTL === 'All' ? null : tlStats.find(t => t.name === selectedTL);

    const RADAR_COLORS = ['#E35205', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

    return (
        <div className="space-y-8">
            {/* TL Selector */}
            <div className="flex items-center gap-3 flex-wrap">
                <button
                    onClick={() => setSelectedTL('All')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all border",
                        selectedTL === 'All' ? "bg-[#E35205] text-white border-[#E35205] shadow-lg shadow-orange-100" : "bg-white text-slate-500 border-slate-200 hover:border-[#E35205] hover:text-[#E35205]"
                    )}
                >
                    All Team Leads
                </button>
                {tls.map(tl => (
                    <button
                        key={tl}
                        onClick={() => setSelectedTL(tl)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all border",
                            selectedTL === tl ? "bg-[#E35205] text-white border-[#E35205] shadow-lg shadow-orange-100" : "bg-white text-slate-500 border-slate-200 hover:border-[#E35205] hover:text-[#E35205]"
                        )}
                    >
                        {tl}
                    </button>
                ))}
            </div>

            {/* TL Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Leaderboard */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-[#E35205]/10 rounded-lg">
                            <Trophy className="w-5 h-5 text-[#E35205]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">TL Performance Leaderboard</h3>
                            <p className="text-[11px] text-slate-400">Ranked by average quality score</p>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        {tlStats.map((tl, i) => (
                            <div
                                key={tl.name}
                                onClick={() => setSelectedTL(tl.name)}
                                className={cn(
                                    "flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer group",
                                    selectedTL === tl.name ? "border-[#E35205]/30 bg-orange-50/50 shadow-sm" : "border-slate-100 hover:border-[#E35205]/20 hover:shadow-sm"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
                                        i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-500"
                                    )}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">{tl.name}</h4>
                                        <p className="text-[10px] text-slate-400">{tl.agentCount} agents · {tl.totalCalls} calls</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-lg font-black text-[#E35205]">{tl.avgScore}</div>
                                        <div className="text-[10px] text-slate-400">avg score</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-emerald-600">{tl.convRate}%</div>
                                        <div className="text-[10px] text-slate-400">conv rate</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#E35205] transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Radar Comparison */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-[#E35205]" />
                        <h3 className="text-sm font-bold text-slate-800">
                            {selectedTL === 'All' ? 'All TLs Skill Comparison' : `${selectedTL}'s Team Skills`}
                        </h3>
                    </div>
                    <div className="h-[340px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }} />
                                {(selectedTL === 'All' ? tlStats : tlStats.filter(t => t.name === selectedTL)).map((tl, i) => (
                                    <Radar
                                        key={tl.name}
                                        name={tl.name}
                                        dataKey={tl.name}
                                        stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                                        fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                                        fillOpacity={0.1}
                                        strokeWidth={2}
                                    />
                                ))}
                                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Agent Performance under selected TL */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">
                                {selectedTL === 'All' ? 'All Agents' : `${selectedTL}'s Agents`}
                            </h3>
                            <p className="text-[11px] text-slate-400">Individual agent performance breakdown</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#E35205] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                        {agentStatsForTL.length} agents
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left px-5 py-3 font-semibold">#</th>
                                <th className="text-left px-5 py-3 font-semibold">Agent</th>
                                {selectedTL === 'All' && <th className="text-left px-5 py-3 font-semibold">Team Lead</th>}
                                <th className="text-center px-5 py-3 font-semibold">Calls</th>
                                <th className="text-center px-5 py-3 font-semibold">Avg Score</th>
                                <th className="text-center px-5 py-3 font-semibold">Conv Rate</th>
                                <th className="text-center px-5 py-3 font-semibold">Customer Exp %</th>
                                <th className="text-center px-5 py-3 font-semibold">Communication %</th>
                                <th className="text-center px-5 py-3 font-semibold">Sales Strat %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {agentStatsForTL.map((agent, i) => (
                                <tr key={agent.name} className={cn("hover:bg-slate-50/70 transition-colors", i % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                                    <td className="px-5 py-3">
                                        <div className={cn(
                                            "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black",
                                            i < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-500"
                                        )}>{i + 1}</div>
                                    </td>
                                    <td className="px-5 py-3 text-xs font-bold text-slate-800">{agent.name}</td>
                                    {selectedTL === 'All' && <td className="px-5 py-3 text-xs text-slate-500">{agent.tl}</td>}
                                    <td className="px-5 py-3 text-center text-xs text-slate-600">{agent.calls}</td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-0.5 rounded",
                                            agent.avgScore >= 85 ? 'bg-emerald-50 text-emerald-700' :
                                                agent.avgScore >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                        )}>{agent.avgScore}</span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={cn(
                                            "text-xs font-bold",
                                            agent.convRate >= 50 ? 'text-emerald-600' : agent.convRate >= 30 ? 'text-amber-600' : 'text-rose-600'
                                        )}>{agent.convRate}%</span>
                                    </td>
                                    <td className="px-5 py-3 text-center text-xs text-slate-600">{agent.comm}%</td>
                                    <td className="px-5 py-3 text-center text-xs text-slate-600">{agent.process}%</td>
                                    <td className="px-5 py-3 text-center text-xs text-slate-600">{agent.sales}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Coaching Gaps for selected TL */}
            {selectedTLData && (
                <div className="bg-gradient-to-br from-rose-50/50 to-white rounded-xl p-6 border border-rose-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-rose-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Coaching Gaps — {selectedTLData.name}'s Team</h3>
                            <p className="text-[11px] text-slate-400">Most frequent coaching feedback tags across this team</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {selectedTLData.topFeedback.map((item, i) => (
                            <div key={item.tag} className="bg-white rounded-lg p-4 border border-rose-100 hover:shadow-md transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={cn(
                                        "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black",
                                        i === 0 ? "bg-rose-100 text-rose-700" : "bg-slate-50 text-slate-500"
                                    )}>{i + 1}</div>
                                    <span className="text-lg font-black text-rose-600">{item.count}</span>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-600 leading-tight">{item.tag}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
