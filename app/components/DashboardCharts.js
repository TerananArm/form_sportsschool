'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f97316'];
const STATUS_LABELS = {
    'รอสัมภาษณ์': 'Pending',
    'ผ่านการคัดเลือก': 'Passed',
    'ไม่ผ่าน': 'Failed',
    'สละสิทธิ์': 'Withdrawn'
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                <p className="font-bold text-slate-800 dark:text-white mb-1">{label || payload[0].name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    จำนวน: <span className="font-bold text-blue-600">{payload[0].value}</span> คน
                </p>
            </div>
        );
    }
    return null;
};

export default function DashboardCharts({ applicants }) {
    // Process Data for Pie Chart (Status)
    const statusData = [
        { name: 'รอสัมภาษณ์', value: applicants.filter(a => !a.status || a.status === 'รอสัมภาษณ์').length },
        { name: 'ผ่านการคัดเลือก', value: applicants.filter(a => a.status === 'ผ่านการคัดเลือก').length },
        { name: 'ไม่ผ่าน', value: applicants.filter(a => a.status === 'ไม่ผ่าน').length },
        { name: 'สละสิทธิ์', value: applicants.filter(a => a.status === 'สละสิทธิ์').length },
    ].filter(item => item.value > 0);

    // Process Data for Bar Chart (Top Sports)
    const sportCounts = applicants.reduce((acc, curr) => {
        acc[curr.sportType] = (acc[curr.sportType] || 0) + 1;
        return acc;
    }, {});

    const sportData = Object.entries(sportCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pie Chart: Status Distribution */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-3xl p-6"
            >
                <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                    สัดส่วนสถานะผู้สมัคร
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => <span className="dark:text-slate-300 ml-2">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Bar Chart: Applicants by Sport */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-3xl p-6"
            >
                <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                    จำนวนผู้สมัครแยกตามกีฬา (Top 5)
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={sportData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                {sportData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#ec4899'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}
