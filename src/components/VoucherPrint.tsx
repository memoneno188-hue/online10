import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

// تعريف أنواع البيانات
interface VoucherData {
  id: string;
  code: string;
  type: string;
  partyType?: string;
  party_type?: string;
  partyId?: string;
  party_id?: string;
  partyName?: string;
  party_name?: string;
  method: string;
  bankAccountId?: string;
  bank_account_id?: string;
  referenceNumber?: string;
  reference_number?: string;
  amount: number | string;
  note?: string;
  date: string;
  bankAccount?: {
    accountNo?: string;
    account_no?: string;
    bank?: { name: string };
    banks?: { name: string };
  };
  bank_accounts?: {
    account_no: string;
    banks: { name: string };
  };
}

interface VoucherPrintProps {
  voucher: VoucherData;
  onClose: () => void;
}

export default function VoucherPrint({ voucher, onClose }: VoucherPrintProps) {
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      const response = await apiClient.getCompanySettings();
      const data = response.data || response;
      setCompanySettings(data);
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  };

  // دالة لتنسيق الأرقام
  const formatNumber = (num: number | string) => {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  // دالة لتحويل الرقم إلى كلمات (مبسطة)
  const numberToWords = (num: number | string): string => {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    return `${formatNumber(numValue)} ريال سعودي`;
  };

  const handlePrint = () => {
    // Get the voucher content
    const printContent = document.getElementById('voucher-print-content');
    if (!printContent) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Write the content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>سند - ${voucher.code}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          * { font-family: 'Tajawal', sans-serif; }
          @media print {
            @page { size: A4; margin: 15mm; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        </style>
      </head>
      <body class="bg-white p-4">
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  const isReceipt = voucher.type === 'RECEIPT' || voucher.type === 'receipt';
  const partyName = voucher.partyName || voucher.party_name || '';
  const amount = parseFloat(String(voucher.amount));
  const paymentMethod = voucher.method?.toLowerCase() === 'cash' ? 'cash' :
    voucher.method?.toLowerCase() === 'bank_transfer' ? 'transfer' : 'transfer';

  const bankName = voucher.bankAccount?.bank?.name ||
    voucher.bankAccount?.banks?.name ||
    voucher.bank_accounts?.banks?.name || '';
  const referenceNo = voucher.referenceNumber ||
    voucher.reference_number || '';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="print-container bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header Buttons - Hidden in Print */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between no-print">
          <h2 className="text-xl font-bold text-gray-900">
            معاينة {isReceipt ? 'سند قبض' : 'سند صرف'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-print"></i>
              طباعة
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>

        {/* Voucher Content */}
        <div id="voucher-print-content" className="print-content p-8 md:p-10 font-['Tajawal']" dir="rtl">

          {/* Header */}
          <header className="flex justify-between items-start border-b-2 border-blue-900 pb-4 mb-6">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-blue-900 mb-1">{companySettings?.nameAr || 'مؤسسة ساحل الشمال للتخليص الجمركي'}</h1>
              <h2 className="text-lg font-medium text-gray-500 mb-2">{companySettings?.nameEn || 'Sahil Al-shamal For Customs Clearance'}</h2>
              <div className="flex gap-4 text-xs text-gray-600">
                <span><strong className="text-blue-900">الرقم الضريبي:</strong> {companySettings?.taxNumber || '310430599900003'}</span>
                <span className="text-gray-300">|</span>
                <span><strong className="text-blue-900">ترخيص رقم:</strong> {companySettings?.licenseNo || '4003'}</span>
              </div>
            </div>
            {/* Logo */}
            <div className="w-20 h-20 flex items-center justify-center">
              {companySettings?.logoPath ? (
                <img
                  src={`http://localhost:3000${companySettings.logoPath}`}
                  alt="Company Logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200">
                  <span className="text-sm text-slate-400">شعار</span>
                </div>
              )}
            </div>
          </header>

          {/* Voucher Meta Strip */}
          <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8">
            {/* Voucher Number */}
            <div className="text-right">
              <span className="block text-xs text-gray-500">رقم السند No</span>
              <strong className="block text-lg text-black">{voucher.code}</strong>
            </div>

            {/* Title */}
            <div className="text-center flex-grow">
              <h2 className="text-2xl font-bold text-blue-900">
                {isReceipt ? 'سند قبض' : 'سند صرف'}
              </h2>
              <span className="text-sm text-gray-500 font-normal">
                {isReceipt ? 'Receipt Voucher' : 'Payment Voucher'}
              </span>
            </div>

            {/* Amount Box */}
            <div className="bg-white border-2 border-blue-900 text-blue-900 px-6 py-2 rounded text-center min-w-[140px] shadow-sm">
              <span className="block text-[10px] text-gray-400 mb-1">المبلغ Amount</span>
              <strong className="block text-xl font-bold font-mono tracking-wide">
                {formatNumber(amount)} <span className="text-xs align-top">SAR</span>
              </strong>
            </div>
          </div>

          {/* Form Body */}
          <div className="flex flex-col gap-5 text-sm">

            {/* Row 1: Date & Party */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3 flex items-baseline border-b border-dashed border-gray-300 pb-2">
                <span className="text-blue-900 font-bold ml-3 min-w-[80px]">التاريخ / Date:</span>
                <span className="font-medium text-gray-800">{format(new Date(voucher.date), 'dd/MM/yyyy')}</span>
              </div>
              <div className="md:w-2/3 flex items-baseline border-b border-dashed border-gray-300 pb-2">
                <span className="text-blue-900 font-bold ml-3">
                  {isReceipt ? 'استلمنا من السيد/السادة:' : 'يصرف للسيد/السادة:'}
                </span>
                <span className="font-medium text-gray-800 flex-grow">{partyName}</span>
              </div>
            </div>

            {/* Row 2: Amount in Words */}
            <div className="flex items-center bg-slate-100 p-3 rounded border-r-4 border-blue-600">
              <span className="text-blue-900 font-bold ml-4 whitespace-nowrap">مبلغ وقدره:</span>
              <span className="font-bold text-gray-900">{numberToWords(amount)}</span>
            </div>

            {/* Row 3: Payment Method - RTL Aligned */}
            <div className="flex items-center border-b border-gray-200 pb-4">
              <span className="text-blue-900 font-bold ml-6 text-sm">طريقة الدفع:</span>

              <div className="flex gap-8">
                <Checkbox label="نقدًا (Cash)" checked={paymentMethod === 'cash'} />
                <Checkbox label="تحويل (Transfer)" checked={paymentMethod === 'transfer'} />
              </div>
            </div>

            {/* Row 4: Bank Details (Conditional) - Single Row */}
            {paymentMethod !== 'cash' && (
              <div className="flex items-center gap-6 bg-slate-50 p-3 rounded border border-slate-200">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 ml-2">على بنك:</span>
                  <span className="font-bold text-gray-800 text-sm">{bankName || 'ــــــــــــ'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 ml-2">رقم المرجع:</span>
                  <span className="font-bold text-gray-800 font-mono text-sm">{referenceNo || 'ــــــــــــ'}</span>
                </div>
              </div>
            )}

            {/* Row 5: Description */}
            {voucher.note && (
              <div className="flex items-baseline border-b border-dashed border-gray-300 pb-2">
                <span className="text-blue-900 font-bold ml-3 min-w-[70px]">
                  {isReceipt ? 'وذلك عن:' : 'وذلك مقابل:'}
                </span>
                <span className="font-medium text-gray-800 flex-grow leading-relaxed">
                  {voucher.note}
                </span>
              </div>
            )}

          </div>

          {/* Footer */}
          <footer className="mt-12 flex justify-between pt-6 gap-4">
            {isReceipt ? (
              <>
                <div className="text-center w-40">
                  <p className="font-bold text-gray-600 text-sm mb-8">المستلم (Recipient)</p>
                  <div className="border-b border-gray-400 w-full"></div>
                </div>
                <div className="text-center w-40">
                  <p className="font-bold text-gray-600 text-sm mb-8">المحاسب / الختم</p>
                  <div className="border-b border-gray-400 w-full"></div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center w-1/3">
                  <p className="font-bold text-gray-600 text-sm mb-8">المحاسب (Prepared By)</p>
                  <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
                </div>
                <div className="text-center w-1/3">
                  <p className="font-bold text-gray-600 text-sm mb-8">المدير المالي (Approved By)</p>
                  <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
                </div>
                <div className="text-center w-1/3">
                  <p className="font-bold text-gray-600 text-sm mb-8">المستلم (Received By)</p>
                  <div className="border-b border-gray-400 w-3/4 mx-auto"></div>
                </div>
              </>
            )}
          </footer>

          <div className="mt-10 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400">
            هذا السند تم انشائة الكترونيا من نظام ادارة العمليات الجمركية ولا يحتاج الى ختم او توقيع
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Helper Component: Checkbox ---
const Checkbox = ({ label, checked }: { label: string, checked: boolean }) => (
  <div className="flex items-center gap-2 cursor-pointer">
    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors
      ${checked ? 'border-blue-900 bg-blue-900' : 'border-gray-300 bg-white'}`}>
      {checked && <span className="text-white text-sm font-bold">✓</span>}
    </div>
    <span className={`text-sm ${checked ? 'font-bold text-blue-900' : 'text-gray-600'}`}>
      {label}
    </span>
  </div>
);
