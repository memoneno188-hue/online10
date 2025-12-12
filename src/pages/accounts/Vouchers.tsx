import { useState } from 'react';
import { FileText, DollarSign } from 'lucide-react';
import ReceiptVouchers from './vouchers/ReceiptVouchers';
import PaymentVouchers from './vouchers/PaymentVouchers';

type VoucherTab = 'receipt' | 'payment';

export default function Vouchers() {
  const [activeTab, setActiveTab] = useState<VoucherTab>('receipt');

  return (
    <div className="space-y-6">
      <div className="flex gap-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'receipt'
              ? 'border-green-600 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          سندات القبض
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'payment'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FileText className="w-5 h-5" />
          سندات الصرف
        </button>
      </div>

      {activeTab === 'receipt' && <ReceiptVouchers />}
      {activeTab === 'payment' && <PaymentVouchers />}
    </div>
  );
}
