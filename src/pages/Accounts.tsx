import { useState } from 'react';
import { Wallet, Building2, FileText, Banknote } from 'lucide-react';
import Treasury from './accounts/Treasury';
import BankAccounts from './accounts/BankAccounts';
import Vouchers from './accounts/Vouchers';
import Payroll from './accounts/Payroll';

type Tab = 'treasury' | 'banks' | 'vouchers' | 'payroll';

export default function Accounts() {
  const [activeTab, setActiveTab] = useState<Tab>('treasury');

  const tabs = [
    { id: 'treasury' as Tab, label: 'الخزنة', icon: Wallet },
    { id: 'banks' as Tab, label: 'الحسابات البنكية', icon: Building2 },
    { id: 'vouchers' as Tab, label: 'السندات', icon: FileText },
    { id: 'payroll' as Tab, label: 'الرواتب', icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          إدارة الحسابات
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة الخزنة والحسابات البنكية والسندات وكشوف الرواتب
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'treasury' && <Treasury />}
          {activeTab === 'banks' && <BankAccounts />}
          {activeTab === 'vouchers' && <Vouchers />}
          {activeTab === 'payroll' && <Payroll />}
        </div>
      </div>
    </div>
  );
}
