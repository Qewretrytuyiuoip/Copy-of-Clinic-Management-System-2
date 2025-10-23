import React, { useState, useRef } from 'react';
import { useAppSettings } from '../hooks/useAppSettings';
import { PhotographIcon } from '../components/Icons';

const ApplicationSettingsPage: React.FC = () => {
    const { settings, setAppName, setAppLogo } = useAppSettings();
    
    const [nameInput, setNameInput] = useState(settings.appName);
    const [logoPreview, setLogoPreview] = useState<string | null>(settings.appLogo);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [nameFeedback, setNameFeedback] = useState('');
    const [logoFeedback, setLogoFeedback] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNameSave = (e: React.FormEvent) => {
        e.preventDefault();
        setAppName(nameInput);
        setNameFeedback('تم حفظ اسم التطبيق بنجاح!');
        setTimeout(() => setNameFeedback(''), 3000);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
                setLogoFile(file); 
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoSave = (e: React.FormEvent) => {
        e.preventDefault();
        setAppLogo(logoPreview);
        setLogoFeedback('تم حفظ شعار التطبيق بنجاح!');
        setTimeout(() => setLogoFeedback(''), 3000);
    };
    
    const handleRemoveLogo = () => {
        setLogoPreview(null);
        setLogoFile(null);
        setAppLogo(null);
        setLogoFeedback('تمت إزالة الشعار.');
        setTimeout(() => setLogoFeedback(''), 3000);
    };

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">إعدادات التطبيق</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* App Name Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">اسم التطبيق</h2>
                    <form onSubmit={handleNameSave} className="space-y-4">
                        <div>
                            <label htmlFor="appName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                سيظهر هذا الاسم في الشريط الجانبي وصفحة تسجيل الدخول.
                            </label>
                            <input
                                type="text"
                                id="appName"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-black dark:text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-colors"
                            >
                                حفظ الاسم
                            </button>
                            {nameFeedback && <p className="text-sm text-green-600 dark:text-green-400">{nameFeedback}</p>}
                        </div>
                    </form>
                </div>

                {/* App Logo Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                     <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">شعار التطبيق</h2>
                     <form onSubmit={handleLogoSave} className="space-y-4">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleLogoChange}
                            className="hidden"
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex justify-center items-center cursor-pointer hover:border-primary transition-colors bg-gray-50 dark:bg-gray-700"
                        >
                            {logoPreview ? (
                                <img src={logoPreview} alt="معاينة الشعار" className="max-h-full max-w-full object-contain p-2" />
                            ) : (
                                <div className="text-center text-gray-500 dark:text-gray-400">
                                    <PhotographIcon className="h-12 w-12 mx-auto" />
                                    <p>انقر لرفع شعار</p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                           <div className="flex items-center gap-2">
                             <button
                                type="submit"
                                disabled={!logoPreview}
                                className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                حفظ الشعار
                            </button>
                             {logoPreview && (
                                 <button
                                    type="button"
                                    onClick={handleRemoveLogo}
                                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
                                >
                                    إزالة
                                </button>
                             )}
                           </div>
                           {logoFeedback && <p className="text-sm text-green-600 dark:text-green-400">{logoFeedback}</p>}
                        </div>
                     </form>
                </div>
            </div>
        </div>
    );
};

export default ApplicationSettingsPage;
