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
  { id: 'calls', name: 'All Calls', icon: PhoneCall },
  { id: 'trends', name: 'Trends', icon: BarChart3 },
];

export default function Sidebar({ collapsed, setCollapsed, activePage, setActivePage }: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-40 flex flex-col shadow-lg"
    >
      {/* Collapse Toggle Tag */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-md flex items-center justify-center cursor-pointer shadow-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 z-50 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
      {/* Logo Section */}
      <div className={cn(
        "h-20 flex items-center px-6 mb-4",
        collapsed ? "justify-center px-0" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E35205] to-[#FF6B00] rounded-md flex items-center justify-center shadow-lg shadow-orange-200">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">BBQ <span className="text-[#E35205]">Nation</span></span>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-[#E35205] to-[#FF6B00] rounded-md flex items-center justify-center shadow-lg shadow-orange-200">
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
                "w-full flex items-center gap-3 py-3 rounded-md transition-all duration-200 group relative",
                collapsed ? "justify-center px-0" : "px-3",
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

      <div className="p-3 border-t border-slate-100 flex flex-col justify-end">
        <button className={cn(
          "w-full flex items-center gap-3 py-3 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group",
          collapsed ? "justify-center px-0" : "px-3"
        )}>
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
