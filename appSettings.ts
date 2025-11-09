// This file contains the base domain for the API.
// Change the value here to point the application to a different backend server.
export const API_BASE_URL = 'https://lok.alwaysdata.net/clinickeyapi/public/';

export const appSettings = {
    appName: 'Sara dental clinic',
    appLogo: '/assets/logo.png',
    appVersion: '1.0.0',
    contact: {
        whatsapp: 'https://wa.me/963933333333',
        facebook: 'https://www.facebook.com/sara.clinic.sy',
        telegram: 'https://t.me/sara_clinic_sy',
        additionalFeatures: [
            { 
                title: 'نظام الحجز عبر الإنترنت', 
                description: 'يمكن للمرضى حجز مواعيدهم بسهولة عبر الإنترنت من خلال بوابة مخصصة، مما يقلل العبء على موظفي الاستقبال.' 
            },
            { 
                title: 'تنبيهات تلقائية للمواعيد', 
                description: 'إرسال رسائل تذكير تلقائية للمرضى عبر الرسائل القصيرة أو واتساب قبل مواعيدهم لتقليل حالات عدم الحضور.' 
            },
            {
                title: 'ملفات تعريف مخصصة للمرضى',
                description: 'إمكانية إضافة حقول مخصصة لملفات المرضى لتسجيل معلومات إضافية تتناسب مع احتياجات عيادتك الخاصة.'
            },
             {
                title: 'ملفات تعريف مخصصة للمرضى',
                description: 'إمكانية إضافة حقول مخصصة لملفات المرضى لتسجيل معلومات إضافية تتناسب مع احتياجات عيادتك الخاصة.'
            }
        ]
    }
};