import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { Plus, Trash2, Save, X, Edit, Ship } from 'lucide-react';
import { format } from 'date-fns';

const tripSchema = z.object({
  agent_id: z.string().min(1, 'يجب اختيار الوكيل'),
  vessel_id: z.string().min(1, 'يجب اختيار العبارة'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  delivery_orders_count: z.number().min(1, 'عدد الشاحنات يجب أن يكون أكبر من صفر'),
  unit_price: z.number().min(0.01, 'سعر الوحدة يجب أن يكون أكبر من صفر'),
  notes: z.string().optional(),
});

type TripFormData = z.infer<typeof tripSchema>;

interface Agent {
  id: string;
  name: string;
}

interface Vessel {
  id: string;
  name: string;
}

interface Trip {
  id: string;
  agentId: string;
  vesselId?: string;
  date: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  notes?: string;
  agent?: { name: string };
  vessel?: { name: string };
}

export default function NewTrip() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      delivery_orders_count: 1,
      unit_price: 0,
    },
  });

  const selectedAgentId = watch('agent_id');
  const deliveryOrdersCount = watch('delivery_orders_count');
  const unitPrice = watch('unit_price');
  const totalAmount = (deliveryOrdersCount || 0) * (unitPrice || 0);

  useEffect(() => {
    loadAgents();
    loadTrips();
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
      console.log('Agents response:', response);
      if (response.data) {
        setAgents(response.data);
      } else if (Array.isArray(response)) {
        setAgents(response);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadVessels = async (agentId: string) => {
    try {
      const agentData = await apiClient.getAgent(agentId);
      console.log('Agent data for vessels:', agentData);
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

  const loadTrips = async () => {
    try {
      const response = await apiClient.getTrips();
      console.log('Trips response:', response);
      if (response.data) {
        setTrips(response.data);
      } else if (Array.isArray(response)) {
        setTrips(response);
      } else {
        setTrips([]);
      }
    } catch (error: any) {
      console.error('Error loading trips:', error);
      // If 404, just set empty array
      if (error.response?.status === 404) {
        setTrips([]);
      }
    }
  };

  const onSubmit = async (data: TripFormData) => {
    try {
      setLoading(true);

      const tripData = {
        agentId: data.agent_id,
        vesselId: data.vessel_id,
        date: data.date,
        quantity: data.delivery_orders_count,
        unitPrice: data.unit_price,
        notes: data.notes || undefined,
      };

      console.log('Sending trip data:', tripData);

      if (editingTrip) {
        // For update, exclude agentId (not allowed to change)
        const { agentId, ...updateData } = tripData;
        await apiClient.updateTrip(editingTrip.id, updateData);
        alert('تم تحديث الرحلة بنجاح');
      } else {
        await apiClient.createTrip(tripData);
        alert('تم تسجيل الرحلة بنجاح');
      }

      setShowModal(false);
      setEditingTrip(null);
      reset();
      loadTrips();
    } catch (error: any) {
      console.error('Error saving trip:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message;
      const displayMsg = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg || error.message;
      alert(`حدث خطأ أثناء حفظ الرحلة: ${displayMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (trip: Trip) => {
    setEditingTrip(trip);

    // Load vessels for the agent
    if (trip.agentId) {
      await loadVessels(trip.agentId);
    }

    reset({
      agent_id: trip.agentId || '',
      vessel_id: trip.vesselId || '',
      date: trip.date,
      delivery_orders_count: trip.quantity,
      unit_price: parseFloat(String(trip.unitPrice)),
      notes: trip.notes || '',
    });

    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرحلة؟')) return;

    try {
      await apiClient.deleteTrip(id);
      alert('تم حذف الرحلة بنجاح');
      loadTrips();
    } catch (error) {
      alert('حدث خطأ أثناء حذف الرحلة');
    }
  };

  const openNewTripModal = () => {
    setEditingTrip(null);
    reset({
      date: format(new Date(), 'yyyy-MM-dd'),
      delivery_orders_count: 1,
      unit_price: 0,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            تسجيل رحلة جديدة
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة رحلات الوكلاء الملاحيين
          </p>
        </div>
        <button
          onClick={openNewTripModal}
          className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          تسجيل رحلة جديدة
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
                  عدد الشاحنات
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  المبلغ الإجمالي
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {trip.agent?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(trip.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4" />
                      {trip.vessel?.name || 'غير محدد'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {trip.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {parseFloat(String(trip.totalAmount || 0)).toFixed(2)} ريال
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(trip)}
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(trip.id)}
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
                {editingTrip ? 'تعديل رحلة' : 'تسجيل رحلة جديدة'}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اسم العبارة <span className="text-red-500">*</span>
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
                    عدد الشاحنات / اذون التسليم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('delivery_orders_count', { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.delivery_orders_count && (
                    <p className="text-red-500 text-sm mt-1">{errors.delivery_orders_count.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    سعر الوحدة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register('unit_price', { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.unit_price && (
                    <p className="text-red-500 text-sm mt-1">{errors.unit_price.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  المبلغ الإجمالي
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-lg font-bold text-gray-900 dark:text-white">
                  {totalAmount.toFixed(2)} ريال
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ملاحظات
                </label>
                <textarea
                  {...register('notes')}
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
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'جاري الحفظ...' : editingTrip ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
