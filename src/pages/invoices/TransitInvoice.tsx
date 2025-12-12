import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { Plus, Trash2, Save, Search, Eye, Printer, Edit, FileText, X, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import InvoicePreview from '@/components/InvoicePreview';
import AutocompleteInput from '@/components/AutocompleteInput';
import InvoiceSuccessModal from '@/components/modals/InvoiceSuccessModal';

const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'يجب اختيار العميل'),
  customs_no: z.string().min(1, 'رقم البيان مطلوب'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  driver_name: z.string().optional(),
  shipper_name: z.string().optional(),
  vehicle_no: z.string().optional(),
  cargo_type: z.string().optional(),
  vat_enabled: z.boolean(),
  vat_rate: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceItem {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
  vatRate: number;
  amount: number;
  categoryId?: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  code: string;
  customsNo: string;
  date: string;
  total: number;
  customerId: string;
  customer?: { name: string };
}

export default function TransitInvoice() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'year' | 'month' | 'all'>('year');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    totalFees: 0,
  });
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [applyVAT, setApplyVAT] = useState(false); // Control VAT visibility and application
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<{ id: string; code: string } | null>(null);

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), description: '', unitPrice: 0, quantity: 1, vatRate: 0, amount: 0 },
  ]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      vat_enabled: false,
      vat_rate: 14,
    },
  });



  useEffect(() => {
    loadCustomers();
    loadInvoices();
  }, [currentPage, filterPeriod, searchTerm]);

  const loadCustomers = async () => {
    try {
      const response = await apiClient.getCustomers({ type: 'TRANSIT' });
      if (response.data) {
        setCustomers(response.data.map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);

      const params: any = {
        type: 'TRANSIT',
        page: currentPage,
        limit: 10,
      };

      if (searchTerm) {
        params.q = searchTerm;
      }

      const now = new Date();
      if (filterPeriod === 'year') {
        params.from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      } else if (filterPeriod === 'month') {
        params.from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      }

      const response = await apiClient.getInvoices(params);
      setInvoices(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);

      // Get stats based on selected filter period
      let statsFrom: string | undefined;
      let statsTo: string | undefined;

      if (filterPeriod === 'year') {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        statsFrom = `${yearStart.getFullYear()}-01-01`;
      } else if (filterPeriod === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        statsFrom = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-01`;
        statsTo = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;
      }

      const statsResponse = await apiClient.getInvoiceStats({
        type: 'TRANSIT',
        ...(statsFrom && { from: statsFrom }),
        ...(statsTo && { to: statsTo })
      });

      setStats({
        totalInvoices: statsResponse.totalInvoices || 0,
        totalAmount: statsResponse.totalAmount || 0,
        totalFees: statsResponse.totalFees || 0,
      });
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', unitPrice: 0, quantity: 1, vatRate: 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Auto-calculate amount when unitPrice, quantity, or vatRate changes
          if (field === 'unitPrice' || field === 'quantity' || field === 'vatRate') {
            const subtotal = Number(updated.unitPrice) * Number(updated.quantity);
            const vatAmount = subtotal * (Number(updated.vatRate) / 100);
            updated.amount = subtotal + vatAmount;
          }
          return updated;
        }
        return item;
      });
    });
  };

  const calculateTotals = () => {
    // Calculate subtotal from unitPrice * quantity
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = (item.unitPrice || 0) * (item.quantity || 1);
      return sum + itemSubtotal;
    }, 0);

    // Calculate VAT from individual item rates
    const vatAmount = items.reduce((sum, item) => {
      const itemSubtotal = (item.unitPrice || 0) * (item.quantity || 1);
      const itemVat = itemSubtotal * ((item.vatRate || 0) / 100);
      return sum + itemVat;
    }, 0);

    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, total };
  };

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setLoading(true);

      const { subtotal } = calculateTotals();

      if (subtotal === 0) {
        alert('لا يمكن حفظ فاتورة بقيمة صفر');
        setLoading(false);
        return;
      }

      const invoiceData: any = {
        customsNo: data.customs_no,
        date: data.date,
        driverName: data.driver_name,
        shipperName: data.shipper_name,
        vehicleNo: data.vehicle_no,
        cargoType: data.cargo_type,
        vatEnabled: data.vat_enabled,
        vatRate: data.vat_rate,
        notes: data.notes || undefined,
        items: items
          .filter((item) => item.description && item.amount > 0)
          .map((item, index) => ({
            description: item.description,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            vatRate: item.vatRate,
            amount: item.amount,
            categoryId: item.categoryId,
            sortOrder: index,
          })),
      };

      if (editingInvoice) {
        // Update existing invoice
        await apiClient.updateInvoice(editingInvoice.id, invoiceData);
        alert('تم تحديث الفاتورة بنجاح');
      } else {
        // Create new invoice
        invoiceData.type = 'TRANSIT';
        invoiceData.customerId = data.customer_id;
        const response = await apiClient.createInvoice(invoiceData);

        // Show success modal for new invoices
        setCreatedInvoice({ id: response.id, code: response.code });
        setShowSuccessModal(true);
      }

      setShowModal(false);
      setEditingInvoice(null);
      reset();
      setItems([{ id: crypto.randomUUID(), description: '', unitPrice: 0, quantity: 1, vatRate: 0, amount: 0 }]);
      loadInvoices();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      const message = error.response?.data?.message || 'حدث خطأ أثناء حفظ الفاتورة';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

    try {
      await apiClient.deleteInvoice(id);
      alert('تم حذف الفاتورة بنجاح');
      loadInvoices();
    } catch (error: any) {
      const message = error.response?.data?.message || 'حدث خطأ أثناء حذف الفاتورة';
      alert(message);
    }
  };

  const handlePreview = async (id: string) => {
    try {
      const invoice = await apiClient.getInvoice(id);
      if (invoice) {
        setPreviewInvoice(invoice);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const invoice = await apiClient.getInvoice(id);
      if (invoice) {
        setEditingInvoice(invoice);
        reset({
          customer_id: invoice.customerId,
          customs_no: invoice.customsNo,
          date: invoice.date.split('T')[0],
          driver_name: invoice.driverName || '',
          shipper_name: invoice.shipperName || '',
          vehicle_no: invoice.vehicleNo || '',
          cargo_type: invoice.cargoType || '',
          vat_enabled: invoice.vatEnabled,
          vat_rate: invoice.vatRate ? parseFloat(invoice.vatRate.toString()) : 14,
          notes: invoice.notes || '',
        });
        setItems(
          invoice.items?.map((item: any) => {
            if (item.unitPrice !== undefined && item.quantity !== undefined && item.vatRate !== undefined) {
              return {
                id: item.id,
                description: item.description,
                unitPrice: parseFloat(item.unitPrice),
                quantity: parseFloat(item.quantity),
                vatRate: parseFloat(item.vatRate),
                amount: parseFloat(item.amount),
                categoryId: item.categoryId,
              };
            } else {
              return {
                id: item.id,
                description: item.description,
                unitPrice: parseFloat(item.amount),
                quantity: 1,
                vatRate: 0,
                amount: parseFloat(item.amount),
                categoryId: item.categoryId,
              };
            }
          }) || [{ id: crypto.randomUUID(), description: '', unitPrice: 0, quantity: 1, vatRate: 0, amount: 0 }]
        );

        // Check if any item has VAT rate > 0, then enable VAT toggle
        const hasVAT = invoice.items?.some((item: any) => {
          const vatRate = item.vatRate !== undefined ? parseFloat(item.vatRate) : 0;
          return vatRate > 0;
        });
        if (hasVAT) {
          setApplyVAT(true);
        }

        setShowModal(true);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
    }
  };

  const handlePrint = async (id: string) => {
    try {
      const invoice = await apiClient.getInvoice(id);
      if (invoice) {
        setPreviewInvoice(invoice);
        setTimeout(() => {
          window.print();
        }, 100);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
    }
  };

  const { subtotal, vatAmount, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/invoices'}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            رجوع
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              فواتير الترانزيت
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              إدارة فواتير الترانزيت
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingInvoice(null);
            reset({
              date: format(new Date(), 'yyyy-MM-dd'),
              vat_enabled: false,
              vat_rate: 14,
              driver_name: '',
              shipper_name: '',
              vehicle_no: '',
              cargo_type: '',
              notes: '',
            });
            setItems([{ id: crypto.randomUUID(), description: '', unitPrice: 0, quantity: 1, vatRate: 0, amount: 0 }]);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إنشاء فاتورة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                إجمالي الفواتير {filterPeriod === 'year' ? 'للسنة الحالية' : filterPeriod === 'month' ? 'للشهر الحالي' : 'الإجمالية'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalInvoices}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                إجمالي مبالغ الفواتير {filterPeriod === 'year' ? 'للسنة الحالية' : filterPeriod === 'month' ? 'للشهر الحالي' : 'الإجمالية'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalAmount.toFixed(2)} ريال
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                إجمالي أجور التخليص {filterPeriod === 'year' ? 'للسنة الحالية' : filterPeriod === 'month' ? 'للشهر الحالي' : 'الإجمالية'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalFees.toFixed(2)} ريال
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالعميل أو رقم الفاتورة أو رقم البيان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterPeriod('year')}
              className={`px-4 py-2 rounded-lg transition-colors ${filterPeriod === 'year'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              السنة الحالية
            </button>
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${filterPeriod === 'month'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              الشهر الحالي
            </button>
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${filterPeriod === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              الإجمالية
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  رقم الفاتورة
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  العميل
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  التاريخ
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  رقم البيان
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  الإجمالي
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {invoice.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {invoice.customer?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(invoice.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {invoice.customsNo}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {parseFloat(invoice.total.toString()).toFixed(2)} ريال
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreview(invoice.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="معاينة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrint(invoice.id)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="طباعة"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(invoice.id)}
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingInvoice ? 'تعديل بيانات فاتورة ترانزيت' : 'إنشاء فاتورة ترانزيت جديدة'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  بيانات الفاتورة
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      العميل <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('customer_id')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">اختر العميل</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                    {errors.customer_id && (
                      <p className="text-red-500 text-sm mt-1">{errors.customer_id.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      رقم البيان <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('customs_no')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.customs_no && (
                      <p className="text-red-500 text-sm mt-1">{errors.customs_no.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      التاريخ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.date && (
                      <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      اسم السائق
                    </label>
                    <input
                      type="text"
                      {...register('driver_name')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      اسم الشاحن
                    </label>
                    <input
                      type="text"
                      {...register('shipper_name')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      رقم السيارة
                    </label>
                    <input
                      type="text"
                      {...register('vehicle_no')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نوع البضاعة
                    </label>
                    <input
                      type="text"
                      {...register('cargo_type')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ملاحظات
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                {/* VAT Toggle - Professional Design */}
                <div className="mb-6 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={applyVAT}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              setApplyVAT(checked);
                              if (!checked) {
                                // Disable VAT: clear all VAT rates
                                setItems(items.map(item => ({
                                  ...item,
                                  vatRate: 0,
                                  amount: item.unitPrice * item.quantity
                                })));
                              } else {
                                // Enable VAT: auto-fill VAT rates from templates
                                const updatedItems = await Promise.all(
                                  items.map(async (item) => {
                                    if (item.description) {
                                      try {
                                        const results = await apiClient.searchInvoiceItemTemplates(item.description);
                                        const template = results.find((r: any) => r.description === item.description);
                                        if (template && template.vatRate !== undefined) {
                                          const subtotal = item.unitPrice * item.quantity;
                                          const vatAmount = subtotal * (template.vatRate / 100);
                                          return {
                                            ...item,
                                            vatRate: template.vatRate,
                                            amount: subtotal + vatAmount
                                          };
                                        }
                                      } catch (error) {
                                        console.error('Error fetching template:', error);
                                      }
                                    }
                                    return item;
                                  })
                                );
                                setItems(updatedItems);
                              }
                            }}
                            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                          />
                          <div>
                            <span className="text-base font-bold text-gray-900 dark:text-white block">
                              تطبيق ضريبة القيمة المضافة
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {applyVAT ? 'سيتم احتساب الضريبة على البنود الخاضعة' : 'لن يتم احتساب أي ضريبة'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${applyVAT ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {applyVAT ? 'مُفعّل' : 'مُعطّل'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    بنود الفاتورة
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة بند
                  </button>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                  <div className="col-span-3 text-xs font-medium text-gray-600 dark:text-gray-400 text-center">تفاصيل الخدمة</div>
                  <div className="col-span-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-center">سعر الوحدة</div>
                  <div className="col-span-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-center">الكمية</div>
                  <div className="col-span-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-center">نسبة الضريبة %</div>
                  <div className="col-span-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-center">الإجمالي شامل الضريبة</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2">
                      {/* Description */}
                      <div className="col-span-3">
                        <AutocompleteInput
                          value={item.description}
                          onChange={(value) => {
                            updateItem(item.id, 'description', value);
                            // Clear vatRate if description is cleared
                            if (!value) {
                              updateItem(item.id, 'vatRate', 0);
                            } else {
                              // Try to find the template and auto-fill vatRate
                              apiClient.searchInvoiceItemTemplates(value).then((results) => {
                                const template = results.find((r: any) => r.description === value);
                                if (template && template.vatRate !== undefined && applyVAT) {
                                  updateItem(item.id, 'vatRate', template.vatRate);
                                }
                              });
                            }
                          }}
                          onSearch={async (query) => {
                            const results = await apiClient.searchInvoiceItemTemplates(query);
                            return results.map((r: any) => r.description);
                          }}
                          placeholder="تفاصيل الخدمة"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="سعر الوحدة"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="1"
                          value={item.quantity || 1}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                          min="1"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>

                      {/* VAT Rate */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={applyVAT ? (item.vatRate || '') : 0}
                          onChange={(e) => updateItem(item.id, 'vatRate', parseFloat(e.target.value) || 0)}
                          disabled={!applyVAT}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Total (readonly) */}
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={item.amount.toFixed(2)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium text-center"
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="space-y-3">
                      {/* Subtotal before VAT */}
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>الإجمالي قبل الضريبة:</span>
                        <span className="font-semibold">{subtotal.toFixed(2)} ريال</span>
                      </div>

                      {/* VAT Amount */}
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>مبلغ الضريبة:</span>
                        <span className="font-semibold">{vatAmount.toFixed(2)} ريال</span>
                      </div>

                      {/* Total with VAT */}
                      <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span>الإجمالي شامل الضريبة:</span>
                        <span>{total.toFixed(2)} ريال</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingInvoice(null);
                    reset();
                    setItems([{ id: crypto.randomUUID(), description: '', unitPrice: 0, quantity: 1, vatRate: 0, amount: 0 }]);
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? (editingInvoice ? 'جاري التحديث...' : 'جاري الحفظ...') : (editingInvoice ? 'تحديث الفاتورة' : 'حفظ الفاتورة')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      <InvoiceSuccessModal
        isOpen={showSuccessModal}
        invoiceCode={createdInvoice?.code || ''}
        invoiceId={createdInvoice?.id || ''}
        onClose={() => {
          setShowSuccessModal(false);
          setCreatedInvoice(null);
        }}
        onPreview={handlePreview}
        onPrint={handlePrint}
      />
    </div>
  );
}
