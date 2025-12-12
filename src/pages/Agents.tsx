import { Link } from 'react-router-dom';
import { UserPlus, Ship, DollarSign } from 'lucide-react';

export default function Agents() {
  const cards = [
    {
      title: 'إضافة وكيل ملاحي',
      description: 'إدارة الوكلاء الملاحيين والعبارات',
      icon: UserPlus,
      color: 'blue',
      path: '/agents/add',
    },
    {
      title: 'تسجيل رحلة',
      description: 'تسجيل رحلات جديدة للوكلاء',
      icon: Ship,
      color: 'teal',
      path: '/agents/trips',
    },
    {
      title: 'تسجيل رسوم إضافية',
      description: 'إضافة رسوم إضافية للرحلات',
      icon: DollarSign,
      color: 'orange',
      path: '/agents/fees',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          الوكلاء الملاحيين
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          إدارة الوكلاء الملاحيين والرحلات والرسوم
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30',
            teal: 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/30',
            orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30',
          }[card.color];

          return (
            <Link
              key={card.path}
              to={card.path}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all"
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${colorClasses}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {card.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
