import React from 'react';
import { HomeIcon, UsersIcon, ClipboardListIcon, CurrencyDollarIcon, CalendarIcon, UserGroupIcon, BeakerIcon, UserCircleIcon, ChatBubbleIcon, OfficeBuildingIcon } from './components/Icons';
import { UserRole } from './types';

export const NAV_ITEMS = {
  [UserRole.Admin]: [
    { name: 'الملف الشخصي', icon: UserCircleIcon, page: 'profile' },
    { name: 'المركز', icon: OfficeBuildingIcon, page: 'center' },
    { name: 'لوحة التحكم', icon: HomeIcon, page: 'dashboard' },
    { name: 'المستخدمين', icon: UsersIcon, page: 'users' },
    { name: 'المرضى', icon: UserGroupIcon, page: 'patients' },
    { name: 'المواعيد', icon: CalendarIcon, page: 'appointments' },
    { name: 'المدفوعات', icon: CurrencyDollarIcon, page: 'payments' },
    { name: 'الاحصائيات', icon: ClipboardListIcon, page: 'statistics' },
    { name: 'الدعم', icon: ChatBubbleIcon, page: 'contact' },
  ],
  [UserRole.SubManager]: [
    { name: 'الملف الشخصي', icon: UserCircleIcon, page: 'profile' },
    { name: 'لوحة التحكم', icon: HomeIcon, page: 'dashboard' },
    { name: 'المستخدمين', icon: UsersIcon, page: 'users' },
    { name: 'المرضى', icon: UserGroupIcon, page: 'patients' },
    { name: 'المواعيد', icon: CalendarIcon, page: 'appointments' },
    { name: 'المدفوعات', icon: CurrencyDollarIcon, page: 'payments' },
    { name: 'الاحصائيات', icon: ClipboardListIcon, page: 'statistics' },
    { name: 'الدعم', icon: ChatBubbleIcon, page: 'contact' },
  ],
  [UserRole.Doctor]: [
    { name: 'الملف الشخصي', icon: UserCircleIcon, page: 'profile' },
    { name: 'لوحة التحكم', icon: HomeIcon, page: 'dashboard' },
    { name: 'مرضاي', icon: UserGroupIcon, page: 'patients' },
    { name: 'المدفوعات', icon: CurrencyDollarIcon, page: 'payments' },
    { name: 'الدعم', icon: ChatBubbleIcon, page: 'contact' },
  ],
  [UserRole.Secretary]: [
    { name: 'الملف الشخصي', icon: UserCircleIcon, page: 'profile' },
    { name: 'لوحة التحكم', icon: HomeIcon, page: 'dashboard' },
    { name: 'المرضى', icon: UserGroupIcon, page: 'patients' },
    { name: 'المدفوعات', icon: CurrencyDollarIcon, page: 'payments' },
    { name: 'الدعم', icon: ChatBubbleIcon, page: 'contact' },
  ],
};

export const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const ROLE_NAMES = {
  [UserRole.Admin]: 'مدير',
  [UserRole.Doctor]: 'طبيب',
  [UserRole.Secretary]: 'سكرتير',
  [UserRole.SubManager]: 'مدير فرعي',
};