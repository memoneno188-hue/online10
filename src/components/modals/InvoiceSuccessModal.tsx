import { CheckCircle, Eye, Printer, X } from 'lucide-react';

interface InvoiceSuccessModalProps {
    isOpen: boolean;
    invoiceCode: string;
    invoiceId: string;
    onClose: () => void;
    onPreview: (id: string) => void;
    onPrint: (id: string) => void;
}

export default function InvoiceSuccessModal({
    isOpen,
    invoiceCode,
    invoiceId,
    onClose,
    onPreview,
    onPrint,
}: InvoiceSuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Success Icon and Message */}
                <div className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-4">
                                <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        تم إنشاء الفاتورة بنجاح
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                        رقم الفاتورة
                    </p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-6">
                        {invoiceCode}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                onPreview(invoiceId);
                                onClose();
                            }}
                            className="flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            <Eye className="w-5 h-5" />
                            <span className="font-semibold">معاينة</span>
                        </button>

                        <button
                            onClick={() => {
                                onPrint(invoiceId);
                                onClose();
                            }}
                            className="flex items-center justify-center gap-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            <Printer className="w-5 h-5" />
                            <span className="font-semibold">طباعة</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="flex items-center justify-center gap-3 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-all duration-200"
                        >
                            <X className="w-5 h-5" />
                            <span className="font-semibold">إلغاء</span>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
        </div>
    );
}
