import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { X, CheckCircle } from 'lucide-react';

interface PayrollRun {
    id: string;
    month: string;
    totalNet: number;
}

interface BankAccount {
    id: string;
    accountNumber: string;
    accountName: string;
    bank: {
        name: string;
    };
}

interface ApprovePayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    payrollRun: PayrollRun | null;
    onSuccess?: () => void;
}

export default function ApprovePayrollModal({ isOpen, onClose, payrollRun, onSuccess }: ApprovePayrollModalProps) {
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [selectedBankAccount, setSelectedBankAccount] = useState('');

    useEffect(() => {
        if (isOpen && paymentMethod === 'BANK_TRANSFER') {
            loadBankAccounts();
        }
    }, [isOpen, paymentMethod]);

    const loadBankAccounts = async () => {
        try {
            const response = await apiClient.getBankAccounts();
            const accounts = response.data || response;
            setBankAccounts(Array.isArray(accounts) ? accounts : []);
            if (accounts.length > 0) {
                setSelectedBankAccount(accounts[0].id);
            }
        } catch (error) {
            console.error('Error loading bank accounts:', error);
            setBankAccounts([]);
        }
    };

    const handleApprove = async () => {
        if (!payrollRun) return;

        if (paymentMethod === 'BANK_TRANSFER' && !selectedBankAccount) {
            alert('يجب اختيار الحساب البنكي');
            return;
        }

        if (!window.confirm('هل أنت متأكد من اعتماد كشف الرواتب؟')) return;

        setLoading(true);
        try {
            const data: any = {
                runId: payrollRun.id,
                paymentMethod,
            };

            if (paymentMethod === 'BANK_TRANSFER') {
                data.bankAccountId = selectedBankAccount;
            }

            await apiClient.approvePayrollRun(data);
            alert('تم اعتماد كشف الرواتب بنجاح');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error approving payroll:', error);
            const message = error.response?.data?.message || 'حدث خطأ أثناء اعتماد كشف الرواتب';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !payrollRun) return null;

    const monthName = new Date(payrollRun.month).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
    });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            اعتماد كشف الرواتب
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                الشهر: <span className="font-medium text-gray-900 dark:text-white">{monthName}</span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                إجمالي الصافي: <span className="font-bold text-blue-600 dark:text-blue-400">{parseFloat(String(payrollRun.totalNet)).toFixed(2)} ريال</span>
                            </p>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                طريقة الدفع
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="CASH"
                                        checked={paymentMethod === 'CASH'}
                                        onChange={(e) => setPaymentMethod(e.target.value as 'CASH')}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="mr-3 text-sm text-gray-900 dark:text-white">نقدي (من الخزينة)</span>
                                </label>
                                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="BANK_TRANSFER"
                                        checked={paymentMethod === 'BANK_TRANSFER'}
                                        onChange={(e) => setPaymentMethod(e.target.value as 'BANK_TRANSFER')}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="mr-3 text-sm text-gray-900 dark:text-white">تحويل بنكي</span>
                                </label>
                            </div>
                        </div>

                        {/* Bank Account Selection */}
                        {paymentMethod === 'BANK_TRANSFER' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    الحساب البنكي
                                </label>
                                <select
                                    value={selectedBankAccount}
                                    onChange={(e) => setSelectedBankAccount(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="">اختر الحساب البنكي</option>
                                    {bankAccounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.bank.name} - {account.accountNumber} ({account.accountName})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ⚠️ بعد الاعتماد، لن يمكن تعديل أو حذف كشف الرواتب.
                            </p>
                            {paymentMethod === 'CASH' && (
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                                    💰 سيتم خصم المبلغ من الخزينة
                                </p>
                            )}
                            {paymentMethod === 'BANK_TRANSFER' && (
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                                    🏦 سيتم خصم المبلغ من الحساب البنكي المحدد
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button
                            type="button"
                            onClick={handleApprove}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                            <CheckCircle className="w-4 h-4" />
                            اعتماد
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
