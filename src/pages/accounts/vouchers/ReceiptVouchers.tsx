import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Plus, Edit, Trash2, Eye, Printer, X, Save, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import VoucherPrint from '@/components/VoucherPrint';

const receiptSchema = z.object({
  party_type: z.enum(['customer', 'other'], { required_error: 'نوع الطرف مطلوب' }).refine(val => val !== '' as any, 'يجب اختيار نوع الطرف'),
  party_id: z.string().optional(),
  party_name: z.string().optional(),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  method: z.enum(['cash', 'bank'], { required_error: 'طريقة الدفع مطلوبة' }),
  bank_account_id: z.string().optional(),
  reference_number: z.string().optional(),
  note: z.string().optional(),
  date: z.string(),
}).refine((data) => {
  if (data.party_type === 'customer' && !data.party_id) {
    return false;
  }
  if (data.party_type === 'other' && !data.party_name) {
    return false;
  }
  if (data.method === 'bank' && !data.bank_account_id) {
    return false;
  }
  return true;
}, {
  message: 'الرجاء إكمال جميع الحقول المطلوبة'
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

interface Customer {
  id: string;
  name: string;
}

interface BankAccount {
  id: string;
  account_no: string;
  accountNo?: string;
  bank?: { name: string };
  banks?: { name: string };
}

interface Voucher {
  id: string;
  code: string;
  party_type: string;
  partyType?: string;
  party_id?: string;
  partyId?: string;
  party_name: string;
  partyName?: string;
  method: string;
  amount: number;
  date: string;
  note: string;
  bank_account_id?: string;
  bankAccountId?: string;
  reference_number?: string;
  referenceNumber?: string;
  bank_accounts?: { account_no: string; banks: { name: string } };
  bankAccounts?: { accountNo: string; bank: { name: string } };
}

export default function ReceiptVouchers() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [previewVoucher, setPreviewVoucher] = useState<Voucher | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
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
    loadBankAccounts();
  }, []);

  const loadVouchers = async () => {
    try {
      const response = await apiClient.getVouchers({ type: 'RECEIPT' });
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
      if (response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const response = await apiClient.getBankAccounts();
      if (response.data) {
        setBankAccounts(response.data);
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  const generateCode = async () => {
    try {
      // Generate code locally: REC-YY-XXXX format
      const year = new Date().getFullYear().toString().slice(-2);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const code = `REC-${year}-${random}`;
      setVoucherCode(code);
      return code;
    } catch (error) {
      console.error('Error generating code:', error);
    }
    return null;
  };

  const onSubmit = async (data: ReceiptFormData) => {
    if (!user) return;

    try {
      setLoading(true);

      if (editingVoucher) {
        // For update, don't send type (it cannot be changed)
        const updateData = {
          partyType: data.party_type.toUpperCase(),
          partyId: data.party_type === 'customer' ? data.party_id : null,
          partyName: data.party_type === 'customer'
            ? customers.find(c => c.id === data.party_id)?.name
            : data.party_name,
          method: data.method === 'cash' ? 'CASH' : 'BANK_TRANSFER',
          bankAccountId: data.method === 'bank' ? data.bank_account_id : null,
          referenceNumber: data.method === 'bank' ? data.reference_number : null,
          amount: data.amount,
          note: data.note || null,
          date: new Date(data.date).toISOString(),
        };

        console.log('Updating voucher with data:', updateData);
        await apiClient.updateVoucher(editingVoucher.id, updateData);
        alert('تم تحديث سند القبض بنجاح');
      } else {
        // For create, include type
        const voucherData = {
          type: 'RECEIPT',
          partyType: data.party_type.toUpperCase(),
          partyId: data.party_type === 'customer' ? data.party_id : null,
          partyName: data.party_type === 'customer'
            ? customers.find(c => c.id === data.party_id)?.name
            : data.party_name,
          method: data.method === 'cash' ? 'CASH' : 'BANK_TRANSFER',
          bankAccountId: data.method === 'bank' ? data.bank_account_id : null,
          referenceNumber: data.method === 'bank' ? data.reference_number : null,
          amount: data.amount,
          note: data.note || null,
          date: new Date(data.date).toISOString(),
        };

        console.log('Creating voucher with data:', voucherData);
        await apiClient.createVoucher(voucherData);
        alert('تم إنشاء سند القبض بنجاح');
      }

      setShowModal(false);
      setEditingVoucher(null);
      reset();
      loadVouchers();
    } catch (error: any) {
      console.error('Error saving voucher:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message;
      const displayMsg = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg || error.message;
      alert(`حدث خطأ أثناء حفظ سند القبض: ${displayMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);

    const partyType = (voucher.partyType || voucher.party_type || 'customer').toLowerCase() as 'customer' | 'other';
    const method = voucher.method?.toLowerCase() === 'cash' || voucher.method?.toLowerCase() === 'نقدي' ? 'cash' : 'bank';

    reset({
      party_type: partyType,
      party_id: partyType === 'customer' ? (voucher.partyId || voucher.party_id) : undefined,
      party_name: partyType === 'other' ? (voucher.partyName || voucher.party_name) : undefined,
      method: method as 'cash' | 'bank',
      bank_account_id: (voucher.bankAccountId || voucher.bank_account_id) || undefined,
      reference_number: (voucher.referenceNumber || voucher.reference_number) || undefined,
      amount: parseFloat(String(voucher.amount)),
      note: voucher.note || '',
      date: format(new Date(voucher.date), 'yyyy-MM-dd'),
    });
    setShowModal(true);
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

  const openNewVoucherModal = async () => {
    setEditingVoucher(null);
    reset({
      date: format(new Date(), 'yyyy-MM-dd'),
      method: 'cash',
      party_type: '' as any,
    });
    await generateCode();
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          سندات القبض
        </h3>
        <button
          onClick={openNewVoucherModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          سند قبض جديد
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
                الطرف
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  لا توجد سندات قبض
                </td>
              </tr>
            ) : (
              vouchers.map((voucher) => (
                <tr key={voucher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                    {voucher.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(voucher.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {voucher.party_name}
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
                  <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400">
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
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
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
                  {editingVoucher ? 'تعديل سند قبض' : 'سند قبض جديد'}
                </h2>
                {voucherCode && !editingVoucher && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
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
              {/* Row 1: Party Type + Customer/Other */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع الطرف <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('party_type')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">اختر نوع الطرف</option>
                    <option value="customer">عميل</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                {partyType === 'customer' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      العميل <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('party_id')}
                      disabled={!partyType}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">اختر العميل</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : partyType === 'other' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      اسم الطرف <span className="text-red-500">*</span>
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
                      الطرف <span className="text-red-500">*</span>
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      اختر نوع الطرف أولاً
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Date + Amount */}
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
                    المبلغ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Row 3: Payment Method + Bank Account */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    طريقة الدفع <span className="text-red-500">*</span>
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
                  <>
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
                            {account.bank?.name || account.banks?.name || 'بنك غير محدد'} - {account.accountNo || account.account_no}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        رقم المرجع (اختياري)
                      </label>
                      <input
                        type="text"
                        {...register('reference_number')}
                        placeholder="أدخل رقم المرجع"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Row 4: Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الملاحظات / البيان
                </label>
                <textarea
                  {...register('note')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {errors.root && (
                <p className="text-red-500 text-sm">{errors.root.message}</p>
              )}

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
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            type: 'receipt'
          }}
          onClose={() => setPreviewVoucher(null)}
        />
      )}
    </div>
  );
}
