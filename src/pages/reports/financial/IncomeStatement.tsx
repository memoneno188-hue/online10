import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Search, Printer, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface RevenueItem {
    description: string;
    amount: number;
    percentage: number;
}

interface ExpenseItem {
    category: string;
    amount: number;
    percentage: number;
}

interface PeriodData {
    revenue: RevenueItem[];
    totalRevenue: number;
    expenses: ExpenseItem[];
    totalExpenses: number;
    netIncome: number;
}

interface IncomeStatementData {
    period: { from: Date; to: Date };
    current: PeriodData;
    previous: PeriodData;
    comparison: {
        revenueChange: number;
        expensesChange: number;
        netIncomeChange: number;
    };
}

export default function IncomeStatement() {
    const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [data, setData] = useState<IncomeStatementData | null>(null);
    const [loading, setLoading] = useState(false);

    const generateReport = async () => {
        setLoading(true);
        try {
            const params = { from: startDate, to: endDate };
            const response = await apiClient.getIncomeStatement(params);
            setData(response);
        } catch (error) {
            console.error('Error generating income statement:', error);
            alert('حدث خطأ أثناء إنشاء قائمة الدخل');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const renderChangeIndicator = (change: number) => {
        if (change === 0) return null;
        const isPositive = change > 0;
        return (
            <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(change).toFixed(1)}%
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    قائمة الدخل
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            من تاريخ
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            إلى تاريخ
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                        >
                            <Search className="w-5 h-5" />
                            {loading ? 'جاري الإنشاء...' : 'إنشاء القائمة'}
                        </button>
                    </div>
                </div>

                {data && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Printer className="w-5 h-5" />
                            طباعة
                        </button>
                    </div>
                )}
            </div>

            {/* Income Statement */}
            {data && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-6">
                        <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 text-center">
                            قائمة الدخل
                        </h2>
                        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                            من {format(new Date(data.period.from), 'dd/MM/yyyy')} إلى {format(new Date(data.period.to), 'dd/MM/yyyy')}
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Revenue Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-blue-600">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">الإيرادات</h3>
                            </div>
                            <div className="space-y-2">
                                {data.current.revenue.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-700 dark:text-gray-300">{item.description}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-500">
                                                {item.percentage.toFixed(1)}%
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-2 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg font-bold">
                                <div className="flex items-center gap-4">
                                    <span className="text-blue-900 dark:text-blue-100">إجمالي الإيرادات</span>
                                    {renderChangeIndicator(data.comparison.revenueChange)}
                                </div>
                                <span className="text-blue-900 dark:text-blue-100">
                                    {formatCurrency(data.current.totalRevenue)}
                                </span>
                            </div>
                        </div>

                        {/* Expenses Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-red-600">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">المصروفات</h3>
                            </div>
                            <div className="space-y-2">
                                {data.current.expenses.map((expense, index) => (
                                    <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-700 dark:text-gray-300">{expense.category}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-500">
                                                {expense.percentage.toFixed(1)}%
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(expense.amount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-2 py-3 px-4 bg-red-50 dark:bg-red-900/20 rounded-lg font-bold">
                                <div className="flex items-center gap-4">
                                    <span className="text-red-900 dark:text-red-100">إجمالي المصروفات</span>
                                    {renderChangeIndicator(data.comparison.expensesChange)}
                                </div>
                                <span className="text-red-900 dark:text-red-100">
                                    {formatCurrency(data.current.totalExpenses)}
                                </span>
                            </div>
                        </div>

                        {/* Net Income */}
                        <div className="pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                            <div className="flex justify-between items-center py-4 px-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                                        صافي الدخل
                                    </h3>
                                    {renderChangeIndicator(data.comparison.netIncomeChange)}
                                </div>
                                <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    {formatCurrency(data.current.netIncome)}
                                </span>
                            </div>
                        </div>

                        {/* Previous Period Comparison */}
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                مقارنة مع الفترة السابقة
                            </h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-400">الإيرادات</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(data.previous.totalRevenue)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600 dark:text-gray-400">المصروفات</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(data.previous.totalExpenses)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600 dark:text-gray-400">صافي الدخل</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(data.previous.netIncome)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!loading && !data && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        اختر الفترة وانقر على "إنشاء القائمة" لعرض قائمة الدخل
                    </p>
                </div>
            )}
        </div>
    );
}
