import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { SCREENS_BY_CATEGORY } from '@/config/screens';
import { X, Save } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';

interface User {
    id: string;
    username: string;
}

interface Permission {
    screen: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

interface PermissionsModalProps {
    user: User;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PermissionsModal({ user, onClose, onSuccess }: PermissionsModalProps) {
    const [permissions, setPermissions] = useState<Record<string, Permission>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getUserPermissions(user.id);

            // Convert array to object for easier manipulation
            const permissionsMap: Record<string, Permission> = {};
            data.permissions.forEach((p: Permission) => {
                permissionsMap[p.screen] = p;
            });
            setPermissions(permissionsMap);
        } catch (error) {
            console.error('Error loading permissions:', error);
            showError('حدث خطأ أثناء تحميل الصلاحيات');
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (screenId: string, field: keyof Omit<Permission, 'screen'>) => {
        setPermissions(prev => ({
            ...prev,
            [screenId]: {
                screen: screenId,
                canView: prev[screenId]?.canView || false,
                canCreate: prev[screenId]?.canCreate || false,
                canEdit: prev[screenId]?.canEdit || false,
                canDelete: prev[screenId]?.canDelete || false,
                ...prev[screenId],
                [field]: !prev[screenId]?.[field],
            },
        }));
    };

    const toggleScreen = (screenId: string) => {
        const current = permissions[screenId];
        if (current?.canView) {
            // Remove all permissions
            const newPerms = { ...permissions };
            delete newPerms[screenId];
            setPermissions(newPerms);
        } else {
            // Add view permission
            setPermissions(prev => ({
                ...prev,
                [screenId]: {
                    screen: screenId,
                    canView: true,
                    canCreate: false,
                    canEdit: false,
                    canDelete: false,
                },
            }));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const permissionsArray = Object.values(permissions).filter(p => p.canView);

            await apiClient.updateUserPermissions(user.id, {
                permissions: permissionsArray,
            });

            showSuccess('تم تحديث الصلاحيات بنجاح');
            onSuccess();
        } catch (error: any) {
            const message = error.response?.data?.message || 'حدث خطأ أثناء حفظ الصلاحيات';
            showError(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        صلاحيات المستخدم - {user.username}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(SCREENS_BY_CATEGORY).map(([categoryId, category]) => (
                                <div key={categoryId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{category.name}</h4>
                                    </div>
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {category.screens.map((screen) => {
                                            const perm = permissions[screen.id];
                                            const hasAccess = perm?.canView;

                                            return (
                                                <div key={screen.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <div className="flex items-center gap-4">
                                                        {/* Screen Name with Checkbox */}
                                                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={hasAccess || false}
                                                                onChange={() => toggleScreen(screen.id)}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                                            />
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {screen.name}
                                                            </span>
                                                        </label>

                                                        {/* CRUD Permissions */}
                                                        {hasAccess && (
                                                            <div className="flex items-center gap-4">
                                                                <label className="flex items-center gap-1 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={perm.canView}
                                                                        disabled
                                                                        className="w-3 h-3 text-green-600 border-gray-300 rounded"
                                                                    />
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">عرض</span>
                                                                </label>

                                                                <label className="flex items-center gap-1 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={perm.canCreate || false}
                                                                        onChange={() => togglePermission(screen.id, 'canCreate')}
                                                                        className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                                                                    />
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">إضافة</span>
                                                                </label>

                                                                <label className="flex items-center gap-1 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={perm.canEdit || false}
                                                                        onChange={() => togglePermission(screen.id, 'canEdit')}
                                                                        className="w-3 h-3 text-yellow-600 border-gray-300 rounded"
                                                                    />
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">تعديل</span>
                                                                </label>

                                                                <label className="flex items-center gap-1 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={perm.canDelete || false}
                                                                        onChange={() => togglePermission(screen.id, 'canDelete')}
                                                                        className="w-3 h-3 text-red-600 border-gray-300 rounded"
                                                                    />
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">حذف</span>
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
}
