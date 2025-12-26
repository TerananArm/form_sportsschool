'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Search, Filter, ShieldAlert, Clock, User, FileText, RefreshCcw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function AuditLogPage() {
    const { t } = useLanguage();
    const { data, isLoading, mutate } = useSWR('/api/audit', fetcher);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('ALL');

    const logs = data?.logs || [];

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.performedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resource?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAction = filterAction === 'ALL' || log.action === filterAction;

        return matchesSearch && matchesAction;
    });

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'LOGIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ShieldAlert className="text-blue-600" />
                        Audit Logs (บันทึกความปลอดภัย)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">ตรวจสอบประวัติการใช้งานและการแก้ไขข้อมูลในระบบ</p>
                </div>
                <button
                    onClick={() => mutate()}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <RefreshCcw size={16} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'].map(action => (
                        <button
                            key={action}
                            onClick={() => setFilterAction(action)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border
                                ${filterAction === action
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            {action === 'ALL' ? 'ทั้งหมด' : action}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Resource</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading logs...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No logs found</td></tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-slate-400" />
                                                {new Date(log.createdAt).toLocaleString('th-TH')}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {log.resource} <span className="text-slate-400 text-xs">#{log.resourceId}</span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={log.details}>
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} className="text-slate-400 shrink-0" />
                                                {log.details}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-slate-400" />
                                                {log.performedBy}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
