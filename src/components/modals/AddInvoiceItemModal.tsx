import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface AddInvoiceItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onItemAdded: (description: string, vatRate: number) => void;
}

export default function AddInvoiceItemModal({ isOpen, onClose, onItemAdded }: AddInvoiceItemModalProps) {
    const [description, setDescription] = useState('');
    const [vatRate, setVatRate] = useState(15); // القيمة الافتراضية 15%
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        setLoading(true);
        try {
            await apiClient.createInvoiceItemTemplate({
                description: description.trim(),
                vatRate: vatRate
            });
            alert('✅ تم إضافة البند بنجاح!');
            onItemAdded(description.trim(), vatRate);
            setDescription('');
            setVatRate(15);
            onClose();
        } catch (error: any) {
            console.error('Error creating item:', error);
            const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء إضافة البند';
            if (errorMsg.includes('unique') || errorMsg.includes('duplicate')) {
                alert('⚠️ هذا البند موجود مسبقاً في القائمة!');
            } else {
                alert(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setDescription('');
        setVatRate(15);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={handleClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-600" />
                        إضافة بند جديد
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            وصف البند
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="مثال: رسوم تخليص جمركي"
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            نسبة الضريبة (%)
                        </label>
                        <input
                            type="number"
                            value={vatRate}
                            onChange={(e) => setVatRate(Number(e.target.value))}
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="15"
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            💡 سيتم حفظ هذا البند في القائمة المحفوظة ليكون متاحاً للاستخدام في الفواتير المستقبلية
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !description.trim()}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    حفظ واستخدام
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
