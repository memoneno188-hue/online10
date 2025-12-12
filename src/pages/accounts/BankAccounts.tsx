import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Plus, Edit, Trash2, X, Save, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const bankAccountSchema = z.object({
  bank_name: z.string().min(1, 'اسم البنك مطلوب'),
  account_no: z.string().min(1, 'رقم الحساب مطلوب'),
  opening_balance: z.number().min(0, 'الرصيد الافتتاحي يجب أن يكون أكبر من أو يساوي صفر'),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

interface Bank {
  id: string;
  name: string;
}

interface BankAccount {
  id: string;
  account_no: string;
  accountNo?: string;
  opening_balance: number;
  openingBalance?: number;
  current_balance: number;
  currentBalance?: number;
  is_active: boolean;
  isActive?: boolean;
  bank?: { name: string };
  banks?: { name: string };
}

export default function BankAccounts() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      opening_balance: 0,
    },
  });

  useEffect(() => {
    loadBanks();
    loadAccounts();
  }, []);

  const loadBanks = async () => {
    try {
      const response = await apiClient.getBanks();
      if (response.data) {
        setBanks(response.data);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await apiClient.getBankAccounts();
      if (response.data) {
        setAccounts(response.data);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const onSubmit = async (data: BankAccountFormData) => {
    try {
      setLoading(true);

      // Find or create bank
      let bank = banks.find((b) => b.name === data.bank_name);

      if (!bank) {
        // Create new bank
        const newBank = await apiClient.createBank({ name: data.bank_name });
        bank = newBank;
        await loadBanks(); // Reload banks list
      }

      const accountData = {
        bankId: bank.id,
        accountNo: data.account_no,
        openingBalance: data.opening_balance,
      };

      console.log('Sending account data:', accountData);

      if (editingAccount) {
        // For update, only send accountNo (backend doesn't accept bankId or openingBalance)
        const updateData = {
          accountNo: data.account_no,
        };
        console.log('Updating account with data:', updateData);
        await apiClient.updateBankAccount(editingAccount.id, updateData);
        alert('تم تحديث الحساب البنكي بنجاح');
      } else {
        // For create, send full data
        console.log('Sending account data:', accountData);
        await apiClient.createBankAccount(accountData);
        alert('تم إضافة الحساب البنكي بنجاح');
      }

      setShowModal(false);
      setEditingAccount(null);
      reset();
      loadAccounts();
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message;
      const displayMsg = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg || error.message;
      alert(`حدث خطأ أثناء حفظ الحساب البنكي: ${displayMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    reset({
      bank_name: account.bank?.name || account.banks?.name || '',
      account_no: account.account_no,
      opening_balance: parseFloat(String(account.opening_balance)),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب البنكي؟')) return;

    try {
      await apiClient.deleteBankAccount(id);
      alert('تم حذف الحساب بنجاح');
      loadAccounts();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      const errorMsg = error.response?.data?.message;
      if (errorMsg) {
        alert(errorMsg);
      } else {
        alert('حدث خطأ أثناء حذف الحساب');
      }
    }
  };

  const openNewAccountModal = () => {
    setEditingAccount(null);
    reset({ opening_balance: 0 });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          الحسابات البنكية
        </h2>
        <button
          onClick={openNewAccountModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة حساب بنكي
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {account.bank?.name || account.banks?.name || 'غير محدد'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {account.account_no}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(account)}
                  className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                  title="تعديل"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  الرصيد الافتتاحي
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {parseFloat(String(account.openingBalance || account.opening_balance || 0)).toFixed(2)} ريال
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  الرصيد الحالي
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {parseFloat(String(account.currentBalance || account.current_balance || 0)).toFixed(2)} ريال
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">الحالة</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${(account.isActive ?? account.is_active ?? true)
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}
                >
                  {(account.isActive ?? account.is_active ?? true) ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">لا توجد حسابات بنكية</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAccount ? 'تعديل حساب بنكي' : 'إضافة حساب بنكي جديد'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اسم البنك
                </label>
                <input
                  type="text"
                  {...register('bank_name')}
                  list="banks-list"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <datalist id="banks-list">
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.name} />
                  ))}
                </datalist>
                {errors.bank_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.bank_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  رقم الحساب
                </label>
                <input
                  type="text"
                  {...register('account_no')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.account_no && (
                  <p className="text-red-500 text-sm mt-1">{errors.account_no.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الرصيد الافتتاحي
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('opening_balance', { valueAsNumber: true })}
                  disabled={!!editingAccount}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                />
                {editingAccount && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    لا يمكن تعديل الرصيد الافتتاحي بعد إنشاء الحساب
                  </p>
                )}
                {errors.opening_balance && (
                  <p className="text-red-500 text-sm mt-1">{errors.opening_balance.message}</p>
                )}
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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'جاري الحفظ...' : editingAccount ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
