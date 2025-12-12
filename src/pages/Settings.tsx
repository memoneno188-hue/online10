import { useState } from 'react';
import { Tag, Building2, Printer, Users, FileText, FileSpreadsheet } from 'lucide-react';
import ExpenseCategories from './settings/ExpenseCategories';
import InvoiceItemTemplates from './settings/InvoiceItemTemplates';
import IncomeStatementSettings from './settings/IncomeStatementSettings';
import UserManagement from './settings/UserManagement';
import CompanySettings from './settings/CompanySettings';

type SettingsSection = 'expense-categories' | 'invoice-templates' | 'income-statement-config' | 'company' | 'print' | 'users' | null;

export default function Settings() {
  const [selectedSection, setSelectedSection] = useState<SettingsSection>(null);

  const sections = [
    {
      id: 'expense-categories' as SettingsSection,
      title: 'تصنيفات المصروفات',
      description: 'إدارة تصنيفات المصروفات',
      icon: Tag,
      color: 'bg-purple-500',
    },
    {
      id: 'invoice-templates' as SettingsSection,
      title: 'بنود الفواتير المحفوظة',
      description: 'إدارة البنود المحفوظة للاستخدام السريع',
      icon: FileText,
      color: 'bg-teal-500',
    },
    {
      id: 'income-statement-config' as SettingsSection,
      title: 'إعدادات قائمة الدخل',
      description: 'تحديد الإيرادات والمصروفات',
      icon: FileSpreadsheet,
      color: 'bg-emerald-500',
    },
    {
      id: 'company' as SettingsSection,
      title: 'بيانات الشركة',
      description: 'معلومات الشركة والإعدادات',
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      id: 'print' as SettingsSection,
      title: 'إعدادات الطباعة',
      description: 'تخصيص قوالب الطباعة',
      icon: Printer,
      color: 'bg-green-500',
    },
    {
      id: 'users' as SettingsSection,
      title: 'المستخدمين',
      description: 'إدارة المستخدمين والصلاحيات',
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  if (selectedSection) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedSection(null)}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          ← العودة إلى الإعدادات
        </button>

        {selectedSection === 'expense-categories' && <ExpenseCategories />}
        {selectedSection === 'invoice-templates' && <InvoiceItemTemplates />}
        {selectedSection === 'income-statement-config' && <IncomeStatementSettings />}
        {selectedSection === 'users' && <UserManagement />}
        {selectedSection === 'company' && <CompanySettings />}
        {selectedSection === 'print' && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-12">
            <p className="text-center text-gray-500 dark:text-gray-400">
              إعدادات الطباعة قيد الإنشاء...
            </p>
          </div>
        )}
        {selectedSection === 'users' && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-12">
            <p className="text-center text-gray-500 dark:text-gray-400">
              إدارة المستخدمين قيد الإنشاء...
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          الإعدادات
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إعدادات النظام والمستخدمين
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-right hover:shadow-lg transition-all"
            >
              <div className={`inline-flex p-3 ${section.color} rounded-lg mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {section.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {section.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
