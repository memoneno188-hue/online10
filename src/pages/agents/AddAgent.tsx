import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import { Plus, Trash2, Save, X, Edit, Ship } from 'lucide-react';

const agentSchema = z.object({
  name: z.string().min(1, 'اسم الوكيل مطلوب'),
  opening_balance: z.number().min(0, 'الرصيد الافتتاحي يجب أن يكون أكبر من أو يساوي صفر'),
  opening_side: z.enum(['debit', 'credit'], { required_error: 'يجب تحديد نوع الرصيد' }),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface Vessel {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
  openingBalance: number;
  openingSide: string;
  currentBalance: number;
  vessel_count?: number;
  vessels?: string[];
}

export default function AddAgent() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([{ id: crypto.randomUUID(), name: '' }]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      opening_balance: 0,
      opening_side: 'debit',
    },
  });

  useEffect(() => {
    loadAgents();
  }, []);

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

  const addVessel = () => {
    setVessels([...vessels, { id: crypto.randomUUID(), name: '' }]);
  };

  const removeVessel = (id: string) => {
    if (vessels.length > 1) {
      setVessels(vessels.filter((v) => v.id !== id));
    }
  };

  const updateVessel = (id: string, name: string) => {
    setVessels(vessels.map((v) => (v.id === id ? { ...v, name } : v)));
  };

  const onSubmit = async (data: AgentFormData) => {
    try {
      setLoading(true);

      const validVessels = vessels.filter((v) => v.name.trim()).map((v) => v.name);

      const agentData = {
        name: data.name,
        openingBalance: data.opening_balance,
        openingSide: data.opening_side.toUpperCase(),
        vessels: validVessels,
      };

      console.log('Sending agent data:', agentData);

      if (editingAgent) {
        await apiClient.updateAgent(editingAgent.id, agentData);
        alert('تم تحديث الوكيل بنجاح');
      } else {
        await apiClient.createAgent(agentData);
        alert('تم إضافة الوكيل بنجاح');
      }

      setShowModal(false);
      setEditingAgent(null);
      reset();
      setVessels([{ id: crypto.randomUUID(), name: '' }]);
      loadAgents();
    } catch (error: any) {
      console.error('Error saving agent:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message;
      const displayMsg = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg || error.message;
      alert(`حدث خطأ أثناء حفظ الوكيل: ${displayMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (agent: Agent) => {
    try {
      const agentData = await apiClient.getAgent(agent.id);

      setEditingAgent(agent);
      reset({
        name: agent.name,
        opening_balance: agent.openingBalance,
        opening_side: (agent.openingSide?.toLowerCase() || 'debit') as 'debit' | 'credit',
      });

      if (agentData.vessels && agentData.vessels.length > 0) {
        // Convert vessel objects to the format expected by the form
        setVessels(agentData.vessels.map((vessel: any) => ({
          id: vessel.id || crypto.randomUUID(),
          name: vessel.name || vessel
        })));
      } else {
        setVessels([{ id: crypto.randomUUID(), name: '' }]);
      }

      setShowModal(true);
    } catch (error) {
      console.error('Error loading agent:', error);
      alert('حدث خطأ أثناء تحميل بيانات الوكيل');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الوكيل؟')) return;

    try {
      await apiClient.deleteAgent(id);
      alert('تم حذف الوكيل بنجاح');
      loadAgents();
    } catch (error: any) {
      const message = error.response?.data?.message || 'حدث خطأ أثناء حذف الوكيل';
      alert(message);
    }
  };

  const openNewAgentModal = () => {
    setEditingAgent(null);
    reset({
      opening_balance: 0,
      opening_side: 'debit',
    });
    setVessels([{ id: crypto.randomUUID(), name: '' }]);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            الوكلاء الملاحيين
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة الوكلاء الملاحيين والعبارات
          </p>
        </div>
        <button
          onClick={openNewAgentModal}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة وكيل جديد
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  اسم الوكيل
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  عدد العبارات
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  الرصيد الافتتاحي
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  نوع الرصيد
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {agent.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4" />
                      {agent.vessels?.length || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {parseFloat(String(agent.openingBalance || 0)).toFixed(2)} ريال
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${agent.openingSide === 'DEBIT'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                    >
                      {agent.openingSide === 'DEBIT' ? 'مدين' : 'دائن'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(agent)}
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
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
                {editingAgent ? 'تعديل وكيل ملاحي' : 'إضافة وكيل ملاحي جديد'}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اسم الوكيل
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    أسماء العبارات
                  </label>
                  <button
                    type="button"
                    onClick={addVessel}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة عبارة
                  </button>
                </div>

                <div className="space-y-2">
                  {vessels.map((vessel) => (
                    <div key={vessel.id} className="flex gap-2">
                      <input
                        type="text"
                        value={vessel.name}
                        onChange={(e) => updateVessel(vessel.id, e.target.value)}
                        placeholder="اسم العبارة"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeVessel(vessel.id)}
                        disabled={vessels.length === 1}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الرصيد الافتتاحي
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('opening_balance', { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.opening_balance && (
                    <p className="text-red-500 text-sm mt-1">{errors.opening_balance.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع الرصيد
                  </label>
                  <select
                    {...register('opening_side')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="debit">مدين</option>
                    <option value="credit">دائن</option>
                  </select>
                  {errors.opening_side && (
                    <p className="text-red-500 text-sm mt-1">{errors.opening_side.message}</p>
                  )}
                </div>
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
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'جاري الحفظ...' : editingAgent ? 'تحديث' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
