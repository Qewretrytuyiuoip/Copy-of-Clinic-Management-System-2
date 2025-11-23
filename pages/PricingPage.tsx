import React from 'react';
import { CheckIcon } from '../components/Icons';

interface PricingPlan {
    name: string;
    price: string;
    period: string;
    features: string[];
    recommended?: boolean;
    color: string;
}

const plans: PricingPlan[] = [
    {
        name: 'الخطة الأساسية',
        price: '$9',
        period: 'شهرياً',
        features: [
            'إدارة عدد محدود من المرضى',
            'نظام الحجز الأساسي',
            'دعم فني عبر البريد'
        ],
        color: 'bg-white dark:bg-slate-800',
    },
    {
        name: 'الخطة القياسية',
        price: '$29',
        period: 'شهرياً',
        features: [
            'إدارة مرضى غير محدودة',
            'نظام الحجز المتقدم',
            'تقارير مالية أساسية',
            'تخصيص وصفات طبية'
        ],
        color: 'bg-white dark:bg-slate-800',
    },
    {
        name: 'الخطة الاحترافية',
        price: '$59',
        period: 'شهرياً',
        features: [
            'جميع ميزات الخطة القياسية',
            'إدارة المخزون المتقدمة',
            'دعم فني 24/7',
            'تحليلات ورسوم بيانية',
            'نسخ احتياطي يومي'
        ],
        recommended: true,
        color: 'bg-gradient-to-b from-primary-600 to-primary-800 text-white',
    },
    {
        name: 'خطة الشركات',
        price: '$99',
        period: 'شهرياً',
        features: [
            'حلول مخصصة بالكامل',
            'ربط مع أنظمة خارجية',
            'مدير حساب مخصص',
            'تدريب للموظفين',
            'سيرفر خاص'
        ],
        color: 'bg-white dark:bg-slate-800',
    }
];

const PricingPage: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                    خطط الاشتراك
                </h1>
                <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                    اختر الخطة المناسبة لاحتياجات عيادتك
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {plans.map((plan, index) => (
                    <div 
                        key={index}
                        className={`relative rounded-2xl shadow-xl flex flex-col justify-between p-8 transition-transform duration-300 hover:-translate-y-2 ${plan.color} ${plan.recommended ? 'ring-4 ring-primary-300 dark:ring-primary-900 scale-105 z-10' : 'border border-gray-200 dark:border-gray-700'}`}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <span className="bg-yellow-400 text-gray-900 text-sm font-bold px-3 py-1 rounded-full shadow-md">
                                    الأكثر طلباً
                                </span>
                            </div>
                        )}

                        <div>
                            <h3 className={`text-xl font-bold ${plan.recommended ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                {plan.name}
                            </h3>
                            <div className="mt-4 flex items-baseline text-gray-900 dark:text-white">
                                <span className={`text-4xl font-extrabold tracking-tight ${plan.recommended ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {plan.price}
                                </span>
                                <span className={`mr-1 text-xl font-medium ${plan.recommended ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                    / {plan.period}
                                </span>
                            </div>
                            <ul className="mt-6 space-y-4">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-start">
                                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${plan.recommended ? 'bg-white/20' : 'bg-green-100 dark:bg-green-900/30'}`}>
                                            <CheckIcon className={`w-3 h-3 ${plan.recommended ? 'text-white' : 'text-green-600 dark:text-green-400'}`} />
                                        </div>
                                        <p className={`mr-3 text-sm ${plan.recommended ? 'text-primary-100' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {feature}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-8">
                            <button
                                className={`w-full block text-center rounded-lg px-6 py-3 text-base font-medium transition-colors duration-200 ${
                                    plan.recommended
                                        ? 'bg-white text-primary-700 hover:bg-gray-50'
                                        : 'bg-primary-600 text-white hover:bg-primary-700'
                                }`}
                            >
                                اختر الخطة
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PricingPage;