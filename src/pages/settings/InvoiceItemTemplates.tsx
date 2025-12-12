import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Plus, Trash2, FileText } from 'lucide-react';

interface InvoiceItemTemplate {
    id: string;
    description: string;
    vatRate?: number;
    createdAt: string;
}


export default function InvoiceItemTemplates() {
    const [templates, setTemplates] = useState<InvoiceItemTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDescription, setNewDescription] = useState('');
    const [newVatRate, setNewVatRate] = useState(15);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const response = await apiClient.getInvoiceItemTemplates();
            setTemplates(response);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDescription.trim()) return;

        // Check for duplicates
        const duplicate = templates.find(
            t => t.description.toLowerCase() === newDescription.trim().toLowerCase()
        );
        if (duplicate) {
            alert('⚠️ هذا البند موجود مسبقاً في القائمة!');
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.createInvoiceItemTemplate({
                description: newDescription.trim(),
                vatRate: newVatRate
            });
            setNewDescription('');
            setNewVatRate(15);
            setShowAddForm(false);
            await loadTemplates();
            alert('✅ تم إضافة البند بنجاح!');
        } catch (error: any) {
            console.error('Error creating template:', error);
            const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء إضافة البند';
            if (errorMsg.includes('unique') || errorMsg.includes('duplicate')) {
                alert('⚠️ هذا البند موجود مسبقاً في القائمة!');
            } else {
                alert(errorMsg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTemplate = async (id: string, description: string) => {
        if (!confirm(`هل أنت متأكد من حذف البند "${description}"؟`)) return;

        try {
            await apiClient.deleteInvoiceItemTemplate(id);
            await loadTemplates();
        } catch (error: any) {
            console.error('Error deleting template:', error);
            alert(error.response?.data?.message || 'حدث خطأ أثناء حذف البند');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-gray-500 dark:text-gray-400">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        بنود الفواتير المحفوظة
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        إدارة البنود المحفوظة للاستخدام السريع عند إنشاء الفواتير
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    إضافة بند
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        إضافة بند جديد
                    </h3>
                    <form onSubmit={handleAddTemplate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    وصف البند
                                </label>
                                <input
                                    type="text"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    placeholder="مثال: رسوم تخليص جمركي"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    نسبة ضريبة القيمة المضافة
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={newVatRate}
                                        onChange={(e) => setNewVatRate(Number(e.target.value))}
                                        placeholder="15"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                                        %
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewDescription('');
                                    setNewVatRate(15);
                                }}
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !newDescription.trim()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'جاري الحفظ...' : 'حفظ'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {templates.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                            لا توجد بنود محفوظة. اضغط "إضافة بند" لإنشاء بند جديد.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                        وصف البند
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                        نسبة ضريبة القيمة المضافة
                                    </th>
                                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                        الإجراءات
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {templates.map((template) => (
                                    <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                {template.description}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {template.vatRate ? `${template.vatRate}%` : '0%'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDeleteTemplate(template.id, template.description)}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                حذف
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>ملاحظة:</strong> البنود المحفوظة تظهر كاقتراحات عند إنشاء الفواتير لتسريع عملية الإدخال.
                </p>
            </div>
        </div>
    );
}
