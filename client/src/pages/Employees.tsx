import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import AddEmployeeModal from '../components/employees/AddEmployeeModal';
import { UserPlus, Briefcase, Mail, Code2, Wallet } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/employees');
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const safelyParseSkills = (skillsData: any): string[] => {
    if (!skillsData) return [];
    if (Array.isArray(skillsData)) return skillsData; 
    try {
      const parsed = JSON.parse(skillsData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return []; 
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Directory</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your workforce and their skillsets.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Employee
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-400">Loading team members...</div>
      ) : employees.length === 0 ? (
        <div className="text-slate-400 border border-dashed border-[#334155] rounded-xl p-12 text-center">
          No employees found. Click "Add Employee" to build your team!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {employees.map((emp) => {
            const skillsArray = safelyParseSkills(emp.skills);

            return (
              <div key={emp.id} className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{emp.name}</h3>
                    <div className="flex items-center text-indigo-400 text-sm mt-1">
                      <Briefcase className="w-4 h-4 mr-1.5" />
                      {emp.role} {emp.department && `• ${emp.department}`}
                    </div>
                  </div>
                  <span className="bg-[#0f172a] text-slate-300 text-xs px-2 py-1 rounded border border-[#334155]">
                    Active
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-slate-400 text-sm">
                    <Mail className="w-4 h-4 mr-2" />
                    {emp.email}
                  </div>
                  {emp.wallet_address && (
                    <div className="flex items-center text-slate-400 text-sm">
                      <Wallet className="w-4 h-4 mr-2" />
                      <span className="truncate" title={emp.wallet_address}>{emp.wallet_address}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#334155]">
                  <div className="flex items-center text-slate-300 text-sm mb-2 font-medium">
                    <Code2 className="w-4 h-4 mr-2" /> Skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillsArray.length > 0 ? (
                      skillsArray.map((skill: string, idx: number) => (
                        <span key={idx} className="bg-[#0f172a] border border-[#334155] text-slate-300 text-xs px-2 py-1 rounded-md">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-xs italic">No skills listed</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <AddEmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchEmployees();
        }} 
      />
    </div>
  );
}