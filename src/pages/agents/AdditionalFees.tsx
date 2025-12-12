import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { Plus, Trash2, Save, X, Edit, Ship, FileText } from 'lucide-react';
import { format } from 'date-fns';

const feeSchema = z.object({
  agent_id: z.string().min(1, 'يجب اختيار الوكيل'),
  vessel_id: z.string().min(1, 'يجب اختيار العبارة'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  fee_type: z.string().min(1, 'نوع الرسوم مطلوب'),
  quantity: z.number().min(1, 'عدد الشاحنات يجب أن يكون أكبر من صفر').optional(),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  bill_number: z.string().optional(),
  details: z.string().optional(),
});

type FeeFormData = z.infer<typeof feeSchema>;

interface Agent {
  id: string;
  name: string;
}

interface Vessel {
  id: string;
  name: string;
}

interface AdditionalFee {
  id: string;
  agentId: string;
  vesselId?: string;
  date: string;
  feeType: string;
  quantity: number;
  amount: number;
  policyNo?: string;
  details?: string;
  agent?: { name: string };
  vessel?: { name: string };
}

export default function AdditionalFees() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [fees, setFees] = useState<AdditionalFee[]>([]);
  const [editingFee, setEditingFee] = useState<AdditionalFee | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      quantity: 1,
      amount: 0,
    },
  });

  const selectedAgentId = watch('agent_id');

  useEffect(() => {
    loadAgents();
    loadFees();
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      loadVessels(selectedAgentId);
    } else {
      setVessels([]);
      setValue('vessel_id', '');
    }
  }, [selectedAgentId]);

  const loadAgents = async () => {
    try {
      const response = await apiClient.getAgents();
      if (response.data) {
        setAgents(response.data);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadVessels = async (agentId: string) => {
    try {
      const agentData = await apiClient.getAgent(agentId);
      if (agentData.vessels && Array.isArray(agentData.vessels)) {
        // Vessels come as objects with {id, agentId, name, createdAt}
        setVessels(agentData.vessels);
      } else {
        setVessels([]);
      }
    } catch (error) {
      console.error('Error loading vessels:', error);
      setVessels([]);
    }
  };

  const loadFees = async () => {
    try {
      const response = await apiClient.getFees();
      if (response.data) {
        setFees(response.data);
      }
    } catch (error) {
      console.error('Error loading fees:', error);
    }
  };

  const onSubmit = async (data: FeeFormData) => {
    try {
      setLoading(true);

      const feeData = {
        agentId: data.agent_id,
        vesselId: data.vessel_id,
        date: data.date,
        feeType: data.fee_type,
        quantity: data.quantity,
        amount: data.amount,
        policyNo: data.bill_number || undefined,
        details: data.details || undefined,
      };

      console.log('Sending fee data:', feeData);

      if (editingFee) {
        // For update, exclude agentId (not allowed to change)
        const { agentId, ...updateData } = feeData;
        await apiClient.updateFee(editingFee.id, updateData);
        alert('تم تحديث الرسوم بنجاح');
      } else {
        await apiClient.createFee(feeData);
        alert('تم تسجيل الرسوم بنجاح');
      }

      setShowModal(false);
      setEditingFee(null);
      reset();
      loadFees();
    } catch (error: any) {
      console.error('Error saving fee:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message;
      const displayMsg = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg || error.message;
      alert(`حدث خطأ أثناء حفظ الرسوم: ${displayMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (fee: AdditionalFee) => {
    setEditingFee(fee);

    // Load vessels for the agent
    if (fee.agentId) {
      await loadVessels(fee.agentId);
    }

    reset({
      agent_id: fee.agentId || '',
      vessel_id: fee.vesselId || '',
      date: fee.date,
      fee_type: fee.feeType,
      quantity: fee.quantity || 1,
      amount: parseFloat(String(fee.amount)),
      bill_number: fee.policyNo || '',
      details: fee.details || '',
    });

    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسوم؟')) return;

    try {
      await apiClient.deleteFee(id);
      alert('تم حذف الرسوم بنجاح');
      loadFees();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الرسوم');
    }
  };

  const openNewFeeModal = () => {
    setEditingFee(null);
    reset({
      date: format(new Date(), 'yyyy-MM-dd'),
      quantity: 1,
      amount: 0,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            تسجيل رسوم إضافية
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة الرسوم الإضافية للوكلاء الملاحيين
          </p>
        </div>
        <button
          onClick={openNewFeeModal}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          تسجيل رسوم جديدة
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  الوكيل
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  التاريخ
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  العبارة
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  نوع الرسوم
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  عدد الشاحنات
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  المبلغ
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  رقم البوليصة
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {fees.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {fee.agent?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(fee.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4" />
                      {fee.vessel?.name || 'غير محدد'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {fee.feeType}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {fee.quantity || 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {parseFloat(String(fee.amount || 0)).toFixed(2)} ريال
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {fee.policyNo ? (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {fee.policyNo}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(fee)}
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(fee.id)}
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
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingFee ? 'تعديل رسوم إضافية' : 'تسجيل رسوم إضافية جديدة'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الوكيل <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('agent_id')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">اختر الوكيل</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  {errors.agent_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.agent_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    التاريخ
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اسم العبارة
                </label>
                <select
                  {...register('vessel_id')}
                  disabled={!selectedAgentId}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">اختر العبارة</option>
                  {vessels.map((vessel) => (
                    <option key={vessel.id} value={vessel.id}>
                      {vessel.name}
                    </option>
                  ))}
                </select>
                {errors.vessel_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.vessel_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع الرسوم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('fee_type')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.fee_type && (
                    <p className="text-red-500 text-sm mt-1">{errors.fee_type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    عدد الشاحنات
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('quantity', { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  المبلغ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  رقم البوليصة
                </label>
                <input
                  type="text"
                  {...register('bill_number')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  التفاصيل (اختياري)
                </label>
                <textarea
                  {...register('details')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'جاري الحفظ...' : editingFee ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
