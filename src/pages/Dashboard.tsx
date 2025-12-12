import { Users, FileText, DollarSign, TrendingUp } from 'lucide-react';

const stats = [
  {
    title: 'إجمالي العملاء',
    value: '0',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    title: 'فواتير هذا الشهر',
    value: '0',
    icon: FileText,
    color: 'bg-green-500',
  },
  {
    title: 'أرصدة مستحقة',
    value: '0.00 ر.س',
    icon: DollarSign,
    color: 'bg-yellow-500',
  },
  {
    title: 'آخر التحصيلات',
    value: '0.00 ر.س',
    icon: TrendingUp,
    color: 'bg-purple-500',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          لوحة التحكم
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          نظرة عامة على النظام والإحصائيات
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          مرحباً بك في نظام إدارة العمليات الجمركية
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          يمكنك الآن البدء في إدارة العملاء والفواتير والحسابات من خلال القوائم الجانبية.
        </p>
      </div>
    </div>
  );
}
