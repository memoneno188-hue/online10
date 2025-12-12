import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Settings, Wallet, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface TreasuryData {
  id: string;
  opening_balance: number;
  openingBalance?: number;
  current_balance: number;
  currentBalance?: number;
  opening_set_at: string | null;
  opening_set_by: string | null;
  prevent_negative: boolean;
  preventNegativeTreasury?: boolean;
}

interface Transaction {
  id: string;
  date: string;
  type: 'in' | 'out';
  amount: number;
  note: string;
  balance_after: number;
  balanceAfter?: number;
  voucher_id: string | null;
  voucher?: {
    code: string;
  };
  vouchers?: {
    code: string;
  };
}

export default function Treasury() {
  const { user } = useAuth();
  const [treasury, setTreasury] = useState<TreasuryData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [preventNegative, setPreventNegative] = useState(true);

  useEffect(() => {
    loadTreasury();
    loadTransactions();
  }, []);

  const loadTreasury = async () => {
    try {
      const data = await apiClient.getTreasuryBalance();
      if (data) {
        setTreasury(data);
        setPreventNegative(data.preventNegativeTreasury || data.prevent_negative || false);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading treasury:', error);
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await apiClient.getTreasuryTransactions({ limit: 100 });
      if (response.data) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleSetOpening = async () => {
    if (!user) return;

    try {
      await apiClient.setTreasuryOpeningBalance({
        openingBalance,
      });

      alert('تم تعيين رصيد الخزنة الافتتاحي بنجاح');
      setShowOpeningModal(false);
      loadTreasury();
    } catch (error) {
      console.error('Error setting opening balance:', error);
      alert('حدث خطأ أثناء تعيين رصيد الخزنة');
    }
  };

  const handleUpdateSettings = async () => {
    if (!treasury) return;

    try {
      await apiClient.updateTreasurySettings({
        preventNegativeTreasury: preventNegative,
      });

      alert('تم تحديث إعدادات الخزنة بنجاح');
      setShowSettingsModal(false);
      loadTreasury();
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('حدث خطأ أثناء تحديث الإعدادات');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">الرصيد الحالي</h3>
            <Wallet className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">
            {treasury ? parseFloat(String(treasury.currentBalance || treasury.current_balance || 0)).toFixed(2) : '0.00'} ريال
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">الرصيد الافتتاحي</h3>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">
            {treasury ? (treasury.openingBalance !== null && treasury.openingBalance !== undefined ? parseFloat(String(treasury.openingBalance)).toFixed(2) : treasury.opening_balance !== null && treasury.opening_balance !== undefined ? parseFloat(String(treasury.opening_balance)).toFixed(2) : '0.00') : '0.00'} ريال
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">إعدادات الخزنة</h3>
            <Settings className="w-5 h-5 opacity-80" />
          </div>
          <div className="flex items-center gap-2">
            {(treasury?.preventNegativeTreasury || treasury?.prevent_negative) ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <p className="text-sm opacity-90">
              {(treasury?.preventNegativeTreasury || treasury?.prevent_negative) ? 'منع الرصيد السالب مفعّل' : 'منع الرصيد السالب معطّل'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {(!treasury || !treasury.opening_set_at) && (
          <button
            onClick={() => setShowOpeningModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            فتح رصيد أول المدة
          </button>
        )}
        {treasury && (
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            إعدادات الخزنة
          </button>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          عمليات الخزنة
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  التاريخ
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  البيان
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  النوع
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  المبلغ
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  الرصيد بعد العملية
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  رقم السند
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    لا توجد عمليات على الخزنة
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {transaction.note}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${transaction.type?.toUpperCase() === 'IN'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                      >
                        {transaction.type?.toUpperCase() === 'IN' ? (
                          <>
                            <TrendingUp className="w-3 h-3" />
                            دخل
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3" />
                            خرج
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {parseFloat(String(transaction.amount)).toFixed(2)} ريال
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {parseFloat(String(transaction.balanceAfter || transaction.balance_after || 0)).toFixed(2)} ريال
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {transaction.voucher?.code || transaction.vouchers?.code || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showOpeningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                فتح رصيد أول المدة
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                تنبيه: يمكن تعيين رصيد أول المدة مرة واحدة فقط
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الرصيد الافتتاحي
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowOpeningModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSetOpening}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                إعدادات الخزنة
              </h2>
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preventNegative}
                    onChange={(e) => setPreventNegative(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    منع الرصيد السالب
                  </span>
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleUpdateSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
