import { useNavigate } from 'react-router-dom';
import { FileText, Package, Ship, FileEdit } from 'lucide-react';

const invoiceTypes = [
  {
    title: 'إنشاء فاتورة صادر',
    icon: FileText,
    color: 'bg-blue-500',
    path: '/invoices/export',
  },
  {
    title: 'إنشاء فاتورة استيراد',
    icon: Package,
    color: 'bg-green-500',
    path: '/invoices/import',
  },
  {
    title: 'إنشاء فاتورة ترانزيت',
    icon: Ship,
    color: 'bg-purple-500',
    path: '/invoices/transit',
  },
  {
    title: 'إنشاء فاتورة حر',
    icon: FileEdit,
    color: 'bg-orange-500',
    path: '/invoices/free',
  },
];

export default function Invoices() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          الفواتير
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          اختر نوع الفاتورة لإنشائها
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {invoiceTypes.map((type, index) => (
          <button
            key={index}
            onClick={() => navigate(type.path)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg transition-all hover:-translate-y-1 group"
          >
            <div
              className={`${type.color} w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
            >
              <type.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              {type.title}
            </h3>
          </button>
        ))}
      </div>
    </div>
  );
}
