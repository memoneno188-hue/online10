# رسائل الإشعارات - مرجع شامل

## تسجيل الدخول (Login)
```typescript
// نجاح
showSuccess('مرحباً بك!', username);

// أخطاء
showError('اسم المستخدم أو كلمة المرور غير صحيحة');
showError('هذا الحساب غير نشط. يرجى التواصل مع مدير النظام');
showError('تعذر الاتصال بالخادم');
```

## إدارة المستخدمين (Users)
```typescript
// إضافة
showSuccess('تم إضافة المستخدم بنجاح');
showError('اسم المستخدم موجود مسبقاً');

// تعديل
showSuccess('تم تحديث بيانات المستخدم بنجاح');
showError('لا يمكنك تعديل صلاحيتك الخاصة');

// حذف
showConfirm('هل أنت متأكد من حذف المستخدم؟');
showSuccess('تم حذف المستخدم بنجاح');
showError('لا يمكن حذف آخر مستخدم مدير');
showError('لا يمكنك حذف حسابك الخاص');

// كلمة المرور
showSuccess('تم تغيير كلمة المرور بنجاح');
showError('كلمة المرور الحالية غير صحيحة');
showError('كلمات المرور غير متطابقة');

// الصلاحيات
showSuccess('تم تحديث الصلاحيات بنجاح');

// التفعيل/التعطيل
showSuccess('تم تفعيل المستخدم بنجاح');
showSuccess('تم تعطيل المستخدم بنجاح');
showError('لا يمكنك تعطيل حسابك الخاص');
```

## الفواتير (Invoices)
```typescript
// إضافة
showSuccess('تم إضافة الفاتورة بنجاح');
showError('حدث خطأ أثناء حفظ الفاتورة');

// تعديل
showSuccess('تم تحديث الفاتورة بنجاح');

// حذف
showConfirm('هل تريد حذف هذه الفاتورة؟');
showSuccess('تم حذف الفاتورة بنجاح');

// طباعة
showInfo('جاري تحضير الفاتورة للطباعة...');
showSuccess('تم تصدير الفاتورة بنجاح');
```

## العملاء (Customers)
```typescript
// إضافة
showSuccess('تم إضافة العميل بنجاح');
showError('رقم الهاتف موجود مسبقاً');

// تعديل
showSuccess('تم تحديث بيانات العميل بنجاح');

// حذف
showConfirm('سيتم حذف العميل نهائياً. هل أنت متأكد؟');
showSuccess('تم حذف العميل بنجاح');

// استرجاع
showSuccess('تم استرجاع العميل بنجاح');
```

## السندات (Vouchers)
```typescript
// إضافة سند قبض
showSuccess('تم إضافة سند القبض بنجاح');

// إضافة سند صرف
showSuccess('تم إضافة سند الصرف بنجاح');
showError('الرصيد غير كافٍ لإتمام العملية');

// تعديل
showSuccess('تم تحديث السند بنجاح');

// حذف
showConfirm('هل تريد حذف هذا السند؟');
showSuccess('تم حذف السند بنجاح');
```

## الوكلاء (Agents)
```typescript
// إضافة وكيل
showSuccess('تم إضافة الوكيل بنجاح');

// إضافة رحلة
showSuccess('تم إضافة الرحلة بنجاح');

// إضافة رسوم
showSuccess('تم إضافة الرسوم الإضافية بنجاح');

// تعديل
showSuccess('تم تحديث البيانات بنجاح');

// حذف
showConfirm('هل تريد حذف هذا العنصر؟');
showSuccess('تم الحذف بنجاح');
```

## الخزنة (Treasury)
```typescript
// تحديث الرصيد الافتتاحي
showSuccess('تم تحديث رصيد الخزنة بنجاح');
showError('تم تحديد الرصيد الافتتاحي مسبقاً');

// تحديث الإعدادات
showSuccess('تم تحديث إعدادات الخزنة بنجاح');

// تحذيرات
showWarning('تحذير: الرصيد أصبح سالباً');
showWarning('الرصيد المتاح غير كافٍ');
```

