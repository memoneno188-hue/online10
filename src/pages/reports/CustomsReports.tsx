import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Search, Printer, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface CustomsInvoice {
  id: string;
  date: Date;
  customerName: string;
  declarationNo: string;
  type: 'IMPORT' | 'EXPORT' | 'TRANSIT' | 'FREE';
  total: number;
}

interface CustomsReportData {
  period: { from: Date | null; to: Date | null };
  filters: { types: string[] };
  invoices: CustomsInvoice[];
  summary: {
    totalCount: number;
    totalAmount: number;
  };
}

const TYPE_LABELS = {
  IMPORT: 'وارد',
  EXPORT: 'صادر',
  TRANSIT: 'ترانزيت',
  FREE: 'حر',
};

const TYPE_COLORS = {
  IMPORT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  EXPORT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  TRANSIT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  FREE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

export default function CustomsReports() {
  const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['IMPORT', 'EXPORT', 'TRANSIT', 'FREE']);
  const [data, setData] = useState<CustomsReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = {
        from: startDate,
        to: endDate,
        types: selectedTypes.join(','),
      };
      const response = await apiClient.getCustomsReport(params);
      setData(response);
    } catch (error) {
      console.error('Error generating customs report:', error);
      alert('حدث خطأ أثناء إنشاء التقرير الجمركي');
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

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            التقارير الجمركية
          </h3>
        </div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
        </div>

        {/* Type Filters */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            نوع الفاتورة
          </label>
          <div className="flex flex-wrap gap-4">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeToggle(type)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={generateReport}
            disabled={loading || selectedTypes.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-5 h-5" />
            {loading ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
          </button>
          {data && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              طباعة
            </button>
          )}
        </div>

        {selectedTypes.length === 0 && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            يجب اختيار نوع واحد على الأقل
          </p>
        )}
      </div>

      {/* Report Table */}
      {data && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-6">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 text-center">
              التقرير الجمركي
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
              من {format(new Date(startDate), 'dd/MM/yyyy')} إلى {format(new Date(endDate), 'dd/MM/yyyy')}
            </p>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
              الأنواع: {selectedTypes.map(t => TYPE_LABELS[t as keyof typeof TYPE_LABELS]).join(' - ')}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 dark:bg-gray-700/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي عدد البيانات</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data.summary.totalCount}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي مبالغ الفواتير</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(data.summary.totalAmount)}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    التاريخ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    العميل
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    رقم البيان
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    النوع
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    مبلغ الفاتورة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      لا توجد فواتير في هذه الفترة
                    </td>
                  </tr>
                ) : (
                  data.invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {format(new Date(invoice.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {invoice.customerName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {invoice.declarationNo}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[invoice.type]}`}>
                          {TYPE_LABELS[invoice.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(invoice.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !data && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            اختر الفترة والأنواع وانقر على "إنشاء التقرير" لعرض التقرير الجمركي
          </p>
        </div>
      )}
    </div>
  );
}
