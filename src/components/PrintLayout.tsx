import { ReactNode } from 'react';

interface PrintLayoutProps {
  children: ReactNode;
}

export default function PrintLayout({ children }: PrintLayoutProps) {
  return (
    <div className="print-layout">
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden;
          }

          .print-layout,
          .print-layout * {
            visibility: visible;
          }

          .print-layout {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }

          .no-print {
            display: none !important;
          }
        }

        .print-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #0ea5e9;
          border: 1px solid #000;
          border-radius: 8px;
        }

        .company-info-ar {
          text-align: right;
          line-height: 1.8;
        }

        .company-info-en {
          text-align: left;
          line-height: 1.8;
        }

        .print-title {
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 2rem 0;
          color: #000;
        }

        .print-content {
          background: white;
          border-radius: 8px;
          padding: 1rem;
        }

        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }

        .print-table th,
        .print-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: right;
        }

        .print-table th {
          background: #0ea5e9;
          font-weight: 700;
          color: #fff;
        }

        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin: 2rem 0;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .detail-group {
          line-height: 1.8;
        }

        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 3rem;
        }

        .signature-box {
          text-align: center;
          width: 200px;
        }
      `}</style>

      <div className="print-header">
        <div className="company-info-ar">
          <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>مؤسسة</div>
          <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>ساحل الشمال للتخليص الجمركي</div>
          <div style={{ color: '#fff' }}>الرقم الضريبي: 310430599900003</div>
          <div style={{ color: '#fff' }}>ترخيص رقم: 4003</div>
        </div>
        <div className="company-info-en">
          <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>Establishment</div>
          <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>Sahil Al-shamal For Customs Clearance</div>
          <div style={{ color: '#fff' }}>Tax Number: 310430599900003</div>
          <div style={{ color: '#fff' }}>License No.: 4003</div>
        </div>
      </div>

      <div className="print-content">
        {children}
      </div>
    </div>
  );
}
