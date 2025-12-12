import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Plus, Eye, Edit, Trash2, CheckCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import PayrollRunForm from './PayrollRunForm';
import PayrollPreviewModal from './PayrollPreviewModal';
import ApprovePayrollModal from './ApprovePayrollModal';

interface PayrollRun {
  id: string;
  month: string;
  status: string;
  totalNet: number;
  approvedAt: string | null;
  approver: { name: string } | null;
  items: Array<{
    id: string;
    employeeId: string;
    employee: { name: string };
    base: number;
    allowances: number;
    deductions: number;
    net: number;
    notes?: string;
  }>;
}

export default function MonthlyPayroll() {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'approved'>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayrollRun, setSelectedPayrollRun] = useState<PayrollRun | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPayrollRun, setPreviewPayrollRun] = useState<PayrollRun | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approvePayrollRun, setApprovePayrollRun] = useState<PayrollRun | null>(null);

  useEffect(() => {
    loadPayrollRuns();
  }, [statusFilter]);

  const loadPayrollRuns = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter.toUpperCase();
      }

      const response = await apiClient.getPayrollRuns(params);
      const runs = response.data || response;
      setPayrollRuns(Array.isArray(runs) ? runs : []);
    } catch (error) {
      console.error('Error loading payroll runs:', error);
      setPayrollRuns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayrollRun = () => {
    setSelectedPayrollRun(null);
    setIsFormOpen(true);
  };

  const handleEditPayrollRun = (payrollRun: PayrollRun) => {
    if (payrollRun.status.toLowerCase() === 'approved') {
      alert('لا يمكن تعديل كشف رواتب معتمد');
      return;
    }
    setSelectedPayrollRun(payrollRun);
    setIsFormOpen(true);
  };

  const handlePreviewPayrollRun = (payrollRun: PayrollRun) => {
    setPreviewPayrollRun(payrollRun);
    setIsPreviewOpen(true);
  };

  const handleApprovePayrollRun = (payrollRun: PayrollRun) => {
    if (payrollRun.status.toLowerCase() === 'approved') {
      alert('كشف الرواتب معتمد مسبقاً');
      return;
    }
    setApprovePayrollRun(payrollRun);
    setIsApproveOpen(true);
  };

  const handleDeletePayrollRun = async (payrollRun: PayrollRun) => {
    if (payrollRun.status.toLowerCase() === 'approved') {
      alert('لا يمكن حذف كشف رواتب معتمد');
      return;
    }

    const monthName = new Date(payrollRun.month).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
    });

    if (window.confirm(`هل أنت متأكد من حذف كشف رواتب "${monthName}"؟`)) {
      try {
        await apiClient.deletePayrollRun(payrollRun.id);
        alert('تم حذف كشف الرواتب بنجاح');
        loadPayrollRuns();
      } catch (error: any) {
        const message = error.response?.data?.message || 'حدث خطأ أثناء حذف كشف الرواتب';
        alert(message);
      }
    }
  };

  const getMonthName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            كشوف الرواتب
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            إنشاء واعتماد كشوف الرواتب الشهرية
          </p>
        </div>
        <button
          onClick={handleAddPayrollRun}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إنشاء كشف رواتب
        </button>
      </div>

      {/* Filter */}
      <div className="w-full md:w-64">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'approved')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">جميع الكشوف</option>
          <option value="draft">مسودة</option>
          <option value="approved">معتمد</option>
        </select>
      </div>

      {/* Payroll Runs Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : payrollRuns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {statusFilter !== 'all' ? 'لا توجد نتائج للتصفية' : 'لا يوجد كشوف رواتب مسجلة'}
          </p>
          {statusFilter === 'all' && (
            <button
              onClick={handleAddPayrollRun}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              إنشاء أول كشف رواتب
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الشهر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    عدد الموظفين
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    إجمالي الصافي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    تاريخ الاعتماد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    المعتمد بواسطة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {payrollRuns.map((payrollRun) => (
                  <tr key={payrollRun.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getMonthName(payrollRun.month)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {payrollRun.items?.length || 0} موظف
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {parseFloat(String(payrollRun.totalNet)).toFixed(2)} ريال
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${payrollRun.status.toLowerCase() === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                      >
                        {payrollRun.status.toLowerCase() === 'approved' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            معتمد
                          </>
                        ) : (
                          <>
                            <Edit className="w-3 h-3" />
                            مسودة
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {payrollRun.approvedAt ? format(new Date(payrollRun.approvedAt), 'dd/MM/yyyy') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {payrollRun.approver?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreviewPayrollRun(payrollRun)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="معاينة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {payrollRun.status.toLowerCase() === 'draft' && (
                          <>
                            <button
                              onClick={() => handleEditPayrollRun(payrollRun)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApprovePayrollRun(payrollRun)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="اعتماد"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePayrollRun(payrollRun)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <PayrollRunForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        payrollRun={selectedPayrollRun}
        onSuccess={loadPayrollRuns}
      />

      <PayrollPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        payrollRun={previewPayrollRun}
      />

      <ApprovePayrollModal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        payrollRun={approvePayrollRun}
        onSuccess={() => {
          loadPayrollRuns();
          setIsPreviewOpen(false); // Close preview to show updated status
        }}
      />
    </div>
  );
}
