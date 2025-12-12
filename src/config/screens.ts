// Available screens/modules for permission management
export const AVAILABLE_SCREENS = {
    // Invoices
    INVOICES_IMPORT: {
        id: 'invoices_import',
        name: 'فواتير الاستيراد',
        category: 'invoices',
        categoryName: 'الفواتير',
    },
    INVOICES_EXPORT: {
        id: 'invoices_export',
        name: 'فواتير التصدير',
        category: 'invoices',
        categoryName: 'الفواتير',
    },
    INVOICES_TRANSIT: {
        id: 'invoices_transit',
        name: 'فواتير الترانزيت',
        category: 'invoices',
        categoryName: 'الفواتير',
    },
    INVOICES_FREE: {
        id: 'invoices_free',
        name: 'فواتير حرة',
        category: 'invoices',
        categoryName: 'الفواتير',
    },

    // Customers
    CUSTOMERS: {
        id: 'customers',
        name: 'العملاء',
        category: 'accounts',
        categoryName: 'الحسابات',
    },

    // Agents & Vessels
    AGENTS: {
        id: 'agents',
        name: 'الوكلاء',
        category: 'agents',
        categoryName: 'الوكلاء والسفن',
    },
    VESSELS: {
        id: 'vessels',
        name: 'السفن',
        category: 'agents',
        categoryName: 'الوكلاء والسفن',
    },
    TRIPS: {
        id: 'trips',
        name: 'الرحلات',
        category: 'agents',
        categoryName: 'الوكلاء والسفن',
    },
    FEES: {
        id: 'fees',
        name: 'الرسوم الإضافية',
        category: 'agents',
        categoryName: 'الوكلاء والسفن',
    },

    // Vouchers
    VOUCHERS_RECEIPT: {
        id: 'vouchers_receipt',
        name: 'سندات القبض',
        category: 'vouchers',
        categoryName: 'السندات',
    },
    VOUCHERS_PAYMENT: {
        id: 'vouchers_payment',
        name: 'سندات الصرف',
        category: 'vouchers',
        categoryName: 'السندات',
    },

    // Treasury & Banks
    TREASURY: {
        id: 'treasury',
        name: 'الخزنة',
        category: 'finance',
        categoryName: 'المالية',
    },
    BANKS: {
        id: 'banks',
        name: 'البنوك',
        category: 'finance',
        categoryName: 'المالية',
    },
    BANK_ACCOUNTS: {
        id: 'bank_accounts',
        name: 'الحسابات البنكية',
        category: 'finance',
        categoryName: 'المالية',
    },

    // Payroll
    EMPLOYEES: {
        id: 'employees',
        name: 'الموظفين',
        category: 'payroll',
        categoryName: 'الرواتب',
    },
    PAYROLL: {
        id: 'payroll',
        name: 'الرواتب',
        category: 'payroll',
        categoryName: 'الرواتب',
    },

    // Reports
    REPORTS_FINANCIAL: {
        id: 'reports_financial',
        name: 'التقارير المالية',
        category: 'reports',
        categoryName: 'التقارير',
    },
    REPORTS_CUSTOMS: {
        id: 'reports_customs',
        name: 'التقارير الجمركية',
        category: 'reports',
        categoryName: 'التقارير',
    },
    REPORTS_AGENTS: {
        id: 'reports_agents',
        name: 'تقارير الوكلاء',
        category: 'reports',
        categoryName: 'التقارير',
    },

    // Settings
    SETTINGS: {
        id: 'settings',
        name: 'الإعدادات',
        category: 'settings',
        categoryName: 'الإعدادات',
    },
};

// Group screens by category
export const SCREENS_BY_CATEGORY = Object.values(AVAILABLE_SCREENS).reduce((acc, screen) => {
    if (!acc[screen.category]) {
        acc[screen.category] = {
            name: screen.categoryName,
            screens: [],
        };
    }
    acc[screen.category].screens.push(screen);
    return acc;
}, {} as Record<string, { name: string; screens: typeof AVAILABLE_SCREENS[keyof typeof AVAILABLE_SCREENS][] }>);
