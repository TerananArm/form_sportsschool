'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { User, Activity, MapPin, Award, TrendingUp, Users, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import DashboardCharts from '../components/DashboardCharts';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function DashboardPage() {
    const { data, isLoading } = useSWR('/api/applicants', fetcher);
    const applicants = data?.data || [];

    // Calculate stats
    const total = applicants.length;
    const male = applicants.filter(a => a.gender === 'male').length;
    const female = applicants.filter(a => a.gender === 'female').length;

    // Status breakdown
    const statusCounts = {
        pending: applicants.filter(a => !a.status || a.status === 'รอสัมภาษณ์').length,
        passed: applicants.filter(a => a.status === 'ผ่านการคัดเลือก').length,
        failed: applicants.filter(a => a.status === 'ไม่ผ่าน').length,
        withdrawn: applicants.filter(a => a.status === 'สละสิทธิ์').length,
    };

    // Group by sport
    const sportCounts = applicants.reduce((acc, curr) => {
        acc[curr.sportType] = (acc[curr.sportType] || 0) + 1;
        return acc;
    }, {});

    const topSports = Object.entries(sportCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const maxSportCount = topSports.length > 0 ? topSports[0][1] : 1;

    return (
        <div className="space-y-8 animate-fade-in pb-20">

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Total Applicants */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-3xl p-6 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">ผู้สมัครทั้งหมด</p>
                            <h2 className="text-4xl font-bold text-slate-800 dark:text-white">{isLoading ? '...' : total}</h2>
                            <p className="text-xs text-slate-400 mt-2">คน</p>
                        </div>
                        <div className="p-4 gradient-blue rounded-2xl text-white shadow-lg shadow-blue-500/30">
                            <Users size={28} />
                        </div>
                    </div>
                </div>

                {/* Male */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-3xl p-6 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">เพศชาย</p>
                            <h2 className="text-4xl font-bold text-slate-800 dark:text-white">{isLoading ? '...' : male}</h2>
                            <p className="text-xs text-slate-400 mt-2">{total > 0 ? Math.round((male / total) * 100) : 0}%</p>
                        </div>
                        <div className="p-4 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
                            <User size={28} />
                        </div>
                    </div>
                </div>

                {/* Female */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-3xl p-6 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">เพศหญิง</p>
                            <h2 className="text-4xl font-bold text-slate-800 dark:text-white">{isLoading ? '...' : female}</h2>
                            <p className="text-xs text-slate-400 mt-2">{total > 0 ? Math.round((female / total) * 100) : 0}%</p>
                        </div>
                        <div className="p-4 bg-pink-500 rounded-2xl text-white shadow-lg shadow-pink-500/30">
                            <User size={28} />
                        </div>
                    </div>
                </div>

                {/* Sports Types */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-3xl p-6 group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">ประเภทกีฬา</p>
                            <h2 className="text-4xl font-bold text-slate-800 dark:text-white">{isLoading ? '...' : Object.keys(sportCounts).length}</h2>
                            <p className="text-xs text-slate-400 mt-2">ประเภท</p>
                        </div>
                        <div className="p-4 gradient-red rounded-2xl text-white shadow-lg shadow-red-500/30">
                            <Activity size={28} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            {!isLoading && <DashboardCharts applicants={applicants} />}

            <div className="grid grid-cols-1 gap-6">
                {/* Recent Applicants */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-3xl p-6">
                    <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
                        <Users size={20} className="text-blue-500" />
                        ผู้สมัครล่าสุด
                    </h3>
                    <div className="space-y-4">
                        {applicants.slice(0, 5).map(app => (
                            <div key={app.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/30 transition-colors">
                                {app.photoPath ? (
                                    <img src={app.photoPath} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md" />
                                ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-400 font-bold">
                                        {app.name?.[0]}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 dark:text-white truncate">{app.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{app.sportType}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium
                                        ${app.status === 'ผ่านการคัดเลือก' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                            app.status === 'ไม่ผ่าน' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                        {app.status || 'รอสัมภาษณ์'}
                                    </span>
                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(app.createdAt).toLocaleDateString('th-TH')}</p>
                                </div>
                            </div>
                        ))}
                        {applicants.length === 0 && <p className="text-slate-500 text-center py-4">ไม่มีข้อมูล</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}