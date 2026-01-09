import React, { useMemo } from 'react';
import { Transaction, CashShift, StoreSettings } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, CreditCard, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  shifts: CashShift[];
  onAnalyze: (transactions: Transaction[]) => Promise<string>;
  settings: StoreSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, shifts, onAnalyze, settings }) => {
  const [analysis, setAnalysis] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);

  // Stats Calculation
  const stats = useMemo(() => {
    const totalSales = transactions.reduce((acc, t) => acc + t.total, 0);
    const totalProfit = transactions.reduce((acc, t) => acc + (t.profit || 0), 0);
    const totalOrders = transactions.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Group by Day
    const salesByDayMap = new Map<string, number>();
    transactions.forEach(t => {
        const date = new Date(t.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        salesByDayMap.set(date, (salesByDayMap.get(date) || 0) + t.total);
    });
    
    // Convert to array and take last 7 days roughly
    const salesByDay = Array.from(salesByDayMap.entries()).map(([name, value]) => ({ name, value })).reverse().slice(0, 7).reverse();

    return { totalSales, totalProfit, totalOrders, avgTicket, salesByDay };
  }, [transactions]);

  const handleGeminiAnalysis = async () => {
    setAnalyzing(true);
    const result = await onAnalyze(transactions.slice(0, 50)); // Send last 50 for analysis
    setAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="h-full flex flex-col p-8 bg-[#f8fafc] overflow-y-auto animate-fade-in custom-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">Reporte de Ventas</h2>
           <p className="text-slate-500 font-medium">Análisis en tiempo real de tu negocio</p>
        </div>
        <button 
            onClick={handleGeminiAnalysis} 
            disabled={analyzing}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-70"
        >
          {analyzing ? <span className="animate-spin text-xl">✨</span> : <TrendingUp className="w-5 h-5" />}
          {analyzing ? 'Generando Insights...' : 'Analizar con IA'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-3 mb-2 text-slate-500 text-sm font-bold uppercase tracking-wider">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><DollarSign className="w-4 h-4"/></div>
                Ventas Totales
            </div>
            <div className="text-3xl font-black text-slate-800 mt-auto">{settings.currency}{stats.totalSales.toFixed(2)}</div>
         </div>
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-3 mb-2 text-slate-500 text-sm font-bold uppercase tracking-wider">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp className="w-4 h-4"/></div>
                Ganancia Est.
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-auto">{settings.currency}{stats.totalProfit.toFixed(2)}</div>
         </div>
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-3 mb-2 text-slate-500 text-sm font-bold uppercase tracking-wider">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><ShoppingBag className="w-4 h-4"/></div>
                Pedidos
            </div>
            <div className="text-3xl font-black text-slate-800 mt-auto">{stats.totalOrders}</div>
         </div>
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-3 mb-2 text-slate-500 text-sm font-bold uppercase tracking-wider">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><CreditCard className="w-4 h-4"/></div>
                Ticket Prom.
            </div>
            <div className="text-3xl font-black text-slate-800 mt-auto">{settings.currency}{stats.avgTicket.toFixed(2)}</div>
         </div>
      </div>

      {/* AI Analysis Result */}
      {analysis && (
        <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-3xl mb-8 animate-fade-in-up">
            <h3 className="text-indigo-900 font-bold mb-4 flex items-center gap-2 text-lg">
            ✨ Análisis Inteligente de Negocio
            </h3>
            <div className="prose prose-indigo max-w-none text-indigo-800/80 whitespace-pre-line leading-relaxed font-medium">
            {analysis}
            </div>
        </div>
      )}

      {/* Charts & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 h-96">
         <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="font-bold text-slate-800 mb-6">Tendencia de Ventas (Últimos 7 días)</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.salesByDay}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `${settings.currency}${value}`}/>
                        <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                            formatter={(value: number) => [`${settings.currency}${value.toFixed(2)}`, 'Ventas']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <h3 className="font-bold text-slate-800 mb-4">Últimas Transacciones</h3>
            <div className="overflow-y-auto flex-1 custom-scrollbar -mr-2 pr-2">
                <div className="space-y-3">
                    {transactions.slice(0, 6).map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                            <div>
                                <div className="font-bold text-slate-800 text-sm">#{t.id.slice(-4)}</div>
                                <div className="text-xs text-slate-400 font-medium">{new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-indigo-600 text-sm">{settings.currency}{t.total.toFixed(2)}</div>
                                <div className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded inline-block">{t.paymentMethod}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};