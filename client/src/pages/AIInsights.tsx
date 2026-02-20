import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { BrainCircuit, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';

export default function AIInsights() {
  const [scores, setScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await api.get('/ai/scores');
        setScores(res.data.data);
      } catch (error) {
        console.error("Failed to fetch AI scores", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScores();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'down': return <TrendingDown className="w-5 h-5 text-red-400" />;
      default: return <Minus className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      <div className="flex items-center justify-between mb-8 border-b border-[#334155] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <BrainCircuit className="w-7 h-7 text-indigo-500 mr-3" />
            AI Workforce Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time productivity scoring based on task completion algorithms.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-400 animate-pulse">Running AI analysis...</div>
      ) : scores.length === 0 ? (
        <div className="bg-[#1e293b] border border-dashed border-[#334155] rounded-xl p-12 text-center">
          <BrainCircuit className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-white mb-1">No Data Available Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            The AI engine requires employees to complete tasks before it can generate a productivity score. Assign and complete a task to see insights here!
          </p>
        </div>
      ) : (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f172a]/50 text-slate-300 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold border-b border-[#334155]">Employee Rank</th>
                <th className="p-4 font-semibold border-b border-[#334155]">Role</th>
                <th className="p-4 font-semibold border-b border-[#334155]">AI Productivity Score</th>
                <th className="p-4 font-semibold border-b border-[#334155]">Completion Rate</th>
                <th className="p-4 font-semibold border-b border-[#334155]">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {scores.map((score, index) => (
                <tr key={index} className="hover:bg-[#334155]/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center">
                      {index === 0 && <Award className="w-5 h-5 text-amber-400 mr-2" />}
                      <span className={`font-medium ${index === 0 ? 'text-amber-400' : 'text-white'}`}>
                        {index + 1}. {score.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{score.role}</td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="w-full bg-[#0f172a] rounded-full h-2.5 mr-3 max-w-[100px] border border-[#334155]">
                        <div 
                          className="bg-indigo-500 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(0, score.productivity_score))}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-white">{parseFloat(score.productivity_score).toFixed(0)}/100</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">
                    {(parseFloat(score.task_completion_rate) * 100).toFixed(0)}%
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(score.trend)}
                      <span className="text-sm text-slate-400 capitalize">{score.trend}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}