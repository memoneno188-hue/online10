import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { X, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Employee {
    id: string;
    name: string;
    baseSalary: number;
    allowances: number;
}

interface PayrollItem {
    tempId: string;
    employeeId: string;
    employeeName?: string;
    base: number;
    allowances: number;
    deductions: number;
}

interface PayrollRun {
    id: string;
    month: string;
    status: string;
    totalNet: number;
    items: Array<{
        id: string;
        employeeId: string;
        employee: { name: string };
        base: number;
        allowances: number;
        deductions: number;
        net: number;
    }>;
}

interface PayrollRunFormProps {
    isOpen: boolean;
    onClose: () => void;
    payrollRun?: PayrollRun | null;
    onSuccess?: () => void;
}

export default function PayrollRunForm({ isOpen, onClose, payrollRun, onSuccess }: PayrollRunFormProps) {
    const [month, setMonth] = useState('');
    const [items, setItems] = useState<PayrollItem[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadEmployees();
            initializeForm();
        }
    }, [isOpen, payrollRun]);

    const loadEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const response = await apiClient.getEmployees();
            const employeesData = response.data || response;
            const activeEmployees = Array.isArray(employeesData)
                ? employeesData.filter((emp: any) => emp.status === 'ACTIVE' && !emp.deletedAt)
                : [];
            setEmployees(activeEmployees);
        } catch (error) {
            console.error('Error loading employees:', error);
            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const initializeForm = () => {
        if (payrollRun) {
            // Edit mode
            const monthDate = new Date(payrollRun.month);
            const formattedMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
            setMonth(formattedMonth);

            const mappedItems: PayrollItem[] = payrollRun.items.map((item) => ({
                tempId: `existing-${item.id}`,
                employeeId: item.employeeId,
                employeeName: item.employee.name,
                base: typeof item.base === 'number' ? item.base : parseFloat(String(item.base)),
                allowances: typeof item.allowances === 'number' ? item.allowances : parseFloat(String(item.allowances)),
                deductions: typeof item.deductions === 'number' ? item.deductions : parseFloat(String(item.deductions)),
            }));
            setItems(mappedItems);
        } else {
            // Create mode
            const currentDate = new Date();
            const formattedMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            setMonth(formattedMonth);
            setItems([]);
        }
    };

    const handleAddAllEmployees = () => {
        if (employees.length === 0) {
            alert('لا يوجد موظفين نشطين');
            return;
        }

        const [year, monthNum] = month.split('-');
        const payrollMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);

        const usedEmployeeIds = items.map((item) => item.employeeId);
        const availableEmployees = employees.filter((emp) => {
            if (usedEmployeeIds.includes(emp.id)) return false;

            // Check hire date
            if (emp.startDate) {
                const hireDate = new Date(emp.startDate);
                if (hireDate > payrollMonth) return false;
            }

            return true;
        });

        if (availableEmployees.length === 0) {
            alert('لا يوجد موظفين متاحين للإضافة');
            return;
        }

        const newItems: PayrollItem[] = availableEmployees.map((emp) => ({
            tempId: `new-${Date.now()}-${emp.id}`,
            employeeId: emp.id,
            employeeName: emp.name,
            base: typeof emp.baseSalary === 'number'
                ? emp.baseSalary
                : parseFloat(String(emp.baseSalary)),
            allowances: typeof emp.allowances === 'number'
                ? emp.allowances
                : parseFloat(String(emp.allowances)),
            deductions: 0,
        }));

        setItems([...items, ...newItems]);
        alert(`تم إضافة ${newItems.length} موظف`);
    };

    const handleAddEmployee = () => {
        if (employees.length === 0) {
            alert('لا يوجد موظفين نشطين');
            return;
        }

        const [year, monthNum] = month.split('-');
        const payrollMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);

        const usedEmployeeIds = items.map((item) => item.employeeId);
        const availableEmployee = employees.find((emp) => {
            if (usedEmployeeIds.includes(emp.id)) return false;

            // Check hire date
            if (emp.startDate) {
                const hireDate = new Date(emp.startDate);
                if (hireDate > payrollMonth) return false;
            }

            return true;
        });

        if (!availableEmployee) {
            alert('تم إضافة جميع الموظفين المتاحين');
            return;
        }

        const newItem: PayrollItem = {
            tempId: `new-${Date.now()}`,
            employeeId: availableEmployee.id,
            employeeName: availableEmployee.name,
            base: typeof availableEmployee.baseSalary === 'number'
                ? availableEmployee.baseSalary
                : parseFloat(String(availableEmployee.baseSalary)),
            allowances: typeof availableEmployee.allowances === 'number'
                ? availableEmployee.allowances
                : parseFloat(String(availableEmployee.allowances)),
            deductions: 0,
        };

        setItems([...items, newItem]);
    };

    const handleRemoveItem = (tempId: string) => {
        setItems(items.filter((item) => item.tempId !== tempId));
    };

    const handleEmployeeChange = (tempId: string, employeeId: string) => {
        const employee = employees.find((emp) => emp.id === employeeId);
        if (!employee) return;

        setItems(
            items.map((item) =>
                item.tempId === tempId
                    ? {
                        ...item,
                        employeeId,
                        employeeName: employee.name,
                        base: typeof employee.baseSalary === 'number'
                            ? employee.baseSalary
                            : parseFloat(String(employee.baseSalary)),
                        allowances: typeof employee.allowances === 'number'
                            ? employee.allowances
                            : parseFloat(String(employee.allowances)),
                    }
                    : item
            )
        );
    };

    const handleItemChange = (tempId: string, field: 'base' | 'allowances' | 'deductions', value: string) => {
        const numValue = parseFloat(value) || 0;
        setItems(
            items.map((item) => (item.tempId === tempId ? { ...item, [field]: numValue } : item))
        );
    };

    const calculateNet = (item: PayrollItem) => {
        return item.base + item.allowances - item.deductions;
    };

    const calculateTotalNet = () => {
        return items.reduce((sum, item) => sum + calculateNet(item), 0);
    };

    const getAvailableEmployees = (currentTempId: string) => {
        const usedEmployeeIds = items
            .filter((item) => item.tempId !== currentTempId)
            .map((item) => item.employeeId);
        return employees.filter((emp) => !usedEmployeeIds.includes(emp.id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!month) {
            alert('الشهر مطلوب');
            return;
        }

        if (items.length === 0) {
            alert('يجب إضافة موظف واحد على الأقل');
            return;
        }

        // Check for duplicate employees
        const employeeIds = items.map((item) => item.employeeId);
        const uniqueEmployeeIds = new Set(employeeIds);
        if (employeeIds.length !== uniqueEmployeeIds.size) {
            alert('لا يمكن إضافة نفس الموظف أكثر من مرة');
            return;
        }

        setLoading(true);
        try {
            const [year, monthNum] = month.split('-');
            const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);

            const data = {
                month: format(monthDate, 'yyyy-MM-dd'),
                items: items.map((item) => ({
                    employeeId: item.employeeId,
                    base: item.base,
                    allowances: item.allowances,
                    deductions: item.deductions,
                })),
            };

            if (payrollRun) {
                await apiClient.updatePayrollRun(payrollRun.id, data);
                alert('تم تحديث كشف الرواتب بنجاح');
            } else {
                await apiClient.createPayrollRun(data);
                alert('تم إنشاء كشف الرواتب بنجاح');
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving payroll:', error);
            const message = error.response?.data?.message || 'حدث خطأ أثناء حفظ كشف الرواتب';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {payrollRun ? 'تعديل كشف الرواتب' : 'إنشاء كشف رواتب جديد'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Month Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            الشهر
                        </label>
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    {/* Employees Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">بنود الرواتب</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleAddAllEmployees}
                                    disabled={loadingEmployees}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4" />
                                    إضافة كل الموظفين
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddEmployee}
                                    disabled={loadingEmployees}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4" />
                                    إضافة موظف
                                </button>
                            </div>
                        </div>

                        {loadingEmployees ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                لم يتم إضافة أي موظفين بعد
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => {
                                    const availableEmployees = getAvailableEmployees(item.tempId);
                                    const net = calculateNet(item);

                                    return (
                                        <div
                                            key={item.tempId}
                                            className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Employee Selection */}
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            الموظف
                                                        </label>
                                                        <select
                                                            value={item.employeeId}
                                                            onChange={(e) => handleEmployeeChange(item.tempId, e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                                            required
                                                        >
                                                            {availableEmployees.map((emp) => (
                                                                <option key={emp.id} value={emp.id}>
                                                                    {emp.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Base Salary */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            الراتب الأساسي
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.base}
                                                            onChange={(e) => handleItemChange(item.tempId, 'base', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                                            required
                                                        />
                                                    </div>

                                                    {/* Allowances */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            البدلات
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.allowances}
                                                            onChange={(e) => handleItemChange(item.tempId, 'allowances', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                                            required
                                                        />
                                                    </div>

                                                    {/* Deductions */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            الخصومات
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.deductions}
                                                            onChange={(e) => handleItemChange(item.tempId, 'deductions', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                                            required
                                                        />
                                                    </div>

                                                    {/* Net Salary */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            صافي الراتب
                                                        </label>
                                                        <div
                                                            className={`px-3 py-2 rounded-lg border font-medium ${net < 0
                                                                ? 'bg-red-50 border-red-300 text-red-900 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
                                                                : 'bg-green-50 border-green-300 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                                                                }`}
                                                        >
                                                            {net.toFixed(2)} ريال
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.tempId)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 mt-8"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    {items.length > 0 && (
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="text-lg font-medium text-gray-900 dark:text-white">
                                إجمالي الصافي:
                            </span>
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {calculateTotalNet().toFixed(2)} ريال
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                            {payrollRun ? 'تحديث' : 'إنشاء'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
