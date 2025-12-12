import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Search, Printer, FileDown, Eye } from 'lucide-react';
import { format } from 'date-fns';
import CustomerStatementPrint from '@/components/CustomerStatementPrint';

interface Customer {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function CustomerReports() {
  const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await apiClient.getCustomers();

      // Handle both direct array and response.data structure
      const customersData = Array.isArray(response) ? response : (response?.data || []);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedCustomer) {
      alert('الرجاء اختيار عميل');
      return;
    }

    setLoading(true);

    // Small delay to ensure loading animation is visible
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const params = {
        startDate,
        endDate,
      };

      const statementData = await apiClient.getCustomerStatement(selectedCustomer, params);

      // Backend returns: {customer, invoices, vouchers, summary}
      // We need to transform it to transactions format

      const allTransactions: any[] = [];

      // Add invoices as debit transactions
      if (statementData.invoices) {
        statementData.invoices.forEach((inv: any) => {

          // Try multiple possible field names for invoice number
          const invoiceNo = inv.invoiceNo ||
            inv.invoice_no ||
            inv.invoiceNumber ||
            inv.invoice_number ||
            inv.number ||
            inv.code ||
            inv.id ||
            'غير محدد';

          // Try multiple possible field names for amount
          const amount = parseFloat(String(
            inv.totalAmount ||
            inv.total_amount ||
            inv.totalamount ||
            inv.total ||
            inv.amount ||
            inv.grandTotal ||
            inv.grand_total ||
            0
          ));

          console.log('Extracted - Invoice No:', invoiceNo, 'Amount:', amount);

          allTransactions.push({
            date: inv.date,
            type: 'invoice',
            description: `معاملة تخليص جمركي - فاتورة رقم ${invoiceNo}`,
            debit: amount,
            credit: 0,
            id: inv.id,
          });
        });
      }

      // Add vouchers as credit transactions
      if (statementData.vouchers) {
        statementData.vouchers.forEach((v: any) => {
          const voucherCode = v.code || v.voucherCode || 'غير محدد';
          const voucherNote = v.note || v.notes || v.description || 'سداد';

          allTransactions.push({
            date: v.date,
            type: 'voucher',
            description: `${voucherNote} - سند قبض رقم ${voucherCode}`,
            debit: 0,
            credit: parseFloat(String(v.amount || 0)),
            id: v.id,
          });
        });
      }

      // Sort by date
      allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate opening balance (total invoices before period - total payments before period)
      // For now, we'll use 0 as opening balance since backend doesn't provide it
      let runningBalance = 0;
      setOpeningBalance(runningBalance);

      // Create transactions with running balance
      const transactionsList: Transaction[] = allTransactions.map(tx => {
        runningBalance += tx.debit - tx.credit;
        return {
          id: tx.id,
          date: tx.date,
          description: tx.description,
          debit: tx.debit,
          credit: tx.credit,
          balance: runningBalance,
        };
      });

      setTransactions(transactionsList);
    } catch (error: any) {
      console.error('Error generating report:', error);
      console.error('Error details:', error.response?.data);
      alert('حدث خطأ أثناء إنشاء التقرير: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = transactions.reduce((sum, tx) => sum + tx.debit, 0);
  const totalCredit = transactions.reduce((sum, tx) => sum + tx.credit, 0);
  const closingBalance = openingBalance + totalDebit - totalCredit;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        تقارير العملاء
      </h2>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          كشف حساب عميل
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              العميل
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">اختر العميل</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

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
              {loading ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
            </button>
          </div>
        </div>

        {transactions.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowPrint(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-5 h-5" />
              معاينة وطباعة
            </button>
          </div>
        )}
      </div>

      {transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">رصيد أول المدة</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {openingBalance.toFixed(2)} ريال
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">عدد الحركات</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {transactions.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الرصيد الختامي</p>
                <p className={`text-xl font-bold ${closingBalance >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {Math.abs(closingBalance).toFixed(2)} ريال {closingBalance >= 0 ? '(له)' : '(عليه)'}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    التاريخ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    التفاصيل
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    مدين
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    دائن
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    الرصيد
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white" colSpan={2}>
                    رصيد أول المدة
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">-</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">-</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400">
                    {openingBalance.toFixed(2)}
                  </td>
                </tr>

                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(tx.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {tx.description}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
                      {tx.debit > 0 ? tx.debit.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                      {tx.credit > 0 ? tx.credit.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                      {tx.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}

                <tr className="bg-green-50 dark:bg-green-900/20 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white" colSpan={2}>
                    الإجماليات
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {totalDebit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">
                    {totalCredit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400">
                    {closingBalance.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && transactions.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            لا توجد بيانات. اختر العميل والفترة وانقر على "إنشاء التقرير"
          </p>
        </div>
      )}

      {showPrint && transactions.length > 0 && (
        <CustomerStatementPrint
          customerName={customers.find(c => c.id === selectedCustomer)?.name || ''}
          startDate={startDate}
          endDate={endDate}
          openingBalance={openingBalance}
          transactions={transactions}
          closingBalance={closingBalance}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
