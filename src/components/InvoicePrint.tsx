import { format } from 'date-fns';
import PrintLayout from './PrintLayout';

interface InvoiceData {
  invoice_no: string;
  date: string;
  customs_number: string;
  customer_name: string;
  driver_name?: string;
  shipper_name?: string;
  plate_number?: string;
  goods_type?: string;
  customs_fees: number;
  office_fees: number;
  freight: number;
  port_fees: number;
  loading_fees: number;
  other_expenses: number;
  vat_amount: number;
  total_amount: number;
}

interface InvoicePrintProps {
  invoice: InvoiceData;
  onClose: () => void;
}

export default function InvoicePrint({ invoice, onClose }: InvoicePrintProps) {
  const handlePrint = () => {
    window.print();
  };

  const subtotal = invoice.customs_fees + invoice.office_fees + invoice.freight +
                   invoice.port_fees + invoice.loading_fees + invoice.other_expenses;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between no-print">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            معاينة الفاتورة
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

        <div className="p-6">
          <PrintLayout>
            <div className="print-title">فاتورة رقم: {invoice.invoice_no}</div>

            <div className="invoice-details" style={{ margin: '1rem 0', padding: '1rem', background: '#f0f0f0', borderRadius: '6px', border: '1px solid #000' }}>
              <div className="detail-group" style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#000' }}>اسم العميل:</strong>{' '}
                  <span style={{ color: '#000' }}>{invoice.customer_name}</span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#000' }}>تاريخ الفاتورة:</strong>{' '}
                  <span style={{ color: '#000' }}>{format(new Date(invoice.date), 'dd/MM/yyyy')}</span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#000' }}>اسم الشاحن:</strong>{' '}
                  <span style={{ color: '#000' }}>{invoice.shipper_name || 'غير محدد'}</span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#000' }}>نوع البضاعة:</strong>{' '}
                  <span style={{ color: '#000' }}>{invoice.goods_type || 'غير محدد'}</span>
                </div>
              </div>
              <div className="detail-group" style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#000' }}>الرقم الجمركي:</strong>{' '}
                  <span style={{ color: '#000' }}>{invoice.customs_number}</span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#000' }}>اسم السائق:</strong>{' '}
                  <span style={{ color: '#000' }}>{invoice.driver_name || 'غير محدد'}</span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#000' }}>رقم اللوحة:</strong>{' '}
                  <span style={{ color: '#000' }}>{invoice.plate_number || 'غير محدد'}</span>
                </div>
              </div>
            </div>

            <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ padding: '0.7rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                    البيان
                  </th>
                  <th style={{ padding: '0.7rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                    المبلغ (ريال)
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.customs_fees > 0 && (
                  <tr style={{ background: 'white' }}>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      رسوم جمركية
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      {invoice.customs_fees.toFixed(2)}
                    </td>
                  </tr>
                )}
                {invoice.office_fees > 0 && (
                  <tr style={{ background: '#f9fafb' }}>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      أتعاب المكتب
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      {invoice.office_fees.toFixed(2)}
                    </td>
                  </tr>
                )}
                {invoice.freight > 0 && (
                  <tr style={{ background: 'white' }}>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      نولون
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      {invoice.freight.toFixed(2)}
                    </td>
                  </tr>
                )}
                {invoice.port_fees > 0 && (
                  <tr style={{ background: '#f9fafb' }}>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      أجور مواني
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      {invoice.port_fees.toFixed(2)}
                    </td>
                  </tr>
                )}
                {invoice.loading_fees > 0 && (
                  <tr style={{ background: 'white' }}>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      تحميل وتنزيل
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      {invoice.loading_fees.toFixed(2)}
                    </td>
                  </tr>
                )}
                {invoice.other_expenses > 0 && (
                  <tr style={{ background: '#f9fafb' }}>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      مصاريف أخرى
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      {invoice.other_expenses.toFixed(2)}
                    </td>
                  </tr>
                )}
                {invoice.vat_amount > 0 && (
                  <tr style={{ background: 'white' }}>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      القيمة المضافة (15%)
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center', color: '#000', border: '1px solid #000' }}>
                      {invoice.vat_amount.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '6px', textAlign: 'center', margin: '1rem 0', border: '1px solid #000' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#000' }}>
                الإجمالي النهائي: {invoice.total_amount.toFixed(2)} ريال
              </div>
            </div>

            <div className="signature-section">
              <div className="signature-box">
                <div style={{ marginBottom: '3rem' }}></div>
                <strong style={{ color: '#000' }}>المسؤول</strong>
              </div>
              <div className="signature-box">
                <div style={{ marginBottom: '3rem' }}></div>
                <strong style={{ color: '#000' }}>التوقيع</strong>
              </div>
            </div>
          </PrintLayout>
        </div>
      </div>
    </div>
  );
}
