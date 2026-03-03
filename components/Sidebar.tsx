'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PhoneCall, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Flame
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activePage: string;
  setActivePage: (page: string) => void;
}

const menuItems = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'agents', name: 'Agent Performance', icon: Users },
  { id: 'calls', name: 'Call Logs', icon: PhoneCall },
  { id: 'analytics', name: 'Deep Analytics', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed, activePage, setActivePage }: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-50 flex flex-col transition-all duration-300 shadow-xl",
        collapsed ? "items-center" : "items-stretch"
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        "h-20 flex items-center px-6 mb-4",
        collapsed ? "justify-center px-0" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E35205] to-[#FF6B00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">BBQ <span className="text-[#E35205]">Nation</span></span>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-[#E35205] to-[#FF6B00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <Flame className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-gradient-to-r from-[#E35205] to-[#FF6B00] text-white shadow-lg shadow-orange-100" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "group-hover:text-[#E35205]")} />
              {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
              
              {collapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <button className={cn(
          "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group",
          collapsed ? "justify-center" : ""
        )}>
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>

        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-200",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && <span className="text-xs font-semibold uppercase tracking-wider">Collapse</span>}
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </motion.aside>
  );
}
