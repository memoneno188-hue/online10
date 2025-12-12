import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { AgentStatementPrint } from '@/components/AgentStatementPrint';
import { numberToArabicWords } from '@/lib/numberToWords';

interface Agent {
  id: string;
  name: string;
  taxNumber?: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  count: string;
  vessel: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function AgentReports() {
  const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [showPrint, setShowPrint] = useState(false);
  const [agentData, setAgentData] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    loadAgents();
    loadCompanySettings();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await apiClient.getAgents();

      // Handle both direct array and response.data structure
      const agentsData = Array.isArray(response) ? response : (response?.data || []);
      setAgents(agentsData);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadCompanySettings = async () => {
    try {
      const response = await apiClient.getCompanySettings();
      const data = response.data || response;
      setCompanySettings(data);
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedAgent) {
      alert('الرجاء اختيار وكيل');
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

      const statementData = await apiClient.getAgentStatement(selectedAgent, params);

      // Backend returns: {agent, trips, fees, vouchers, summary}
      const allTransactions: any[] = [];

      // Add trips as CREDIT transactions (دائن) - agent receives money
      if (statementData.trips) {
        statementData.trips.forEach((trip: any) => {
          // Get vessel name from trip data
          const vesselName = trip.vessel?.name || 'غير محدد';

          allTransactions.push({
            date: trip.date,
            type: 'trip',
            description: `رحلة العبارة ${vesselName}`,
            vessel: vesselName,
            count: `${trip.quantity || 0}`,
            debit: 0,
            credit: parseFloat(String(trip.totalAmount || 0)),
            id: trip.id,
          });
        });
      }

      // Add fees as CREDIT transactions (دائن) - additional fees for agent
      if (statementData.fees) {
        statementData.fees.forEach((fee: any) => {
          // Get vessel name from fee data
          const vesselName = fee.vessel?.name || 'غير محدد';
          const feeType = fee.feeType || 'رسوم إضافية';
          const quantity = fee.quantity || 1;

          allTransactions.push({
            date: fee.date,
            type: 'fee',
            description: `${feeType} رحلة العبارة ${vesselName}`,
            vessel: vesselName,
            count: `${quantity}`,
            debit: 0,
            credit: parseFloat(String(fee.amount || 0)),
            id: fee.id,
          });
        });
      }

      // Add payment vouchers as DEBIT transactions (مدين) - payments to agent
      if (statementData.vouchers && statementData.vouchers.length > 0) {
        statementData.vouchers.forEach((voucher: any) => {
          // Get voucher details from notes field
          const counterparty = voucher.notes || 'غير محدد';

          allTransactions.push({
            date: voucher.date,
            type: 'voucher',
            description: `سند صرف - ${counterparty}`,
            vessel: '-',
            count: '-',
            debit: parseFloat(String(voucher.amount || 0)),
            credit: 0,
            id: voucher.id,
          });
        });
      }

      // Sort by date
      allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate opening balance
      let runningBalance = 0;
      setOpeningBalance(runningBalance);

      // Create transactions with running balance
      const transactionsList: Transaction[] = allTransactions.map(tx => {
        runningBalance += tx.credit - tx.debit;
        return {
          id: tx.id,
          date: tx.date,
          description: tx.description,
          count: tx.count,
          vessel: tx.vessel,
          debit: tx.debit,
          credit: tx.credit,
          balance: runningBalance,
        };
      });

      setTransactions(transactionsList);
      setAgentData(statementData.agent);
    } catch (error: any) {
      console.error('Error generating report:', error);
      alert('حدث خطأ أثناء إنشاء التقرير: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = transactions.reduce((sum, tx) => sum + tx.debit, 0);
  const totalCredit = transactions.reduce((sum, tx) => sum + tx.credit, 0);
  const closingBalance = openingBalance + totalCredit - totalDebit;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        تقارير الوكلاء الملاحيين
      </h2>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          كشف حساب وكيل
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              الوكيل
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">اختر الوكيل</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
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
          <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 p-4">
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
                  {Math.abs(closingBalance).toFixed(2)} ريال {closingBalance >= 0 ? '(دائن)' : '(مدين)'}
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
                    البيان
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    عدد الشاحنات
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    دائن
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    مدين
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    الرصيد
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white" colSpan={3}>
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
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {tx.count}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {tx.credit > 0 ? tx.credit.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {tx.debit > 0 ? tx.debit.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                      {tx.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}

                <tr className="bg-purple-50 dark:bg-purple-900/20 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white" colSpan={3}>
                    الإجماليات
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400">
                    {totalCredit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400">
                    {totalDebit.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-bold ${closingBalance >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
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
            لا توجد بيانات. اختر الوكيل والفترة وانقر على "إنشاء التقرير"
          </p>
        </div>
      )}

      {showPrint && agentData && transactions.length > 0 && (
        <AgentStatementPrint
          data={{
            companyName: companySettings?.nameAr || 'مؤسسة الصقر الشمالي للتخليص الجمركي',
            companyNameEn: companySettings?.nameEn || 'Sahil Al-shamal For Customs Clearance',
            taxNumber: companySettings?.taxNumber || '310430599900003',
            licenseNumber: companySettings?.licenseNo || '4003',
            logoPath: companySettings?.logoPath,
            statementNo: `ST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            agentName: agentData.name || '',
            agentTaxNumber: agentData.taxNumber || '-',
            startDate: format(new Date(startDate), 'dd/MM/yyyy'),
            endDate: format(new Date(endDate), 'dd/MM/yyyy'),
            transactions: transactions.map(tx => ({
              id: tx.id,
              date: format(new Date(tx.date), 'dd/MM/yyyy'),
              count: tx.count,
              vessel: tx.vessel,
              description: tx.description,
              credit: tx.credit,
              debit: tx.debit,
              balance: tx.balance,
            })),
            totalCredit: totalCredit,
            totalDebit: totalDebit,
            finalBalance: closingBalance,
            balanceInWords: numberToArabicWords(closingBalance),
          }}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
