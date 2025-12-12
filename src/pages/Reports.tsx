import { useState } from 'react';
import { DollarSign, Users, FileText, Anchor, ChevronRight } from 'lucide-react';
import FinancialReports from './reports/FinancialReports';
import CustomerReports from './reports/CustomerReports';
import CustomsReports from './reports/CustomsReports';
import AgentReports from './reports/AgentReports';

type ReportCategory = 'financial' | 'customers' | 'customs' | 'agents' | null;

export default function Reports() {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>(null);

  const categories = [
    {
      id: 'financial' as ReportCategory,
      title: 'التقارير المالية',
      description: 'الخزنة، البنوك، الإيرادات والمصروفات',
      icon: DollarSign,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'customers' as ReportCategory,
      title: 'تقارير العملاء',
      description: 'كشف حساب العملاء والأرصدة',
      icon: Users,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'customs' as ReportCategory,
      title: 'التقارير الجمركية',
      description: 'فواتير التخليص الجمركي',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 'agents' as ReportCategory,
      title: 'الوكلاء الملاحيين',
      description: 'كشف حساب الوكلاء والرحلات',
      icon: Anchor,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  if (selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            التقارير
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 dark:text-white">
            {categories.find((c) => c.id === selectedCategory)?.title}
          </span>
        </div>

        {selectedCategory === 'financial' && <FinancialReports />}
        {selectedCategory === 'customers' && <CustomerReports />}
        {selectedCategory === 'customs' && <CustomsReports />}
        {selectedCategory === 'agents' && <AgentReports />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          التقارير
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          التقارير المالية والجمركية
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-right hover:shadow-lg transition-all"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${category.color} opacity-10 rounded-bl-full`}></div>

              <div className="relative">
                <div className={`inline-flex p-3 bg-gradient-to-br ${category.color} rounded-xl mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {category.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {category.description}
                </p>

                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:gap-3 transition-all">
                  <span>عرض التقارير</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
