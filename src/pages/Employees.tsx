import { EmployeesTab } from '@/components/payroll/EmployeesTab';

export default function Employees() {
  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          الموظفين
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة بيانات الموظفين والرواتب
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <EmployeesTab />
      </div>
    </div>
  );
}
