import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Plus, Edit, Trash2, Eye, Printer, X, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import VoucherPrint from '@/components/VoucherPrint';

const paymentSchema = z.object({
  party_type: z.enum(['customer', 'employee', 'agent', 'other'], { required_error: 'نوع الجهة مطلوب' }).refine(val => val !== '' as any, 'يجب اختيار نوع الجهة'),
  party_id: z.string().optional(),
  party_name: z.string().optional(),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  method: z.enum(['cash', 'bank'], { required_error: 'طريقة الدفع مطلوبة' }),
  bank_account_id: z.string().optional(),
  reference_number: z.string().optional(),
  expense_category_id: z.string().min(1, 'تصنيف المصروف مطلوب'),
  note: z.string().optional(),
  date: z.string(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface Customer {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
}

interface BankAccount {
  id: string;
  account_no: string;
  banks: { name: string };
}

interface ExpenseCategory {
  id: string;
  name: string;
}

interface Voucher {
  id: string;
  code: string;
  party_type: string;
  party_name: string;
  method: string;
  amount: number;
  date: string;
  note: string;
  expense_categories: { name: string };
  bank_accounts?: { account_no: string; banks: { name: string } };
}

export default function PaymentVouchers() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewVoucher, setPreviewVoucher] = useState<Voucher | null>(null);
  const [voucherCode, setVoucherCode] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      method: 'cash',
      party_type: '' as any,
    },
  });

  const partyType = watch('party_type');
  const method = watch('method');

  useEffect(() => {
    loadVouchers();
    loadCustomers();
    loadEmployees();
    loadAgents();
    loadBankAccounts();
    loadExpenseCategories();
  }, []);

  const loadVouchers = async () => {
    try {
      const response = await apiClient.getVouchers({ type: 'PAYMENT' });
      if (response.data) {
        setVouchers(response.data);
      }
    } catch (error) {
      console.error('Error loading vouchers:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await apiClient.getCustomers();
      setCustomers(response.data || response || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await apiClient.getEmployees();
      setEmployees(response.data || response || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await apiClient.getAgents();
      setAgents(response.data || response || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const response = await apiClient.getBankAccounts();
      setBankAccounts(response.data || response || []);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  const loadExpenseCategories = async () => {
    try {
      const response = await apiClient.getExpenseCategories();
      setExpenseCategories(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading expense categories:', error);
    }
  };

  const generateCode = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const code = `PAY-${year}${month}${day}-${random}`;
    setVoucherCode(code);
    return code;
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!user) return;

    try {
      setLoading(true);

      let partyName = data.party_name;
      if (data.party_type === 'customer') {
        partyName = customers.find(c => c.id === data.party_id)?.name;
      } else if (data.party_type === 'employee') {
        partyName = employees.find(e => e.id === data.party_id)?.name;
      } else if (data.party_type === 'agent') {
        partyName = agents.find(a => a.id === data.party_id)?.name;
      }

      if (editingVoucher) {
        // For update, don't send type (it cannot be changed)
        const updateData = {
          partyType: data.party_type.toUpperCase(),
          partyId: data.party_type !== 'other' ? data.party_id : null,
          partyName,
          method: data.method === 'cash' ? 'CASH' : 'BANK_TRANSFER',
          bankAccountId: data.method === 'bank' ? data.bank_account_id : null,
          referenceNumber: data.method === 'bank' ? data.reference_number : null,
          amount: data.amount,
          categoryId: data.expense_category_id,
          note: data.note || null,
          date: new Date(data.date).toISOString(),
        };

        await apiClient.updateVoucher(editingVoucher.id, updateData);
        alert('\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0633\u0646\u062f \u0627\u0644\u0635\u0631\u0641 \u0628\u0646\u062c\u0627\u062d');
      } else {
        // For create, include type
        const voucherData = {
          type: 'PAYMENT',
          partyType: data.party_type.toUpperCase(),
          partyId: data.party_type !== 'other' ? data.party_id : null,
          partyName,
          method: data.method === 'cash' ? 'CASH' : 'BANK_TRANSFER',
          bankAccountId: data.method === 'bank' ? data.bank_account_id : null,
          referenceNumber: data.method === 'bank' ? data.reference_number : null,
          amount: data.amount,
          categoryId: data.expense_category_id,
          note: data.note || null,
          date: new Date(data.date).toISOString(),
        };

        await apiClient.createVoucher(voucherData);
        alert('\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0633\u0646\u062f \u0627\u0644\u0635\u0631\u0641 \u0628\u0646\u062c\u0627\u062d');
      }

      setShowModal(false);
      setEditingVoucher(null);
      reset();
      loadVouchers();
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u062d\u0641\u0638 \u0633\u0646\u062f \u0627\u0644\u0635\u0631\u0641');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السند؟')) return;

    try {
      await apiClient.deleteVoucher(id);
      alert('تم حذف السند بنجاح');
      loadVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      alert('حدث خطأ أثناء حذف السند');
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    reset({
      date: format(new Date(voucher.date), 'yyyy-MM-dd'),
      party_type: voucher.party_type?.toLowerCase() || voucher.partyType?.toLowerCase() || 'customer',
      party_id: voucher.party_id || voucher.partyId || undefined,
      party_name: voucher.party_name || voucher.partyName || undefined,
      amount: parseFloat(String(voucher.amount)),
      method: voucher.method?.toLowerCase() === 'cash' ? 'cash' : 'bank',
      bank_account_id: voucher.bank_account_id || voucher.bankAccountId || undefined,
      reference_number: voucher.referenceNumber || voucher.reference_number || undefined,
      expense_category_id: voucher.expense_categories?.id || voucher.expenseCategory?.id || voucher.categoryId || '',
      note: voucher.note || undefined,
    });
    setShowModal(true);
  };

  const openNewVoucherModal = () => {
    setEditingVoucher(null);
    reset({
      date: format(new Date(), 'yyyy-MM-dd'),
      method: 'cash',
      party_type: '' as any,
    });
    generateCode();
    setShowModal(true);
  };

  const getPartyOptions = () => {
    switch (partyType) {
      case 'customer':
        return customers.map(c => ({ id: c.id, name: c.name }));
      case 'employee':
        return employees.map(e => ({ id: e.id, name: e.name }));
      case 'agent':
        return agents.map(a => ({ id: a.id, name: a.name }));
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          سندات الصرف
        </h3>
        <button
          onClick={openNewVoucherModal}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          سند صرف جديد
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                رقم السند
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                التاريخ
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                الجهة
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                التصنيف
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                الطريقة
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                المبلغ
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  لا توجد سندات صرف
                </td>
              </tr>
            ) : (
              vouchers.map((voucher) => (
                <tr key={voucher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
                    {voucher.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(voucher.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {voucher.party_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {voucher.expense_categories?.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${voucher.method?.toUpperCase() === 'CASH'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}
                    >
                      {voucher.method?.toUpperCase() === 'CASH' ? 'نقدي' : 'تحويل بنكي'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400">
                    {parseFloat(String(voucher.amount)).toFixed(2)} ريال
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewVoucher(voucher)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="معاينة وطباعة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(voucher)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(voucher.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingVoucher ? 'تعديل سند صرف' : 'سند صرف جديد'}
                </h2>
                {voucherCode && !editingVoucher && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    رقم السند: {voucherCode}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Row 1: Date + Party Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع المستفيد <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('party_type')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">اختر نوع المستفيد</option>
                    <option value="customer">عميل</option>
                    <option value="employee">موظف</option>
                    <option value="agent">وكيل ملاحي</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Party Selection */}
              {partyType && partyType !== 'other' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {partyType === 'customer' ? 'العميل' : partyType === 'employee' ? 'الموظف' : 'الوكيل'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('party_id')}
                    disabled={!partyType}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">اختر</option>
                    {getPartyOptions().map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : partyType === 'other' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اسم المستفيد <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('party_name')}
                    disabled={!partyType}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المستفيد <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    اختر نوع المستفيد أولاً
                  </div>
                </div>
              )}

              {/* Row 3: Amount + Expense Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المبلغ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تصنيف المصروف <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('expense_category_id')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">اختر التصنيف</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.expense_category_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.expense_category_id.message}</p>
                  )}
                </div>
              </div>

              {/* Row 4: Payment Method + Bank Account */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    طريقة الصرف <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('method')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="cash">نقدي</option>
                    <option value="bank">تحويل بنكي</option>
                  </select>
                </div>

                {method === 'bank' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      الحساب البنكي <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('bank_account_id')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">اختر الحساب</option>
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {(account.bank?.name || account.banks?.name || 'بنك')} - {account.accountNo || account.account_no}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {method === 'bank' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      رقم المرجع
                    </label>
                    <input
                      type="text"
                      {...register('reference_number')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="ادخل رقم المرجع"
                    />
                  </div>
                )}
              </div>

              {/* Row 5: Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وذلك مقابل
                </label>
                <textarea
                  {...register('note')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="اكتب تفاصيل الصرف..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'جاري الحفظ...' : editingVoucher ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewVoucher && (
        <VoucherPrint
          voucher={{
            ...previewVoucher,
            type: 'payment'
          }}
          onClose={() => setPreviewVoucher(null)}
        />
      )}
    </div>
  );
}
