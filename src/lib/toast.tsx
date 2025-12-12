import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader } from 'lucide-react';

// Toast configuration
const toastConfig = {
    duration: 3000,
    position: 'top-center' as const,
    style: {
        background: '#fff',
        color: '#1f2937',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontFamily: 'Tajawal, sans-serif',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
    },
};

// Success toast
export const showSuccess = (message: string, username?: string) => {
    const fullMessage = username ? `${message} ${username}` : message;

    toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center gap-3 p-4 border-r-4 border-green-500`}
            >
                <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{fullMessage}</p>
                </div>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            </div>
        ),
        { duration: 3000 }
    );
};

// Error toast
export const showError = (message: string) => {
    toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center gap-3 p-4 border-r-4 border-red-500`}
            >
                <div className="flex-shrink-0">
                    <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{message}</p>
                </div>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            </div>
        ),
        { duration: 5000 }
    );
};

// Warning toast
export const showWarning = (message: string) => {
    toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center gap-3 p-4 border-r-4 border-orange-500`}
            >
                <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{message}</p>
                </div>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            </div>
        ),
        { duration: 4000 }
    );
};

// Info toast
export const showInfo = (message: string) => {
    toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center gap-3 p-4 border-r-4 border-blue-500`}
            >
                <div className="flex-shrink-0">
                    <Info className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{message}</p>
                </div>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            </div>
        ),
        { duration: 3000 }
    );
};

// Loading toast
export const showLoading = (message: string) => {
    return toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center gap-3 p-4 border-r-4 border-indigo-500`}
            >
                <div className="flex-shrink-0">
                    <Loader className="h-6 w-6 text-indigo-500 animate-spin" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{message}</p>
                </div>
            </div>
        ),
        { duration: Infinity }
    );
};

// Promise toast (for async operations)
export const showPromise = <T,>(
    promise: Promise<T>,
    messages: {
        loading: string;
        success: string;
        error: string;
    }
) => {
    const loadingToast = showLoading(messages.loading);

    promise
        .then(() => {
            toast.dismiss(loadingToast);
            showSuccess(messages.success);
        })
        .catch(() => {
            toast.dismiss(loadingToast);
            showError(messages.error);
        });

    return promise;
};

// Confirmation dialog using toast
export const showConfirm = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
) => {
    toast.custom(
        (t) => (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Overlay */}
                <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => {
                        toast.dismiss(t.id);
                        onCancel?.();
                    }}
                />

                {/* Dialog */}
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'
                        } relative max-w-md w-full mx-4 bg-white dark:bg-gray-800 shadow-2xl rounded-xl pointer-events-auto p-6 border-t-4 border-orange-500`}
                >
                    <div className="flex items-start gap-3 mb-6">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-orange-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-medium text-gray-900 dark:text-white">{message}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                onCancel?.();
                            }}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                onConfirm();
                            }}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                        >
                            تأكيد
                        </button>
                    </div>
                </div>
            </div>
        ),
        {
            duration: Infinity,
            position: 'top-center',
        }
    );
};

// Export Toaster component
export { Toaster };
