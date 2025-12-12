import React from 'react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface CustomerStatementPrintProps {
  customerName: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  transactions: Transaction[];
  closingBalance: number;
  onClose: () => void;
}

export default function CustomerStatementPrint({
  customerName,
  startDate,
  endDate,
  transactions,
  closingBalance,
  onClose,
}: CustomerStatementPrintProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalDebit = transactions.reduce((sum, tx) => sum + tx.debit, 0);
  const totalCredit = transactions.reduce((sum, tx) => sum + tx.credit, 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>كشف حساب عميل - ${customerName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          * { font-family: 'Tajawal', sans-serif; }
          @media print {
            @page { 
              size: A4; 
              margin: 15mm; 
            }
            * { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
          }
        </style>
      </head>
      <body class="bg-white p-8">
        <div class="max-w-full">
          <!-- Header -->
          <header class="flex justify-between items-start border-b-2 border-blue-900 pb-6 mb-8">
            <div class="flex flex-col">
              <h1 class="text-2xl font-bold text-blue-900 mb-1">مؤسسة ساحل الشمال للتخليص الجمركي</h1>
              <h2 class="text-sm font-medium text-gray-500 mb-3">Sahil Al-shamal For Customs Clearance</h2>
              <div class="flex gap-4 text-xs text-gray-600">
                <span><strong class="text-blue-900">الرقم الضريبي:</strong> 310430599900003</span>
                <span class="text-gray-300">|</span>
                <span><strong class="text-blue-900">ترخيص رقم:</strong> 4003</span>
              </div>
            </div>
            <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200">
              <span class="text-xs text-slate-400">شعار المؤسسة</span>
            </div>
          </header>

          <!-- Title -->
          <div class="flex justify-between items-center mb-8 bg-blue-50 p-3 rounded border border-blue-100">
            <h2 class="text-xl font-bold text-blue-900">كشف حساب عميل (Statement of Account)</h2>
            <span class="text-sm text-gray-600">تاريخ الطباعة: ${format(new Date(), 'dd/MM/yyyy')}</span>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-6 mb-8">
            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200 border-r-4 border-r-blue-600">
              <h3 class="text-blue-900 font-bold text-sm mb-3 border-b border-slate-300 pb-2">بيانات العميل</h3>
              <div class="flex items-baseline mb-2">
                <span class="text-slate-500 ml-2 text-sm">العميل:</span>
                <span class="font-bold text-slate-900 text-sm">${customerName}</span>
              </div>
            </div>
            <div class="bg-slate-50 p-5 rounded-lg border border-slate-200 border-r-4 border-r-blue-600">
              <h3 class="text-blue-900 font-bold text-sm mb-3 border-b border-slate-300 pb-2">فترة الكشف</h3>
              <div class="flex gap-6">
                <div class="flex items-baseline mb-2">
                  <span class="text-slate-500 ml-2 text-sm">من:</span>
                  <span class="font-bold text-slate-900 text-sm">${format(new Date(startDate), 'dd/MM/yyyy')}</span>
                </div>
                <div class="flex items-baseline mb-2">
                  <span class="text-slate-500 ml-2 text-sm">إلى:</span>
                  <span class="font-bold text-slate-900 text-sm">${format(new Date(endDate), 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-hidden rounded-lg border border-gray-200 mb-8">
            <table class="w-full text-sm text-right">
              <thead class="bg-blue-900 text-white">
                <tr>
                  <th class="py-2 px-2 font-medium w-24 text-center text-xs">التاريخ</th>
                  <th class="py-2 px-2 font-medium text-center text-xs">التفاصيل</th>
                  <th class="py-2 px-2 font-medium w-20 text-center text-xs">مدين</th>
                  <th class="py-2 px-2 font-medium w-20 text-center text-xs">دائن</th>
                  <th class="py-2 px-2 font-medium w-24 text-center bg-blue-800 text-xs">الرصيد</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${transactions.map((tx, index) => `
                  <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">
                    <td class="py-1 px-2 text-gray-600 whitespace-nowrap text-xs">${format(new Date(tx.date), 'dd/MM/yyyy')}</td>
                    <td class="py-1 px-2 text-gray-800 font-medium text-xs whitespace-nowrap overflow-hidden text-ellipsis" style="max-width: 300px;">${tx.description}</td>
                    <td class="py-1 px-2 text-gray-600 font-mono text-left text-xs">
                      ${tx.debit > 0 ? formatCurrency(tx.debit) : '-'}
                    </td>
                    <td class="py-1 px-2 text-green-600 font-mono text-left text-xs">
                      ${tx.credit > 0 ? formatCurrency(tx.credit) : '-'}
                    </td>
                    <td class="py-1 px-2 text-blue-900 font-bold font-mono text-left bg-blue-50/50 text-xs">
                      ${formatCurrency(tx.balance)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Summary -->
          <div class="grid grid-cols-3 gap-4 mb-12">
            <div class="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center">
              <span class="text-xs text-gray-500 mb-1">إجمالي المدين</span>
              <span class="text-lg font-bold font-mono text-gray-700">${formatCurrency(totalDebit)}</span>
            </div>
            <div class="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center">
              <span class="text-xs text-gray-500 mb-1">إجمالي الدائن (سداد)</span>
              <span class="text-lg font-bold font-mono text-green-600">${formatCurrency(totalCredit)}</span>
            </div>
            <div class="bg-blue-900 text-white p-4 rounded-lg flex flex-col items-center justify-center shadow">
              <span class="text-sm opacity-80 mb-1">الرصيد المستحق</span>
              <span class="text-2xl font-bold font-mono">${formatCurrency(closingBalance)} ريال</span>
            </div>
          </div>

          <!-- Footer -->
          <footer class="flex justify-between items-end border-t border-gray-200 pt-8 mt-auto">
            <div class="text-center w-48">
              <p class="font-bold text-gray-600 mb-12">الحسابات</p>
              <div class="border-b border-dashed border-gray-400 w-full"></div>
            </div>
            <div class="text-center w-48">
              <p class="font-bold text-gray-600 mb-12">المدير المالي / الختم</p>
              <div class="border-b border-dashed border-gray-400 w-full"></div>
            </div>
          </footer>
        </div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold text-gray-900 mb-4">كشف حساب عميل</h3>
        <p className="text-gray-600 mb-6">
          هل تريد طباعة كشف حساب <strong>{customerName}</strong>؟
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            طباعة
          </button>
        </div>
      </div>
    </div>
  );
}
