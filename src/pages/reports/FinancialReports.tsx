import { useState } from 'react';
import { Wallet, Building2, TrendingUp, FileText, BookOpen, Scale } from 'lucide-react';
import TreasuryReport from './financial/TreasuryReport';
import BankReport from './financial/BankReport';
import IncomeStatement from './financial/IncomeStatement';
import GeneralJournal from './financial/GeneralJournal';
import TrialBalance from './financial/TrialBalance';

type FinancialReportType = 'treasury' | 'banks' | 'income-expenses' | 'income-statement' | 'general-journal' | 'trial-balance' | null;

export default function FinancialReports() {
  const [selectedReport, setSelectedReport] = useState<FinancialReportType>(null);

  const reports = [
    {
      id: 'treasury' as FinancialReportType,
      title: 'الخزنة والنقدية',
      description: 'كشف حركة الخزنة',
      icon: Wallet,
      color: 'bg-blue-500',
    },
    {
      id: 'banks' as FinancialReportType,
      title: 'الحسابات البنكية',
      description: 'كشف حركة البنوك',
      icon: Building2,
      color: 'bg-green-500',
    },
    {
      id: 'income-expenses' as FinancialReportType,
      title: 'الإيرادات والمصروفات',
      description: 'تقرير مقارن',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
    {
      id: 'income-statement' as FinancialReportType,
      title: 'قائمة الدخل',
      description: 'قائمة الدخل التفصيلية',
      icon: FileText,
      color: 'bg-purple-500',
    },
    {
      id: 'general-journal' as FinancialReportType,
      title: 'اليومية العامة',
      description: 'سجل القيود المحاسبية',
      icon: BookOpen,
      color: 'bg-indigo-500',
    },
    {
      id: 'trial-balance' as FinancialReportType,
      title: 'ميزان المراجعة',
      description: 'أرصدة الحسابات',
      icon: Scale,
      color: 'bg-pink-500',
    },
  ];

  if (selectedReport) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedReport(null)}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          ← العودة إلى التقارير المالية
        </button>

        {selectedReport === 'treasury' && <TreasuryReport />}
        {selectedReport === 'banks' && <BankReport />}
        {selectedReport === 'income-expenses' && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-12">
            <p className="text-center text-gray-500 dark:text-gray-400">
              تقرير الإيرادات والمصروفات قيد الإنشاء...
            </p>
          </div>
        )}
        {selectedReport === 'income-statement' && <IncomeStatement />}
        {selectedReport === 'general-journal' && <GeneralJournal />}
        {selectedReport === 'trial-balance' && <TrialBalance />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        التقارير المالية
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-right hover:shadow-lg transition-all"
            >
              <div className={`inline-flex p-3 ${report.color} rounded-lg mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {report.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {report.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
