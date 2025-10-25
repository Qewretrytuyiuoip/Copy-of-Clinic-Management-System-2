import React from 'react';
import { HomeIcon, UsersIcon, ClipboardListIcon, CurrencyDollarIcon, CalendarIcon, CogIcon, UserGroupIcon, BeakerIcon } from './components/Icons';
import { UserRole } from './types';

export const NAV_ITEMS = {
  [UserRole.Admin]: [
    { name: 'لوحة التحكم', icon: HomeIcon, page: 'dashboard' },
    { name: 'المستخدمين', icon: UsersIcon, page: 'users' },
    { name: 'المرضى', icon: UserGroupIcon, page: 'patients' },
    { name: 'المواعيد', icon: CalendarIcon, page: 'appointments' },
    { name: 'المدفوعات', icon: CurrencyDollarIcon, page: 'payments' },
    { name: 'اعدادات العلاج', icon: BeakerIcon, page: 'treatments_settings' },
    { name: 'الاحصائيات', icon: ClipboardListIcon, page: 'statistics' },
  ],
  [UserRole.SubManager]: [
    { name: 'لوحة التحكم', icon: HomeIcon, page: 'dashboard' },
    { name: 'المستخدمين', icon: UsersIcon, page: 'users' },
    { name: 'المرضى', icon: UserGroupIcon, page: 'patients' },
    { name: 'المواعيد', icon: CalendarIcon, page: 'appointments' },
    { name: 'المدفوعات', icon: CurrencyDollarIcon, page: 'payments' },
    { name: 'اعدادات العلاج', icon: BeakerIcon, page: 'treatments_settings' },
    { name: 'الاحصائيات', icon: ClipboardListIcon, page: 'statistics' },
  ],
  [UserRole.Doctor]: [
    { name: 'لوحة التحكم', icon: HomeIcon, page: 'dashboard' },
    { name: 'مرضاي', icon: UserGroupIcon, page: 'patients' },
    { name: 'جدولي', icon: CalendarIcon, page: 'schedule' },
    { name: 'الإعدادات', icon: CogIcon, page: 'settings' },
  ],
  [UserRole.Secretary]: [
    { name: 'لوحة التحكم', icon: HomeIcon, page: 'dashboard' },
    { name: 'المواعيد', icon: CalendarIcon, page: 'appointments' },
    { name: 'المرضى', icon: UserGroupIcon, page: 'patients' },
    { name: 'المدفوعات', icon: CurrencyDollarIcon, page: 'payments' },
  ],
};

export const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const ROLE_NAMES = {
  [UserRole.Admin]: 'مدير',
  [UserRole.Doctor]: 'طبيب',
  [UserRole.Secretary]: 'سكرتير',
  [UserRole.SubManager]: 'مدير فرعي',
};