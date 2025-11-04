import React from 'react';
import { appSettings } from '../appSettings';
import { WhatsappIcon, FacebookIcon, TelegramIcon } from '../components/Icons';

const ContactPage: React.FC = () => {
    const { contact } = appSettings;

    const socialLinks = [
        { name: 'واتساب', href: contact.whatsapp, icon: WhatsappIcon, color: 'bg-green-500 hover:bg-green-600' },
        { name: 'فيسبوك', href: contact.facebook, icon: FacebookIcon, color: 'bg-blue-600 hover:bg-blue-700' },
        { name: 'تلغرام', href: contact.telegram, icon: TelegramIcon, color: 'bg-sky-500 hover:bg-sky-600' }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
                    التواصل مع فريق التطوير
                </h1>

                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">قنوات التواصل</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {socialLinks.map(link => (
                            <a
                                key={link.name}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center justify-center gap-3 px-4 py-3 text-white font-semibold rounded-lg shadow-md transition-transform hover:scale-105 ${link.color}`}
                            >
                                <link.icon className="h-6 w-6" />
                                <span>{link.name}</span>
                            </a>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">ميزات إضافية يمكنك طلبها</h2>
                    <div className="space-y-4">
                        {contact.additionalFeatures.map((feature, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-gray-600">
                                <h3 className="font-bold text-lg text-primary">{feature.title}</h3>
                                <p className="mt-1 text-gray-600 dark:text-gray-300">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;