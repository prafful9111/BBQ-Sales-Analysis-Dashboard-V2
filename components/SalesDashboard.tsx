'use client';

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { motion } from 'motion/react';
import { 
  Phone, 
  Star, 
  Clock, 
  AlertCircle, 
  Filter, 
  ChevronDown, 
  TrendingUp,
  Users,
  Calendar,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  Search,
  Flame,
  PhoneCall
} from 'lucide-react';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { CallData, generateMockData } from '@/lib/mock-data';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

// BBQ Nation Color Palette
const COLORS = {
  Primary: '#E35205',    // Deep BBQ Orange
  Secondary: '#FF6B00',  // Bright BBQ Orange
  Excellent: '#10b981',  // Emerald 500
  Good: '#f59e0b',       // Amber 500
  Average: '#fbbf24',    // Amber 400
  Poor: '#ef4444',       // Red 500
  Neutral: '#64748b',    // Slate 500
  Background: '#F8FAFC', // Slate 50
};

export default function SalesDashboard() {
  const [data, setData] = React.useState<CallData[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [activePage, setActivePage] = React.useState('overview');
  
  const [filterDateRange, setFilterDateRange] = React.useState<string>('This Week');
  const [filterPerformance, setFilterPerformance] = React.useState<string>('All');
  const [filterTL, setFilterTL] = React.useState<string>('All');
  const [filterAgent, setFilterAgent] = React.useState<string>('All');
  const [filterCategory, setFilterCategory] = React.useState<string>('All');
  const [filterConversion, setFilterConversion] = React.useState<string>('All');
  const [filterOutlet, setFilterOutlet] = React.useState<string>('All');

  React.useEffect(() => {
    setData(generateMockData());
    setIsMounted(true);
  }, []);

  // Filtered Data
  const filteredData = React.useMemo(() => {
    return data.filter(item => {
      // Date Filter
      const callDate = parseISO(item.call_time);
      const now = new Date();
      let matchDate = true;
      if (filterDateRange === 'This Week') {
        matchDate = callDate >= subDays(now, 7);
      } else if (filterDateRange === 'Last Week') {
        matchDate = callDate >= subDays(now, 14) && callDate < subDays(now, 7);
      } else if (filterDateRange === 'This Month') {
        matchDate = callDate >= subDays(now, 30);
      }

      // Performance Bucket Filter
      let matchPerf = true;
      if (filterPerformance !== 'All') {
        const [min, max] = filterPerformance.split('-').map(Number);
        matchPerf = item.final_score >= min && item.final_score <= max;
      }

      const matchTL = filterTL === 'All' || item.tl_name === filterTL;
      const matchAgent = filterAgent === 'All' || item.agent_username === filterAgent;
      const matchCategory = filterCategory === 'All' || item.call_category === filterCategory;
      const matchConversion = filterConversion === 'All' || item.crs_booking_status === filterConversion;
      const matchOutlet = filterOutlet === 'All' || item.outlet_location === filterOutlet;

      return matchDate && matchPerf && matchTL && matchAgent && matchCategory && matchConversion && matchOutlet;
    });
  }, [data, filterDateRange, filterPerformance, filterTL, filterAgent, filterCategory, filterConversion, filterOutlet]);

  // Comparison Data (WoW / MoM)
  const comparisonData = React.useMemo(() => {
    const now = new Date();
    let currentInterval: { start: Date; end: Date };
    let previousInterval: { start: Date; end: Date };

    if (filterDateRange === 'This Week') {
      currentInterval = { start: subDays(now, 7), end: now };
      previousInterval = { start: subDays(now, 14), end: subDays(now, 7) };
    } else if (filterDateRange === 'Last Week') {
      currentInterval = { start: subDays(now, 14), end: subDays(now, 7) };
      previousInterval = { start: subDays(now, 21), end: subDays(now, 14) };
    } else {
      currentInterval = { start: subDays(now, 30), end: now };
      previousInterval = { start: subDays(now, 60), end: subDays(now, 30) };
    }

    const getStats = (items: CallData[]) => {
      const total = items.length;
      if (total === 0) return { volume: 0, score: 0, conv: 0 };
      const score = items.reduce((acc, curr) => acc + curr.final_score, 0) / total;
      const conv = (items.filter(d => d.crs_booking_status === 'Converted').length / total) * 100;
      return { volume: total, score, conv };
    };

    const currentStats = getStats(data.filter(d => {
      const date = parseISO(d.call_time);
      return date >= currentInterval.start && date <= currentInterval.end;
    }));

    const previousStats = getStats(data.filter(d => {
      const date = parseISO(d.call_time);
      return date >= previousInterval.start && date <= previousInterval.end;
    }));

    const calcDelta = (curr: number, prev: number) => {
      if (prev === 0) return '+0.0%';
      const delta = ((curr - prev) / prev) * 100;
      return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
    };

    return {
      volumeDelta: calcDelta(currentStats.volume, previousStats.volume),
      scoreDelta: calcDelta(currentStats.score, previousStats.score),
      convDelta: calcDelta(currentStats.conv, previousStats.conv),
      isVolumePos: currentStats.volume >= previousStats.volume,
      isScorePos: currentStats.score >= previousStats.score,
      isConvPos: currentStats.conv >= previousStats.conv,
    };
  }, [data, filterDateRange]);

  // KPI Calculations
  const stats = React.useMemo(() => {
    const totalCalls = filteredData.length;
    if (totalCalls === 0) return {
      totalCalls: 0,
      avgScore: '0',
      avgDuration: '0',
      conversionRate: '0',
      avgLeadScore: '0',
      avgProcess: '0',
      avgSales: '0',
      technicalIssues: 0
    };

    const avgScore = filteredData.reduce((acc, curr) => acc + curr.final_score, 0) / totalCalls;
    const avgDuration = filteredData.reduce((acc, curr) => acc + curr.call_duration, 0) / totalCalls;
    const convertedCount = filteredData.filter(d => d.crs_booking_status === 'Converted').length;
    const conversionRate = (convertedCount / totalCalls) * 100;
    const avgLeadScore = filteredData.reduce((acc, curr) => acc + curr.lead_score, 0) / totalCalls;
    const avgProcess = filteredData.reduce((acc, curr) => acc + curr.process_adherence_score, 0) / totalCalls;
    const avgSales = filteredData.reduce((acc, curr) => acc + curr.sales_skills_score, 0) / totalCalls;
    const technicalIssues = filteredData.filter(d => d.major_language_clarity_or_technical_issue).length;
    
    return {
      totalCalls,
      avgScore: avgScore.toFixed(1),
      avgDuration: (avgDuration / 60).toFixed(2),
      conversionRate: conversionRate.toFixed(1),
      avgLeadScore: avgLeadScore.toFixed(1),
      avgProcess: ((avgProcess / 40) * 100).toFixed(1),
      avgSales: ((avgSales / 50) * 100).toFixed(1),
      technicalIssues
    };
  }, [filteredData]);

  // Chart Data: Performance Distribution
  const performanceData = React.useMemo(() => {
    const counts = filteredData.reduce((acc, curr) => {
      acc[curr.final_score_tag] = (acc[curr.final_score_tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return ['Excellent', 'Good', 'Average', 'Poor'].map(tag => ({
      name: tag,
      value: counts[tag] || 0
    }));
  }, [filteredData]);

  // Chart Data: Intent Distribution
  const intentData = React.useMemo(() => {
    const counts = filteredData.reduce((acc, curr) => {
      acc[curr.initial_intent_tag] = (acc[curr.initial_intent_tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return ['High Intent', 'Medium Intent', 'Low Intent'].map(intent => ({
      name: intent,
      value: counts[intent] || 0
    }));
  }, [filteredData]);

  // Chart Data: Agent Performance Matrix
  const agentMatrixData = React.useMemo(() => {
    const agentStats = filteredData.reduce((acc, curr) => {
      if (!acc[curr.agent_username]) {
        acc[curr.agent_username] = { total: 0, count: 0, sales: 0, process: 0 };
      }
      acc[curr.agent_username].total += curr.final_score;
      acc[curr.agent_username].sales += curr.sales_skills_score;
      acc[curr.agent_username].process += curr.process_adherence_score;
      acc[curr.agent_username].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(agentStats)
      .map(([name, s]) => ({
        name,
        score: parseFloat((s.total / s.count).toFixed(1)),
        sales: parseFloat(((s.sales / s.count) / 50 * 100).toFixed(1)),
        process: parseFloat(((s.process / s.count) / 40 * 100).toFixed(1))
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [filteredData]);

  // Chart Data: Temporal Trend
  const temporalData = React.useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });
    const dayCounts = filteredData.reduce((acc, curr) => {
      const day = format(parseISO(curr.call_time), 'MMM dd');
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return last7Days.map(date => {
      const day = format(date, 'MMM dd');
      return { name: day, calls: dayCounts[day] || 0 };
    });
  }, [filteredData]);

  const agents = Array.from(new Set(data.map(d => d.agent_username))).sort();
  const categories = Array.from(new Set(data.map(d => d.call_category))).sort();

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-[#E35205] rounded-full animate-spin"></div>
          <div className="text-slate-400 font-medium tracking-wide">Initializing Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        activePage={activePage} 
        setActivePage={setActivePage} 
      />

      <main className={cn(
        "flex-1 transition-all duration-300 p-6 lg:p-10",
        collapsed ? "ml-20" : "ml-[260px]"
      )}>
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E35205]">Analytics Platform</span>
              <div className="h-px w-8 bg-orange-200"></div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Performance <span className="text-[#E35205]">Overview</span></h1>
            <p className="text-slate-500 text-sm mt-1">Real-time insights from Barbeque Nation call center data</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search metrics..." 
                className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#E35205] transition-all w-64"
              />
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-100">
              <Calendar className="w-4 h-4 text-[#E35205]" />
              <span>Mar 01 - Mar 07, 2026</span>
            </div>
          </div>
        </header>

        {/* Filters Bar */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <FilterGroup label="Date Range" icon={<Calendar className="w-3 h-3" />}>
              <select 
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E35205] cursor-pointer"
              >
                <option value="This Week">This Week</option>
                <option value="Last Week">Last Week</option>
                <option value="This Month">This Month</option>
              </select>
            </FilterGroup>

            <FilterGroup label="Performance" icon={<Star className="w-3 h-3" />}>
              <select 
                value={filterPerformance}
                onChange={(e) => setFilterPerformance(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E35205] cursor-pointer"
              >
                <option value="All">All Scores</option>
                <option value="0-30">Bottom (0-30)</option>
                <option value="31-60">Poor (31-60)</option>
                <option value="61-80">Average (61-80)</option>
                <option value="81-100">Elite (81-100)</option>
              </select>
            </FilterGroup>

            <FilterGroup label="Team Lead" icon={<Users className="w-3 h-3" />}>
              <select 
                value={filterTL}
                onChange={(e) => setFilterTL(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E35205] cursor-pointer"
              >
                <option value="All">All TLs</option>
                {Array.from(new Set(data.map(d => d.tl_name))).sort().map(tl => (
                  <option key={tl} value={tl}>{tl}</option>
                ))}
              </select>
            </FilterGroup>

            <FilterGroup label="Agent" icon={<Users className="w-3 h-3" />}>
              <select 
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E35205] cursor-pointer"
              >
                <option value="All">All Agents</option>
                {agents.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </FilterGroup>

            <FilterGroup label="Category" icon={<Filter className="w-3 h-3" />}>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E35205] cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FilterGroup>

            <FilterGroup label="Conversion" icon={<Target className="w-3 h-3" />}>
              <select 
                value={filterConversion}
                onChange={(e) => setFilterConversion(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E35205] cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Converted">Converted</option>
                <option value="Non-Converted">Non-Converted</option>
                <option value="Pending">Pending</option>
              </select>
            </FilterGroup>

            <FilterGroup label="Outlet" icon={<Search className="w-3 h-3" />}>
              <select 
                value={filterOutlet}
                onChange={(e) => setFilterOutlet(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E35205] cursor-pointer"
              >
                <option value="All">All Outlets</option>
                {Array.from(new Set(data.map(d => d.outlet_location))).sort().map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </FilterGroup>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => { 
                setFilterDateRange('This Week');
                setFilterPerformance('All');
                setFilterTL('All');
                setFilterAgent('All'); 
                setFilterCategory('All'); 
                setFilterConversion('All');
                setFilterOutlet('All');
              }}
              className="bg-slate-900 text-white rounded-lg px-6 py-2 text-xs font-bold hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* KPI Grid - 4 in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard 
            title="Total Volume" 
            value={stats.totalCalls.toLocaleString()} 
            icon={<PhoneCall className="w-5 h-5 text-[#E35205]" />}
            trend={comparisonData.volumeDelta}
            isPositive={comparisonData.isVolumePos}
            color="orange"
          />
          <KPICard 
            title="Conversion Rate" 
            value={`${stats.conversionRate}%`} 
            icon={<Target className="w-5 h-5 text-emerald-600" />}
            trend={comparisonData.convDelta}
            isPositive={comparisonData.isConvPos}
            color="emerald"
          />
          <KPICard 
            title="Quality Score" 
            value={`${stats.avgScore}%`} 
            icon={<Star className="w-5 h-5 text-amber-500" />}
            trend={comparisonData.scoreDelta}
            isPositive={comparisonData.isScorePos}
            color="amber"
          />
          <KPICard 
            title="Avg Duration" 
            value={`${stats.avgDuration}m`} 
            icon={<Clock className="w-5 h-5 text-blue-600" />}
            trend="Stable"
            isPositive={true}
            color="blue"
          />
        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <KPICard 
            title="Avg Lead Score" 
            value={stats.avgLeadScore} 
            icon={<Zap className="w-5 h-5 text-purple-600" />}
            trend="Stable"
            isPositive={true}
            color="purple"
          />
          <KPICard 
            title="Process Adherence" 
            value={`${stats.avgProcess}%`} 
            icon={<CheckCircle2 className="w-5 h-5 text-indigo-600" />}
            trend="+5.1%"
            isPositive={true}
            color="indigo"
          />
          <KPICard 
            title="Sales Skills" 
            value={`${stats.avgSales}%`} 
            icon={<TrendingUp className="w-5 h-5 text-rose-600" />}
            trend="+1.8%"
            isPositive={true}
            color="rose"
          />
          <KPICard 
            title="Technical Issues" 
            value={stats.technicalIssues} 
            icon={<AlertCircle className="w-5 h-5 text-slate-600" />}
            trend="-2"
            isPositive={true}
            color="slate"
          />
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Volume Trend */}
          <ChartCard title="Call Volume Trend" className="lg:col-span-8">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={temporalData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E35205" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#E35205" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="calls" stroke="#E35205" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Performance Distribution */}
          <ChartCard title="Quality Breakdown" className="lg:col-span-4">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Agent Performance Matrix */}
          <ChartCard title="Top Agents Performance Matrix" className="lg:col-span-7">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentMatrixData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                  <Bar dataKey="sales" name="Sales Skills %" fill="#E35205" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="process" name="Process Adherence %" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Intent Distribution */}
          <ChartCard title="Customer Intent Analysis" className="lg:col-span-5">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={intentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#E35205" />
                    <Cell fill="#fbbf24" />
                    <Cell fill="#94a3b8" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Executive Summary Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-2xl">
                <Flame className="w-6 h-6 text-[#E35205]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Operational Insights</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Conversion Strength
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Booking conversion is currently at <span className="text-slate-900 font-bold">{stats.conversionRate}%</span>. 
                  High-intent calls are being handled with <span className="text-emerald-600 font-semibold">92% accuracy</span> in process adherence.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Duration Variance
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Call durations range from <span className="text-slate-900 font-bold">18s to 580s</span>. 
                  Longer calls correlate with <span className="text-[#E35205] font-semibold">Existing Reservation</span> queries requiring complex troubleshooting.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-72 p-6 bg-gradient-to-br from-[#E35205] to-[#FF6B00] rounded-3xl text-white shadow-xl shadow-orange-100">
            <div className="text-center space-y-4">
              <p className="text-orange-100 text-sm font-medium uppercase tracking-wider">Overall Health</p>
              <div className="text-5xl font-black">88.4</div>
              <div className="text-xs text-orange-100/80">Composite Performance Score</div>
              <div className="pt-4 border-t border-white/20 flex justify-between text-xs font-bold">
                <span>↑ 4.2%</span>
                <span>vs Last Month</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KPICard({ title, value, icon, trend, isPositive, color }: any) {
  const colorMap: any = {
    orange: "bg-orange-50 text-[#E35205]",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-50 text-slate-600",
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className={cn("p-2.5 rounded-xl", colorMap[color])}>
          {icon}
        </div>
        <div className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-full",
          isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{title}</p>
        <h4 className="text-2xl font-black text-slate-900">{value}</h4>
      </div>
    </motion.div>
  );
}

function ChartCard({ title, children, className }: any) {
  return (
    <div className={cn("bg-white p-6 rounded-3xl shadow-sm border border-slate-100", className)}>
      <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
        <div className="w-1 h-4 bg-[#E35205] rounded-full"></div>
        {title}
      </h3>
      {children}
    </div>
  );
}

function FilterGroup({ label, icon, children }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
        {icon} {label}
      </label>
      <div className="relative group">
        {children}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-[#E35205] transition-colors" />
      </div>
    </div>
  );
}
