import React from 'react';
import { Trophy, MessageSquare, Beer, GraduationCap, HelpCircle } from 'lucide-react';

interface Contributor {
  nom: string;
  score: number;
}

interface StatsData {
  totalMessages: number;
  aperoCount: number;
  citeCount: number;
  questionCount: number;
  topBavardsList: { name: string; count: number }[];
}

interface TopWidgetProps {
  stats: StatsData | null;
}

export default function TopContributorsWidget({ stats }: TopWidgetProps) {
  if (!stats) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex items-center justify-center h-64">
        <p className="text-xs text-gray-400 animate-pulse">Chargement des statistiques WhatsApp...</p>
      </div>
    );
  }

  const podiumStyles = [
    { bg: 'bg-amber-50/80 border-amber-200 text-amber-900', badge: 'bg-amber-500 text-white' },
    { bg: 'bg-slate-50/80 border-slate-200 text-slate-900', badge: 'bg-slate-400 text-white' },
    { bg: 'bg-orange-50/80 border-orange-200 text-orange-900', badge: 'bg-amber-600 text-white' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between space-y-6">
      
      {/* SECTION 1 : Les indicateurs globaux */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            Statistiques WhatsApp
          </h3>
          <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
            Actif
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100 text-center">
            <p className="text-[10px] text-purple-600 font-bold uppercase">Messages</p>
            <p className="text-lg font-extrabold text-purple-900 mt-0.5">{stats.totalMessages}</p>
          </div>
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-center">
            <p className="text-[10px] text-amber-600 font-bold uppercase flex items-center justify-center gap-1">
              <Beer className="w-3 h-3" /> Apéro
            </p>
            <p className="text-lg font-extrabold text-amber-900 mt-0.5">{stats.aperoCount}</p>
          </div>
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-center">
            <p className="text-[10px] text-blue-600 font-bold uppercase flex items-center justify-center gap-1">
              <GraduationCap className="w-3 h-3" /> École
            </p>
            <p className="text-lg font-extrabold text-blue-900 mt-0.5">{stats.citeCount}</p>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-center">
            <p className="text-[10px] text-emerald-600 font-bold uppercase flex items-center justify-center gap-1">
              <HelpCircle className="w-3 h-3" /> Questions
            </p>
            <p className="text-lg font-extrabold text-emerald-900 mt-0.5">{stats.questionCount}</p>
          </div>
        </div>
      </div>

      {/* SECTION 2 : Le Top 3 des bavards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top 3 des bavards
          </h4>
        </div>

        <div className="space-y-2.5">
          {stats.topBavardsList?.slice(0, 3).map((item, index) => {
            const style = podiumStyles[index] || { bg: 'bg-gray-50 border-gray-200 text-gray-800', badge: 'bg-gray-400 text-white' };

            return (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 rounded-xl border ${style.bg} transition-all`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] shadow-2xs ${style.badge}`}>
                    {index + 1}
                  </span>
                  <span className="font-semibold text-xs text-gray-900">{item.name}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white/90 shadow-2xs text-gray-700 border border-gray-100">
                  {item.count} messages
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-gray-50 text-right">
        <span className="text-[11px] font-medium text-purple-700 hover:text-purple-800 cursor-pointer transition-colors">
          Gérer les analyses WhatsApp →
        </span>
      </div>

    </div>
  );
}