## البنوك (Banks)
```typescript
// إضافة بنك
showSuccess('تم إضافة البنك بنجاح');

// إضافة حساب بنكي
showSuccess('تم إضافة الحساب البنكي بنجاح');

// تعديل
showSuccess('تم تحديث الحساب البنكي بنجاح');

// حذف
showConfirm('هل تريد حذف هذا الحساب؟');
showSuccess('تم حذف الحساب بنجاح');
```

## الموظفين والرواتب (Employees & Payroll)
```typescript
// إضافة موظف
showSuccess('تم إضافة الموظف بنجاح');

// تعديل موظف
showSuccess('تم تحديث بيانات الموظف بنجاح');

// حذف موظف
showConfirm('هل تريد حذف هذا الموظف؟');
showSuccess('تم حذف الموظف بنجاح');

// إنشاء كشف رواتب
showSuccess('تم إنشاء كشف الرواتب بنجاح');

// اعتماد كشف
showConfirm('هل تريد اعتماد كشف الرواتب؟ لن يمكن التعديل بعد الاعتماد');
showSuccess('تم اعتماد كشف الرواتب بنجاح');

// حذف كشف
showConfirm('سيتم حذف كشف الرواتب نهائياً');
showSuccess('تم حذف كشف الرواتب بنجاح');
showError('لا يمكن حذف كشف معتمد');
```

## الإعدادات (Settings)
```typescript
// حفظ بيانات الشركة
showSuccess('تم حفظ بيانات الشركة بنجاح');

// حفظ إعدادات الطباعة
showSuccess('تم حفظ إعدادات الطباعة بنجاح');

// حفظ قائمة الدخل
showSuccess('تم حفظ إعدادات قائمة الدخل بنجاح');

// إضافة تصنيف مصروفات
showSuccess('تم إضافة التصنيف بنجاح');

// إضافة بند محفوظ
showSuccess('تم حفظ البند بنجاح');
```

## التقارير (Reports)
```typescript
// تحميل تقرير
showLoading('جاري تحميل التقرير...');
showSuccess('تم تحميل التقرير بنجاح');

// تصدير
showLoading('جاري تصدير التقرير...');
showSuccess('تم تصدير التقرير بنجاح');
showError('حدث خطأ أثناء تصدير التقرير');

// طباعة
showInfo('جاري تحضير التقرير للطباعة...');
```

## رسائل عامة
```typescript
// أخطاء الاتصال
showError('تعذر الاتصال بالخادم');
showError('انتهت مهلة الاتصال');

// الجلسة
showError('انتهت جلستك، يرجى تسجيل الدخول مرة أخرى');
showInfo('سيتم تسجيل خروجك بعد 5 دقائق من عدم النشاط');

// الصلاحيات
showError('ليس لديك صلاحية لإجراء هذه العملية');
showError('يتطلب هذا الإجراء صلاحيات المدير');

// البيانات
showWarning('لديك تغييرات غير محفوظة. هل تريد المتابعة؟');
showInfo('يتم حفظ التغييرات تلقائياً');

// التحميل
showLoading('جاري التحميل...');
showLoading('جاري الحفظ...');
showLoading('جاري المعالجة...');
```

## أمثلة الاستخدام

### مثال 1: عملية حفظ مع Promise
```typescript
const handleSave = async () => {
  const loadingToast = showLoading('جاري الحفظ...');
  
  try {
    await apiClient.saveData(data);
    toast.dismiss(loadingToast);
    showSuccess('تم الحفظ بنجاح');
  } catch (error) {
    toast.dismiss(loadingToast);
    showError('حدث خطأ أثناء الحفظ');
  }
};
```

### مثال 2: تأكيد الحذف
```typescript
const handleDelete = (id: string) => {
  showConfirm(
    'هل أنت متأكد من الحذف؟',
    async () => {
      try {
        await apiClient.delete(id);
        showSuccess('تم الحذف بنجاح');
        reload();
      } catch (error) {
        showError('حدث خطأ أثناء الحذف');
      }
    }
  );
};
```

### مثال 3: رسالة ترحيب
```typescript
const handleLogin = async (username: string) => {
  await login(username, password);
  showSuccess('مرحباً بك!', username);
  navigate('/dashboard');
};
```
