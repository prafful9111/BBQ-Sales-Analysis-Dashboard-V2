import React from 'react';
import { format, parseISO } from 'date-fns';
import { PlayCircle, CheckCircle2, XCircle, Hourglass, PhoneCall, Search } from 'lucide-react';
import { CallData } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function CallLogsPage({ data, onCallClick }: { data: CallData[], onCallClick: (call: CallData) => void }) {
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredData = React.useMemo(() => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(call =>
            call.agent_username.toLowerCase().includes(term) ||
            call.outlet_location.toLowerCase().includes(term) ||
            call.call_category.toLowerCase().includes(term) ||
            call.tl_name.toLowerCase().includes(term)
        );
    }, [data, searchTerm]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <PhoneCall className="w-5 h-5 text-slate-500" />
                    <h2 className="text-base font-bold text-slate-800">Call Logs</h2>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search calls, agents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs focus:outline-none focus:border-[#E35205] focus:ring-1 focus:ring-orange-100 w-64 transition-all"
                        />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                        {filteredData.length} calls
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-5 py-3.5 font-semibold">Date & Time</th>
                            <th className="px-5 py-3.5 font-semibold">Agent</th>
                            <th className="px-5 py-3.5 font-semibold">Outlet</th>
                            <th className="px-5 py-3.5 font-semibold">Category</th>
                            <th className="px-5 py-3.5 font-semibold">Status</th>
                            <th className="px-5 py-3.5 font-semibold">Intent</th>
                            <th className="px-5 py-3.5 font-semibold text-center">Score</th>
                            <th className="px-5 py-3.5 font-semibold text-center">Duration</th>
                            <th className="px-5 py-3.5 font-semibold text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.map((call, idx) => (
                            <tr
                                key={call.id}
                                onClick={() => onCallClick(call)}
                                className={cn("hover:bg-slate-50/70 transition-colors cursor-pointer group/row", idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}
                            >
                                <td className="px-5 py-3 text-xs text-slate-600">
                                    <div className="font-semibold text-slate-700">{format(parseISO(call.call_time), 'MMM dd, yyyy')}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{format(parseISO(call.call_time), 'hh:mm a')}</div>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="text-xs font-bold text-slate-700 group-hover/row:text-[#E35205] transition-colors">{call.agent_username}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{call.tl_name}</div>
                                </td>
                                <td className="px-5 py-3 text-xs text-slate-600 truncate max-w-[140px]" title={call.outlet_location}>
                                    {call.outlet_location}
                                </td>
                                <td className="px-5 py-3 text-xs text-slate-600">
                                    {call.call_category}
                                </td>
                                <td className="px-5 py-3">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                        call.crs_booking_status === 'Converted' ? "bg-emerald-50 text-emerald-700" :
                                            call.crs_booking_status === 'Non-Converted' ? "bg-rose-50 text-rose-700" :
                                                "bg-amber-50 text-amber-700"
                                    )}>
                                        {call.crs_booking_status === 'Converted' ? <CheckCircle2 className="w-3 h-3" /> :
                                            call.crs_booking_status === 'Non-Converted' ? <XCircle className="w-3 h-3" /> :
                                                <Hourglass className="w-3 h-3" />}
                                        {call.crs_booking_status}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={cn(
                                        "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                        call.initial_intent_tag === 'High Intent' ? "bg-orange-50 text-[#E35205]" :
                                            call.initial_intent_tag === 'Medium Intent' ? "bg-amber-50 text-amber-600" :
                                                "bg-slate-100 text-slate-500"
                                    )}>
                                        {call.initial_intent_tag}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-center">
                                    <span className={cn(
                                        "inline-block min-w-8 text-center text-[11px] font-bold px-1.5 py-0.5 rounded",
                                        call.final_score >= 85 ? 'bg-emerald-50 text-emerald-700' :
                                            call.final_score >= 70 ? 'bg-amber-50 text-amber-700' :
                                                'bg-rose-50 text-rose-700'
                                    )}>{call.final_score}</span>
                                </td>
                                <td className="px-5 py-3 text-center text-xs text-slate-500 font-medium">
                                    {Math.floor(call.call_duration / 60)}m {(call.call_duration % 60).toString().padStart(2, '0')}s
                                </td>
                                <td className="px-5 py-3 text-center">
                                    <button className="p-1.5 rounded-full hover:bg-slate-100 hover:text-[#E35205] text-slate-400 transition-colors" title="View Details">
                                        <Search className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredData.length === 0 && (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                            <Search className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">No calls found</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Adjust your search to see more results.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

