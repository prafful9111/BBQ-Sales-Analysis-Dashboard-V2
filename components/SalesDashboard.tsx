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
  PhoneCall,
  PlayCircle,
  Trophy,
  BookOpen,
  ArrowRightLeft,
  ChevronRight,
  Award,
  ArrowDownCircle,
  ThumbsUp,
  AlertTriangle,
  Medal,
  DollarSign,
  BarChart3,
  Info,
  X,
  Eye
} from 'lucide-react';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { CallData, fetchCallData } from '@/lib/mock-data';
import Sidebar from './Sidebar';
import AgentPerformancePage from './AgentPerformancePage';
import CallLogsPage from './CallLogsPage';
import TrendsPage from './TrendsPage';
import TeamLeadPage from './TeamLeadPage';
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

  const [filterDateRange, setFilterDateRange] = React.useState<string>('Last 7 Days');
  const [filterPerformance, setFilterPerformance] = React.useState<string>('All');
  const [filterTL, setFilterTL] = React.useState<string>('All');
  const [filterAgent, setFilterAgent] = React.useState<string>('All');
  const [filterCategory, setFilterCategory] = React.useState<string>('All');
  const [filterConversion, setFilterConversion] = React.useState<string>('All');
  const [filterOutlet, setFilterOutlet] = React.useState<string>('All');
  const [filterDept, setFilterDept] = React.useState<string>('All');
  const [customStartDate, setCustomStartDate] = React.useState<string>('');
  const [customEndDate, setCustomEndDate] = React.useState<string>('');

  // Modal state for Call Details
  const [selectedCall, setSelectedCall] = React.useState<CallData | null>(null);

  // Modal state for Reason for Loss drill-down
  const [lossModalOpen, setLossModalOpen] = React.useState(false);
  const [selectedLossReason, setSelectedLossReason] = React.useState<string>('');

  React.useEffect(() => {
    fetchCallData().then((fetchedData) => {
      setData(fetchedData);
      setIsMounted(true);
    });
  }, []);

  // Find the latest date in the dataset to act as "now", so static data doesn't appear empty today
  const maxDate = React.useMemo(() => {
    if (!data || data.length === 0) return new Date();
    const maxTime = Math.max(...data.map(d => parseISO(d.call_time).getTime()));
    return new Date(maxTime);
  }, [data]);

  // Filtered Data
  const filteredData = React.useMemo(() => {
    return data.filter(item => {
      // Date Filter
      const callDate = parseISO(item.call_time);
      const now = maxDate;
      let matchDate = true;
      if (filterDateRange === 'Last 7 Days') {
        matchDate = callDate >= subDays(now, 7);
      } else if (filterDateRange === 'Last 14 Days') {
        matchDate = callDate >= subDays(now, 14);
      } else if (filterDateRange === 'Last 30 Days') {
        matchDate = callDate >= subDays(now, 30);
      } else if (filterDateRange === 'Custom' && customStartDate && customEndDate) {
        const start = parseISO(customStartDate);
        const end = parseISO(customEndDate);
        end.setHours(23, 59, 59, 999);
        matchDate = callDate >= start && callDate <= end;
      }
      // 'All' => matchDate stays true

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
      const matchDept = filterDept === 'All' || item.department === filterDept;

      return matchDate && matchPerf && matchTL && matchAgent && matchCategory && matchConversion && matchOutlet && matchDept;
    });
  }, [data, filterDateRange, filterPerformance, filterTL, filterAgent, filterCategory, filterConversion, filterOutlet, filterDept, customStartDate, customEndDate]);

  // Comparison Data (WoW / MoM)
  const comparisonData = React.useMemo(() => {
    const now = maxDate;
    let currentInterval: { start: Date; end: Date };
    let previousInterval: { start: Date; end: Date };

    if (filterDateRange === 'Last 7 Days') {
      currentInterval = { start: subDays(now, 7), end: now };
      previousInterval = { start: subDays(now, 14), end: subDays(now, 7) };
    } else if (filterDateRange === 'Last 14 Days') {
      currentInterval = { start: subDays(now, 14), end: now };
      previousInterval = { start: subDays(now, 28), end: subDays(now, 14) };
    } else if (filterDateRange === 'Custom' && customStartDate && customEndDate) {
      const start = parseISO(customStartDate);
      const end = parseISO(customEndDate);
      const rangeDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      currentInterval = { start, end };
      previousInterval = { start: subDays(start, rangeDays), end: start };
    } else {
      currentInterval = { start: subDays(now, 30), end: now };
      previousInterval = { start: subDays(now, 60), end: subDays(now, 30) };
    }

    const getStats = (items: CallData[]) => {
      const total = items.length;
      if (total === 0) return { volume: 0, score: 0, conv: 0, intent: 0, process: 0 };
      const score = items.reduce((acc, curr) => acc + curr.final_score, 0) / total;
      const conv = (items.filter(d => d.crs_booking_status === 'Converted').length / total) * 100;
      const intent = (items.filter(d => d.initial_intent_tag.includes('High')).length / total) * 100;
      const process = (items.reduce((acc, curr) => acc + curr.communication_score, 0) / (total * 40)) * 100;
      return { volume: total, score, conv, intent, process };
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
      intentDelta: calcDelta(currentStats.intent, previousStats.intent),
      processDelta: calcDelta(currentStats.process, previousStats.process),
      isVolumePos: currentStats.volume >= previousStats.volume,
      isScorePos: currentStats.score >= previousStats.score,
      isConvPos: currentStats.conv >= previousStats.conv,
      isIntentPos: currentStats.intent >= previousStats.intent,
      isProcessPos: currentStats.process >= previousStats.process,
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
      highIntentPercent: '0',
      avgLeadScore: '0',
      avgProcess: '0',
      avgSales: '0',
      technicalIssues: 0,
      missedOpportunities: 0
    };

    const avgScore = filteredData.reduce((acc, curr) => acc + curr.final_score, 0) / totalCalls;
    const avgDuration = filteredData.reduce((acc, curr) => acc + curr.call_duration, 0) / totalCalls;
    const convertedCount = filteredData.filter(d => d.crs_booking_status === 'Converted').length;
    const conversionRate = (convertedCount / totalCalls) * 100;
    const highIntentCount = filteredData.filter(d => d.initial_intent_tag.includes('High')).length;
    const highIntentPercent = (highIntentCount / totalCalls) * 100;
    const avgLeadScore = filteredData.reduce((acc, curr) => acc + curr.lead_score, 0) / totalCalls;
    const avgProcess = filteredData.reduce((acc, curr) => acc + curr.communication_score, 0) / totalCalls;
    const avgSales = filteredData.reduce((acc, curr) => acc + curr.sales_strategy_score, 0) / totalCalls;
    const technicalIssues = filteredData.filter(d => d.major_language_clarity_or_technical_issue).length;
    const missedOpportunities = filteredData.filter(d => d.initial_intent_tag.includes('High') && d.crs_booking_status !== 'Converted').length;

    return {
      totalCalls,
      avgScore: avgScore.toFixed(1),
      avgDuration: (avgDuration / 60).toFixed(2),
      conversionRate: conversionRate.toFixed(1),
      highIntentPercent: highIntentPercent.toFixed(1),
      avgLeadScore: avgLeadScore.toFixed(1),
      avgProcess: ((avgProcess / 40) * 100).toFixed(1),
      avgSales: ((avgSales / 50) * 100).toFixed(1),
      technicalIssues,
      missedOpportunities
    };
  }, [filteredData]);

  // Score Bucket Distribution
  const scoreBuckets = React.useMemo(() => {
    const total = filteredData.length || 1;
    const elite = filteredData.filter(d => d.final_score >= 90).length;
    const good = filteredData.filter(d => d.final_score >= 75 && d.final_score < 90).length;
    const average = filteredData.filter(d => d.final_score >= 60 && d.final_score < 75).length;
    const poor = filteredData.filter(d => d.final_score < 60).length;
    return [
      { label: 'Elite (90-100)', count: elite, pct: ((elite / total) * 100).toFixed(1), color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
      { label: 'Good (75-89)', count: good, pct: ((good / total) * 100).toFixed(1), color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
      { label: 'Average (60-74)', count: average, pct: ((average / total) * 100).toFixed(1), color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
      { label: 'Poor (<60)', count: poor, pct: ((poor / total) * 100).toFixed(1), color: '#ef4444', bg: 'bg-rose-50', text: 'text-rose-700', bar: 'bg-rose-500' },
    ];
  }, [filteredData]);

  // Reason for Loss — aggregate coaching feedback tags from non-converted calls
  const lossReasons = React.useMemo(() => {
    const nonConverted = filteredData.filter(d => d.crs_booking_status === 'Non-Converted');
    const tagCounts: Record<string, number> = {};
    nonConverted.forEach(call => {
      call.coaching_feedback.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Limit to top 5 to avoid clutter
  }, [filteredData]);

  // Chart Data: Performance Distribution (Funnel)
  const performanceData = React.useMemo(() => {
    let excellent = 0;
    let good = 0;
    let poorAvg = 0;

    filteredData.forEach(curr => {
      if (curr.final_score >= 80) excellent++;
      else if (curr.final_score >= 60) good++;
      else poorAvg++;
    });

    const total = filteredData.length || 1;

    return [
      { name: 'Excellent', rating: '80-100', value: excellent, percentage: ((excellent / total) * 100).toFixed(1) },
      { name: 'Good', rating: '60-79', value: good, percentage: ((good / total) * 100).toFixed(1) },
      { name: 'Poor/Average', rating: '0-59', value: poorAvg, percentage: ((poorAvg / total) * 100).toFixed(1) }
    ];
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
      acc[curr.agent_username].sales += curr.sales_strategy_score;
      acc[curr.agent_username].process += curr.communication_score;
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
      start: subDays(maxDate, 6),
      end: maxDate
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

  // Actionable Insights: Conversion Gap
  const conversionGapData = React.useMemo(() => {
    const agentStats = filteredData.reduce((acc, curr) => {
      if (!acc[curr.agent_username]) {
        acc[curr.agent_username] = { totalScore: 0, count: 0, converted: 0 };
      }
      acc[curr.agent_username].totalScore += curr.final_score;
      acc[curr.agent_username].count += 1;
      if (curr.crs_booking_status === 'Converted') {
        acc[curr.agent_username].converted += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    const agents = Object.entries(agentStats).map(([name, s]) => ({
      name,
      avgScore: s.totalScore / s.count,
      convRate: (s.converted / s.count) * 100,
      calls: s.count
    })).filter(a => a.calls > 3);

    const politeFollowers = agents.filter(a => a.avgScore >= 80 && a.convRate < 35).sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
    const naturalClosers = agents.filter(a => a.avgScore < 75 && a.convRate > 40).sort((a, b) => b.convRate - a.convRate).slice(0, 3);

    return { politeFollowers, naturalClosers };
  }, [filteredData]);

  // Actionable Insights: Top Performers Spotlight
  const topPerformers = React.useMemo(() => {
    return filteredData
      .filter(d => d.final_score >= 95)
      .sort((a, b) => b.final_score - a.final_score)
      .slice(0, 3)
      .map(d => ({
        agent: d.agent_username,
        score: d.final_score,
        date: format(parseISO(d.call_time), 'MMM dd, HH:mm'),
        snippet: d.call_category === 'New Booking Related Call'
          ? "Exceptional handling of price objections by shifting focus to the 'Weekend Value' experience."
          : "Flawless de-escalation of a frustrated customer while maintaining brand standards."
      }));
  }, [filteredData]);

  // Top Performing Agents (aggregated)
  const topAgents = React.useMemo(() => {
    const agentStats = filteredData.reduce((acc, curr) => {
      if (!acc[curr.agent_username]) {
        acc[curr.agent_username] = {
          totalScore: 0, count: 0, converted: 0,
          salesTotal: 0, processTotal: 0, commTotal: 0,
          feedbackMap: {} as Record<string, number>,
          bestScore: 0
        };
      }
      const s = acc[curr.agent_username];
      s.totalScore += curr.final_score;
      s.count += 1;
      s.salesTotal += curr.sales_strategy_score;
      s.processTotal += curr.communication_score;
      s.commTotal += curr.customer_experience_score;
      if (curr.final_score > s.bestScore) s.bestScore = curr.final_score;
      if (curr.crs_booking_status === 'Converted') s.converted += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(agentStats)
      .filter(([, s]) => s.count >= 3)
      .map(([name, s]) => ({
        name,
        avgScore: parseFloat((s.totalScore / s.count).toFixed(1)),
        convRate: parseFloat(((s.converted / s.count) * 100).toFixed(1)),
        calls: s.count,
        salesSkills: parseFloat(((s.salesTotal / s.count) / 50 * 100).toFixed(1)),
        processAdherence: parseFloat(((s.processTotal / s.count) / 40 * 100).toFixed(1)),
        communication: parseFloat(((s.commTotal / s.count) / 25 * 100).toFixed(1)),
        bestScore: s.bestScore,
        highlights: [
          s.totalScore / s.count >= 85 ? 'Consistently high quality scores' : null,
          (s.converted / s.count) * 100 >= 50 ? 'Strong conversion rate' : null,
          (s.salesTotal / s.count) / 50 * 100 >= 60 ? 'Excellent sales skills' : null,
          (s.processTotal / s.count) / 40 * 100 >= 60 ? 'Great process adherence' : null,
          (s.commTotal / s.count) / 25 * 100 >= 60 ? 'Strong communication' : null,
        ].filter(Boolean).slice(0, 3)
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);
  }, [filteredData]);

  // Bottom Performing Agents (aggregated)
  const bottomAgents = React.useMemo(() => {
    const agentStats = filteredData.reduce((acc, curr) => {
      if (!acc[curr.agent_username]) {
        acc[curr.agent_username] = {
          totalScore: 0, count: 0, converted: 0,
          salesTotal: 0, processTotal: 0, commTotal: 0,
          feedbackMap: {} as Record<string, number>
        };
      }
      const s = acc[curr.agent_username];
      s.totalScore += curr.final_score;
      s.count += 1;
      s.salesTotal += curr.sales_strategy_score;
      s.processTotal += curr.communication_score;
      s.commTotal += curr.customer_experience_score;
      if (curr.crs_booking_status === 'Converted') s.converted += 1;
      if (curr.coaching_feedback) {
        curr.coaching_feedback.forEach((tag: string) => {
          s.feedbackMap[tag] = (s.feedbackMap[tag] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(agentStats)
      .filter(([, s]) => s.count >= 3)
      .map(([name, s]) => {
        const improvements = Object.entries(s.feedbackMap as Record<string, number>)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([tag]) => tag);

        return {
          name,
          avgScore: parseFloat((s.totalScore / s.count).toFixed(1)),
          convRate: parseFloat(((s.converted / s.count) * 100).toFixed(1)),
          calls: s.count,
          salesSkills: parseFloat(((s.salesTotal / s.count) / 50 * 100).toFixed(1)),
          processAdherence: parseFloat(((s.processTotal / s.count) / 40 * 100).toFixed(1)),
          communication: parseFloat(((s.commTotal / s.count) / 25 * 100).toFixed(1)),
          improvements
        };
      })
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 5);
  }, [filteredData]);

  const [activeSpotlight, setActiveSpotlight] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveSpotlight(prev => (prev + 1) % (topPerformers.length || 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [topPerformers.length]);

  // Actionable Insights: Training Priority Index
  const trainingPriority = React.useMemo(() => {
    const feedbackCounts: Record<string, number> = {};
    let totalCallsWithFeedback = 0;

    filteredData.forEach(call => {
      // @ts-ignore - coating_feedback exists in mock data but might not be in generic type definition if not fully updated everywhere
      if (call.coaching_feedback && call.coaching_feedback.length > 0) {
        totalCallsWithFeedback++;
        // @ts-ignore
        call.coaching_feedback.forEach((tag: string) => {
          feedbackCounts[tag] = (feedbackCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(feedbackCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: totalCallsWithFeedback > 0 ? ((count / totalCallsWithFeedback) * 100).toFixed(0) : '0'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [filteredData]);

  // Booking Urgency Distribution
  const urgencyDistribution = React.useMemo(() => {
    const total = filteredData.length || 1;
    const high = filteredData.filter(d => d.booking_urgency === 'High').length;
    const medium = filteredData.filter(d => d.booking_urgency === 'Medium').length;
    const low = filteredData.filter(d => d.booking_urgency === 'Low').length;
    return [
      { name: 'High', value: high, percentage: ((high / total) * 100).toFixed(1), color: '#ef4444' },
      { name: 'Medium', value: medium, percentage: ((medium / total) * 100).toFixed(1), color: '#f59e0b' },
      { name: 'Low', value: low, percentage: ((low / total) * 100).toFixed(1), color: '#94a3b8' },
    ];
  }, [filteredData]);

  // Lead Score Distribution (histogram buckets)
  const leadScoreDistribution = React.useMemo(() => {
    const buckets = [
      { range: '0-20', min: 0, max: 20, count: 0, color: '#ef4444' },
      { range: '21-40', min: 21, max: 40, count: 0, color: '#f97316' },
      { range: '41-60', min: 41, max: 60, count: 0, color: '#f59e0b' },
      { range: '61-80', min: 61, max: 80, count: 0, color: '#3b82f6' },
      { range: '81-100', min: 81, max: 100, count: 0, color: '#8b5cf6' },
    ];
    filteredData.forEach(d => {
      const bucket = buckets.find(b => d.lead_score >= b.min && d.lead_score <= b.max);
      if (bucket) bucket.count++;
    });
    return buckets;
  }, [filteredData]);

  // Technical Issue Rate
  const technicalIssueRate = React.useMemo(() => {
    const total = filteredData.length || 1;
    const issues = filteredData.filter(d => d.major_language_clarity_or_technical_issue).length;
    return { count: issues, rate: ((issues / total) * 100).toFixed(1) };
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
        "flex-1 transition-all duration-300 p-4 lg:p-6 lg:px-8",
        collapsed ? "ml-20" : "ml-[260px]"
      )}>
        {/* Main Content Area */}
        {(activePage === 'overview' || activePage === 'calls' || activePage === 'trends' || activePage === 'agents' || activePage === 'teamleads') && (
          <>
            {/* Top Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                {activePage === 'overview' && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E35205]">Analytics Platform</span>
                      <div className="h-px w-8 bg-orange-200"></div>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Performance <span className="text-[#E35205]">Overview</span></h1>
                    <p className="text-slate-500 text-sm mt-1">Real-time insights from Barbeque Nation Sales Call data</p>
                  </>
                )}
                {activePage === 'calls' && (
                  <>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">All <span className="text-[#E35205]">Calls</span></h1>
                    <p className="text-slate-500 text-sm mt-1">Explore and filter all sales call recordings</p>
                  </>
                )}
                {activePage === 'trends' && (
                  <>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Performance <span className="text-[#E35205]">Trends</span></h1>
                    <p className="text-slate-500 text-sm mt-1">Monitor improvements over time</p>
                  </>
                )}
                {activePage === 'teamleads' && (
                  <>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Team <span className="text-[#E35205]">Leads</span></h1>
                    <p className="text-slate-500 text-sm mt-1">Team-level performance comparison and coaching insights</p>
                  </>
                )}
                {activePage === 'agents' && (
                  <>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Agent <span className="text-[#E35205]">Performance</span></h1>
                    <p className="text-slate-500 text-sm mt-1">Analyze and coach individual agent performance</p>
                  </>
                )}
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-[#E35205]" />
                  <span>
                    {filterDateRange === 'All' ? 'All Time' :
                      filterDateRange === 'Custom' ? `${customStartDate || 'Start'} - ${customEndDate || 'End'}` :
                        filterDateRange}
                  </span>
                </div>
              </div>
            </header>

            {/* Department Filter Section - Only in All Calls */}
            {activePage === 'calls' && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {['All', 'Food & Beverages', 'Ambience & Hygiene', 'Booking & Billing', 'Staff & Service'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setFilterDept(dept)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border uppercase tracking-wider",
                      filterDept === dept
                        ? "bg-orange-50 border-[#E35205] text-[#E35205] shadow-sm shadow-orange-100"
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            )}

            {/* Filters Bar */}
            <div className="bg-white p-5 lg:p-6 rounded-lg shadow-sm border border-slate-100 mb-8 flex flex-col xl:flex-row gap-4 xl:items-end">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 flex-1">
                <FilterGroup label="Date Range" icon={<Calendar className="w-3 h-3" />}>
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E35205] cursor-pointer"
                  >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 14 Days">Last 14 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="All">All Time</option>
                    <option value="Custom">Custom Range</option>
                  </select>
                </FilterGroup>

                {filterDateRange === 'Custom' && (
                  <div className="flex gap-2 items-end sm:col-span-2">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">From</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E35205]"
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">To</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E35205]"
                      />
                    </div>
                  </div>
                )}

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
              <button
                onClick={() => {
                  setFilterDateRange('Last 7 Days');
                  setFilterPerformance('All');
                  setFilterTL('All');
                  setFilterAgent('All');
                  setFilterCategory('All');
                  setFilterConversion('All');
                  setFilterOutlet('All');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 rounded-md px-5 h-[38px] text-xs font-bold transition-all active:scale-[0.98] whitespace-nowrap flex items-center justify-center gap-2 mt-2 xl:mt-0 xl:w-auto w-full group"
              >
                <Filter className="w-3.5 h-3.5 group-hover:text-[#E35205] transition-colors" />
                Reset Filters
              </button>
            </div>
          </>)}

        {activePage === 'overview' && (<>
          {/* Core KPI Ribbon - 4 Primary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
            <KPICard
              title="Total Calls Analyzed"
              value={stats.totalCalls.toLocaleString()}
              icon={<PhoneCall className="w-5 h-5 text-slate-700" />}
              trend={`${comparisonData.volumeDelta}`}
              dateRange={filterDateRange}
              isPositive={comparisonData.isVolumePos}
              color="slate"
              tooltip="Total number of sales calls analyzed in the selected date range, including all booking statuses."
            />
            <KPICard
              title="Avg Quality Score"
              value={`${stats.avgScore}/100`}
              icon={<Star className="w-5 h-5 text-amber-500" />}
              trend={`${comparisonData.scoreDelta}`}
              dateRange={filterDateRange}
              isPositive={comparisonData.isScorePos}
              color="amber"
              tooltip="Average quality score across all analyzed calls. Scored out of 100 based on communication, process adherence, and sales skills."
            />
            <KPICard
              title="Booking Conversion"
              value={`${stats.conversionRate}%`}
              icon={<Target className="w-5 h-5 text-emerald-600" />}
              trend={`${comparisonData.convDelta}`}
              dateRange={filterDateRange}
              isPositive={comparisonData.isConvPos}
              color="emerald"
              tooltip="Percentage of calls that resulted in a confirmed booking. Higher is better — target is 50%+."
            />
            <KPICard
              title="High-Intent Lead %"
              value={`${stats.highIntentPercent}%`}
              icon={<Flame className="w-5 h-5 text-[#E35205]" />}
              trend={`${comparisonData.intentDelta}`}
              dateRange={filterDateRange}
              isPositive={comparisonData.isIntentPos}
              color="orange"
              tooltip="Percentage of callers who showed high buying intent (ready to book). These are your hottest leads."
            />
          </div>

          {/* Secondary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <KPICard
              title="Avg Lead Score"
              value={stats.avgLeadScore}
              icon={<Zap className="w-5 h-5 text-purple-600" />}
              trend="Stable"
              isPositive={true}
              color="purple"
              tooltip="Average lead quality score (0-100) based on caller intent, urgency, and engagement. Higher scores indicate stronger prospects."
            />
            <KPICard
              title="Missed Opportunities"
              value={stats.missedOpportunities}
              icon={<DollarSign className="w-5 h-5 text-rose-500" />}
              trend={`${stats.missedOpportunities} lost`}
              isPositive={false}
              color="rose"
              tooltip="Number of calls where the customer had HIGH buying intent but the agent failed to convert. These are 'money left on the table.'"
            />
            <KPICard
              title="Avg Duration"
              value={`${stats.avgDuration}m`}
              icon={<Clock className="w-5 h-5 text-indigo-500" />}
              trend="Stable"
              isPositive={true}
              color="indigo"
              tooltip="Average call duration in minutes. Optimal range is 3-6 minutes — too short may miss upselling, too long may indicate issues."
            />
          </div>

          {/* Top & Bottom Performing Agents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Performing Agents */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#E35205]/10 rounded-lg">
                    <Trophy className="w-5 h-5 text-[#E35205]" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold text-sm">Top Performing Agents</h3>
                    <p className="text-slate-400 text-[11px]">Highest quality scores this period</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#E35205] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">{topAgents.length} agents</span>
              </div>
              <div className="p-4 overflow-y-auto max-h-[480px]" style={{ scrollbarWidth: 'thin' }}>
                {topAgents.length > 0 ? (
                  <div className="space-y-2.5">
                    {topAgents.map((agent, i) => (
                      <div
                        key={agent.name}
                        onClick={() => {
                          setFilterAgent(agent.name);
                          setActivePage('agents');
                        }}
                        className="group relative rounded-lg p-3.5 border border-slate-100 hover:border-[#E35205]/30 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black shrink-0",
                              i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-500"
                            )}>
                              {i + 1}
                            </div>
                            <div>
                              <h4 className="text-[13px] font-bold text-slate-800">{agent.name}</h4>
                              <p className="text-[10px] text-slate-400">{agent.calls} calls</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-base font-black text-[#E35205]">{agent.avgScore}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mb-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <Target className="w-2.5 h-2.5 text-slate-400" />{agent.convRate}% conv
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <TrendingUp className="w-2.5 h-2.5 text-slate-400" />{agent.salesSkills}% sales
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <CheckCircle2 className="w-2.5 h-2.5 text-slate-400" />{agent.processAdherence}% process
                          </span>
                        </div>

                        {agent.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {agent.highlights.map((h, j) => (
                              <span key={j} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-orange-50 text-[#E35205] border border-orange-100/60">
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-[9px] font-semibold text-[#E35205] opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3 h-3" /> View agent details →
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 py-10 text-center italic border border-dashed border-slate-200 rounded-lg">Not enough data to determine top performers.</div>
                )}
              </div>
            </div>

            {/* Bottom Performing Agents */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold text-sm">Needs Improvement</h3>
                    <p className="text-slate-400 text-[11px]">Agents requiring coaching & support</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">{bottomAgents.length} agents</span>
              </div>
              <div className="p-4 overflow-y-auto max-h-[480px]" style={{ scrollbarWidth: 'thin' }}>
                {bottomAgents.length > 0 ? (
                  <div className="space-y-2.5">
                    {bottomAgents.map((agent, i) => (
                      <div
                        key={agent.name}
                        onClick={() => {
                          setFilterAgent(agent.name);
                          setActivePage('agents');
                        }}
                        className="group relative rounded-lg p-3.5 border border-slate-100 hover:border-rose-200 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-rose-50 flex items-center justify-center text-[11px] font-black text-rose-500 shrink-0">
                              {i + 1}
                            </div>
                            <div>
                              <h4 className="text-[13px] font-bold text-slate-800">{agent.name}</h4>
                              <p className="text-[10px] text-slate-400">{agent.calls} calls</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "text-base font-black",
                              agent.avgScore < 70 ? "text-rose-500" : agent.avgScore < 80 ? "text-amber-500" : "text-slate-600"
                            )}>{agent.avgScore}</div>
                          </div>
                        </div>

                        <div className="flex gap-3 mb-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <Target className="w-2.5 h-2.5 text-slate-400" />{agent.convRate}% conv
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <TrendingUp className="w-2.5 h-2.5 text-slate-400" />{agent.salesSkills}% sales
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <CheckCircle2 className="w-2.5 h-2.5 text-slate-400" />{agent.processAdherence}% process
                          </span>
                        </div>

                        {agent.improvements.length > 0 && (
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Communication</span>
                            <div className="flex flex-wrap gap-1">
                              {agent.improvements.map((imp, j) => (
                                <span key={j} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100/60">
                                  {imp}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 py-10 text-center italic border border-dashed border-slate-200 rounded-lg">Not enough data to identify improvement areas.</div>
                )}
              </div>
            </div>
          </div>

          {/* Quality Distribution & Customer Intent Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Quality Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-[#E35205]" />
                <h3 className="text-base font-bold text-slate-800">Quality Distribution</h3>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-[300px] w-full" style={{ overflow: 'visible' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 40, bottom: 10, left: 40 }}>
                      <Pie
                        data={scoreBuckets.map(b => ({ name: b.label.split(' ')[0], value: b.count, pct: b.pct, color: b.color }))}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={90}
                        dataKey="value"
                        strokeWidth={3}
                        stroke="#fff"
                        isAnimationActive={false}
                        label={({ name, pct }: any) => `${name} (${pct}%)`}
                        labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                      >
                        {scoreBuckets.map((bucket, index) => (
                          <Cell key={`cell-${index}`} fill={bucket.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        formatter={(value: any, name: any) => [`${value} calls`, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="square"
                        iconSize={10}
                        wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Count Cards */}
                <div className="grid grid-cols-4 gap-2 w-full mt-2">
                  {scoreBuckets.map((bucket) => (
                    <div
                      key={bucket.label}
                      className="rounded-lg py-2.5 px-3 text-center border transition-all hover:shadow-sm"
                      style={{ backgroundColor: `${bucket.color}08`, borderColor: `${bucket.color}25` }}
                    >
                      <div className="text-xl font-black" style={{ color: bucket.color }}>{bucket.count}</div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{bucket.label.split(' ')[0]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Intent Analysis */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-[#E35205]" />
                <h3 className="text-base font-bold text-slate-800">Customer Intent Analysis</h3>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-[300px] w-full" style={{ overflow: 'visible' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                      <Pie
                        data={intentData}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={90}
                        dataKey="value"
                        strokeWidth={3}
                        stroke="#fff"
                        isAnimationActive={false}
                        label={({ name, percent }) => `${(name || '').split(' ')[0]} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                      >
                        <Cell fill="#E35205" />
                        <Cell fill="#fbbf24" />
                        <Cell fill="#94a3b8" />
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        formatter={(value: any, name: any) => [`${value} calls`, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="square"
                        iconSize={10}
                        wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Count Cards */}
                <div className="grid grid-cols-3 gap-3 w-full mt-2">
                  {[
                    { label: 'High Intent', value: intentData.find(d => d.name === 'High Intent')?.value || 0, color: '#E35205' },
                    { label: 'Medium Intent', value: intentData.find(d => d.name === 'Medium Intent')?.value || 0, color: '#f59e0b' },
                    { label: 'Low Intent', value: intentData.find(d => d.name === 'Low Intent')?.value || 0, color: '#94a3b8' }
                  ].map((intent) => (
                    <div
                      key={intent.label}
                      className="rounded-lg py-2.5 px-3 text-center border transition-all hover:shadow-sm"
                      style={{ backgroundColor: `${intent.color}08`, borderColor: `${intent.color}25` }}
                    >
                      <div className="text-xl font-black" style={{ color: intent.color }}>{intent.value}</div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{intent.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Urgency Distribution & Lead Score Distribution & Tech Issues */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Booking Urgency Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-[#E35205]" />
                <h3 className="text-base font-bold text-slate-800">Booking Urgency</h3>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-[220px] w-full" style={{ overflow: 'visible' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie
                        data={urgencyDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        strokeWidth={3}
                        stroke="#fff"
                        isAnimationActive={false}
                        label={({ name, percentage }: any) => `${name} ${percentage}%`}
                        labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                      >
                        {urgencyDistribution.map((entry, index) => (
                          <Cell key={`urgency-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        formatter={(value: any, name: any) => [`${value} calls`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full mt-2">
                  {urgencyDistribution.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-lg py-2 px-2 text-center border transition-all hover:shadow-sm"
                      style={{ backgroundColor: `${item.color}08`, borderColor: `${item.color}25` }}
                    >
                      <div className="text-lg font-black" style={{ color: item.color }}>{item.value}</div>
                      <div className="text-[10px] font-semibold text-slate-500">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lead Score Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#E35205]" />
                <h3 className="text-base font-bold text-slate-800">Lead Score Distribution</h3>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadScoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      formatter={(value: any) => [`${value} calls`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                      {leadScoreDistribution.map((entry, index) => (
                        <Cell key={`lead-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Technical Issue Rate */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-[#E35205]" />
                <h3 className="text-base font-bold text-slate-800">Technical Issues</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={parseFloat(technicalIssueRate.rate) > 5 ? '#ef4444' : '#10b981'}
                      strokeWidth="10"
                      strokeDasharray={`${parseFloat(technicalIssueRate.rate) * 2.64} ${264 - parseFloat(technicalIssueRate.rate) * 2.64}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-2xl font-black",
                      parseFloat(technicalIssueRate.rate) > 5 ? 'text-rose-600' : 'text-emerald-600'
                    )}>{technicalIssueRate.rate}%</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Issue Rate</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">{technicalIssueRate.count} calls</p>
                  <p className="text-xs text-slate-400 mt-0.5">flagged with language/technical issues</p>
                </div>
                <div className={cn(
                  "mt-4 px-4 py-2 rounded-lg text-xs font-semibold",
                  parseFloat(technicalIssueRate.rate) > 5 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                )}>
                  {parseFloat(technicalIssueRate.rate) > 5 ? '⚠ Above 5% threshold — needs attention' : '✓ Within acceptable range'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Volume Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-12">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-[#E35205]" />
                <h3 className="text-base font-bold text-slate-800">Call Volume Trend</h3>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={temporalData}>
                    <defs>
                      <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E35205" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#E35205" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="calls" stroke="#E35205" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Reason for Loss (Non-Conversion Breakdown) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#E35205]" />
                <div>
                  <h3 className="text-base font-bold text-slate-800">Reason for Loss</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Non-Conversion Breakdown — Why deals didn&apos;t close</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                {filteredData.filter(d => d.crs_booking_status === 'Non-Converted').length} lost deals
              </span>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lossReasons}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis
                    dataKey="reason"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                    width={200}
                    tickFormatter={(val) => val.length > 30 ? val.substring(0, 30) + '...' : val}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', whiteSpace: 'normal', maxWidth: '300px' }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(value: any) => [`${value} calls`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28} cursor="pointer"
                    onClick={(_: any, index: number) => {
                      setSelectedLossReason(lossReasons[index].reason);
                      setLossModalOpen(true);
                    }}
                  >
                    {lossReasons.map((_: any, index: number) => (
                      <Cell
                        key={`loss-${index}`}
                        fill={index === 0 ? '#ef4444' : index === 1 ? '#f97316' : index === 2 ? '#f59e0b' : index < 5 ? '#fbbf24' : '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </>
        )}

        {activePage === 'agents' && (
          <AgentPerformancePage
            data={filteredData}
            selectedAgent={filterAgent}
            setSelectedAgent={setFilterAgent}
            goBack={() => setActivePage('overview')}
          />
        )}

        {activePage === 'calls' && (
          <CallLogsPage data={filteredData} onCallClick={setSelectedCall} />
        )}

        {activePage === 'trends' && (
          <TrendsPage data={filteredData} />
        )}

        {activePage === 'teamleads' && (
          <TeamLeadPage data={filteredData} />
        )}

        {/* Reason for Loss Modal Content (Extracted for readability) */}
        {/* Call Details Modal */}
        {selectedCall && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedCall(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <PhoneCall className="w-5 h-5 text-[#E35205]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Call Analysis Report — {selectedCall.id}</h3>
                    <p className="text-xs text-slate-500">{format(parseISO(selectedCall.call_time), 'PPpp')} · {Math.floor(selectedCall.call_duration / 60)}m {(selectedCall.call_duration % 60).toString().padStart(2, '0')}s</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    selectedCall.final_score >= 90 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      selectedCall.final_score >= 75 ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        selectedCall.final_score >= 60 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                  )}>{selectedCall.final_score_tag} · {selectedCall.final_score}/100</span>
                  <button
                    onClick={() => setSelectedCall(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>

                {/* Section 1: Call Summary */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#E35205] mb-4 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Call Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Agent</div>
                      <div className="text-sm font-bold text-slate-800">{selectedCall.agent_username}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Team Lead</div>
                      <div className="text-sm font-bold text-slate-800">{selectedCall.tl_name}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Outlet</div>
                      <div className="text-sm font-bold text-slate-800">{selectedCall.outlet_location}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Category</div>
                      <div className="text-sm font-bold text-slate-800">{selectedCall.call_category}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Department</div>
                      <div className="text-sm font-bold text-[#E35205]">{selectedCall.department}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Technical Issue</div>
                      <div className={cn("text-sm font-bold", selectedCall.major_language_clarity_or_technical_issue ? "text-rose-600" : "text-emerald-600")}>
                        {selectedCall.major_language_clarity_or_technical_issue ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Duration</div>
                      <div className="text-sm font-bold text-slate-800">{Math.floor(selectedCall.call_duration / 60)}m {(selectedCall.call_duration % 60).toString().padStart(2, '0')}s</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Customer Experience</div>
                      <div className="text-sm font-bold text-slate-800">{selectedCall.customer_experience_score}/25</div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Conversation Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#E35205] mb-4 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" /> Conversation Highlights
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-3 text-center border border-purple-100">
                        <div className="text-[10px] font-semibold text-purple-500 uppercase tracking-wider mb-1">Lead Score</div>
                        <div className="text-2xl font-black text-purple-700">{selectedCall.lead_score}</div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-white rounded-lg p-3 text-center border border-amber-100">
                        <div className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Urgency</div>
                        <div className={cn("text-lg font-black",
                          selectedCall.booking_urgency === 'High' ? "text-rose-600" :
                            selectedCall.booking_urgency === 'Medium' ? "text-amber-600" : "text-slate-500"
                        )}>{selectedCall.booking_urgency}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Booking Status</div>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          selectedCall.crs_booking_status === 'Converted' ? "bg-emerald-100 text-emerald-700" :
                            selectedCall.crs_booking_status === 'Non-Converted' ? "bg-rose-100 text-rose-700" :
                              "bg-amber-100 text-amber-700"
                        )}>
                          {selectedCall.crs_booking_status === 'Converted' ? <CheckCircle2 className="w-3 h-3" /> :
                            selectedCall.crs_booking_status === 'Non-Converted' ? <XCircle className="w-3 h-3" /> : null}
                          {selectedCall.crs_booking_status}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Intent</div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          selectedCall.initial_intent_tag === 'High Intent' ? "bg-orange-100 text-[#E35205]" :
                            selectedCall.initial_intent_tag === 'Medium Intent' ? "bg-amber-100 text-amber-600" :
                              "bg-slate-200 text-slate-600"
                        )}>{selectedCall.initial_intent_tag}</span>
                      </div>
                    </div>
                  </div>

                  {/* Agent Performance Evaluation */}
                  <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#E35205] mb-4 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5" /> Agent Performance Evaluation
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-600">Customer Experience</span>
                          <span className="text-xs font-black text-slate-800">{selectedCall.customer_experience_score}/25</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((selectedCall.customer_experience_score / 25) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-600">Communication</span>
                          <span className="text-xs font-black text-slate-800">{selectedCall.communication_score}/40</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((selectedCall.communication_score / 40) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-600">Sales Strategy</span>
                          <span className="text-xs font-black text-slate-800">{selectedCall.sales_strategy_score}/50</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-[#E35205] h-2 rounded-full transition-all" style={{ width: `${Math.min((selectedCall.sales_strategy_score / 50) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 mt-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-bold text-slate-800">Final Score</span>
                          <span className={cn("text-xl font-black",
                            selectedCall.final_score >= 90 ? "text-emerald-600" :
                              selectedCall.final_score >= 75 ? "text-blue-600" :
                                selectedCall.final_score >= 60 ? "text-amber-600" : "text-rose-600"
                          )}>{selectedCall.final_score}<span className="text-sm text-slate-400">/100</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Conversation Summary */}
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#E35205] mb-3 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" /> Conversation Summary
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedCall.conversation_summary}</p>
                </div>

                {/* Section 4: Key Highlights & Areas of Improvement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Key Highlights
                    </h4>
                    {selectedCall.key_highlights.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedCall.key_highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No notable highlights for this call.</p>
                    )}
                  </div>

                  <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Areas of Improvement
                    </h4>
                    {selectedCall.areas_of_improvement.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedCall.areas_of_improvement.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No improvement areas identified. Excellent performance.</p>
                    )}
                  </div>
                </div>

                {/* Section 5: Coaching Feedback Tags */}
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#E35205] mb-3 flex items-center gap-2">
                    <Award className="w-3.5 h-3.5" /> Coaching Feedback
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCall.coaching_feedback.length > 0 ? selectedCall.coaching_feedback.map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-semibold">
                        {tag}
                      </span>
                    )) : (
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg">✓ No coaching feedback needed — high performance call</span>
                    )}
                  </div>
                </div>

                {/* Section 6: Call Recording Player */}
                <div className="bg-slate-900 rounded-xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-[#E35205]" />
                      <span className="font-bold text-sm">Call Recording</span>
                    </div>
                    <span className="text-xs text-slate-400">{Math.floor(selectedCall.call_duration / 60)}:{(selectedCall.call_duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                    <div className="bg-gradient-to-r from-[#E35205] to-[#FF6B00] h-full w-[40%] rounded-full"></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>02:45</span>
                    <span>{Math.floor(selectedCall.call_duration / 60)}:{(selectedCall.call_duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loss Reason Drill-down Modal */}
        {lossModalOpen && selectedLossReason && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setLossModalOpen(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Calls Lost Due To
                  </h3>
                  <p className="text-sm text-rose-600 font-semibold mt-0.5">&ldquo;{selectedLossReason}&rdquo;</p>
                </div>
                <button onClick={() => setLossModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Body - Call List */}
              <div className="overflow-y-auto flex-1 p-6">
                {(() => {
                  const matchingCalls = filteredData.filter(
                    d => d.crs_booking_status === 'Non-Converted' && d.coaching_feedback.includes(selectedLossReason)
                  );
                  if (matchingCalls.length === 0) return <div className="text-center text-slate-400 py-12">No matching calls found.</div>;
                  return (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-500 mb-4">
                        Showing <span className="font-bold text-slate-800">{matchingCalls.length}</span> non-converted calls with this issue
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Agent</th>
                            <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Date & Time</th>
                            <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</th>
                            <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Intent</th>
                            <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</th>
                            <th className="text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">All Issues in This Call</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchingCalls.slice(0, 50).map((call, idx) => (
                            <tr key={call.id} className={cn("border-b border-slate-50 hover:bg-orange-50/30 transition-colors", idx % 2 === 0 ? 'bg-slate-50/30' : '')}>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-slate-800 text-xs">{call.agent_username}</span>
                                <span className="text-[10px] text-slate-400 block">{call.tl_name}</span>
                              </td>
                              <td className="py-2.5 px-3 text-xs text-slate-600">{format(parseISO(call.call_time), 'MMM dd, hh:mm a')}</td>
                              <td className="py-2.5 px-3">
                                <span className={cn(
                                  "text-xs font-bold px-1.5 py-0.5 rounded",
                                  call.final_score >= 85 ? 'bg-emerald-50 text-emerald-700' : call.final_score >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                )}>{call.final_score}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={cn(
                                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                  call.initial_intent_tag === 'High Intent' ? 'bg-orange-50 text-[#E35205]' : call.initial_intent_tag === 'Medium Intent' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                                )}>{call.initial_intent_tag}</span>
                              </td>
                              <td className="py-2.5 px-3 text-xs text-slate-600">{Math.floor(call.call_duration / 60)}m {call.call_duration % 60}s</td>
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {call.coaching_feedback.map((tag, j) => (
                                    <span key={j} className={cn(
                                      "text-[9px] font-medium px-1.5 py-0.5 rounded",
                                      tag === selectedLossReason ? 'bg-rose-100 text-rose-700 font-bold border border-rose-200' : 'bg-slate-100 text-slate-500'
                                    )}>{tag}</span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {matchingCalls.length > 50 && (
                        <p className="text-center text-xs text-slate-400 mt-4">Showing 50 of {matchingCalls.length} calls</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KPICard({ title, value, icon, trend, isPositive, color, dateRange, tooltip }: any) {
  const [showTooltip, setShowTooltip] = React.useState(false);
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
      className="bg-white p-5 rounded-xl shadow-sm border border-slate-100/60 flex flex-col justify-center relative group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 w-9 h-9", colorMap[color])}>
          {icon}
        </div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest leading-tight flex-1">{title}</p>
        {tooltip && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="p-0.5 rounded-full text-slate-300 hover:text-[#E35205] transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-7 z-[100] w-60 bg-white text-slate-600 text-[11px] leading-relaxed rounded-xl px-4 py-3 shadow-lg border border-slate-200 pointer-events-none">
                {tooltip}
                <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white border-l border-t border-slate-200 rotate-45"></div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
        <h4 className="text-2xl leading-none font-bold text-slate-800 tracking-tight whitespace-nowrap">{value}</h4>
        {trend && (
          <div className={cn(
            "text-[9.5px] font-bold px-2 py-1 rounded-[4px] flex items-center whitespace-nowrap",
            isPositive ? "text-emerald-700 bg-emerald-100/50" : "text-rose-700 bg-rose-100/50"
          )}>
            {trend} {dateRange === 'Last 7 Days' && "vs prev"}
          </div>
        )}
      </div>

      {/* Decorative gradient blur in background */}
      <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity", colorMap[color].split(' ')[0])} />
    </motion.div>
  );
}

function ChartCard({ title, children, className }: any) {
  return (
    <div className={cn("bg-white p-6 rounded-lg shadow-sm border border-slate-100", className)}>
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
