import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppSettings } from '../hooks/useAppSettings';
import { EyeIcon, EyeSlashIcon, ArrowDownOnSquareIcon, WhatsappIcon, FacebookIcon, TelegramIcon, XIcon } from '../components/Icons';
import { ApiError } from '../services/api';
import { UserRole } from '../types';
import { appSettings } from '../appSettings';

const SubscriptionExpiredModal: React.FC<{
    role: UserRole;
    onClose: () => void;
}> = ({ role, onClose }) => {
    // FIX: Replaced useAppSettings with static appSettings import for contact info.
    // The `settings` from useAppSettings is for dynamic settings (appName, appLogo)
    // and does not contain the static contact details.

    const isManager = role === UserRole.Admin || role === UserRole.SubManager;
    const title = "انتهاء الاشتراك";
    const message = isManager
        ? "يرجى تجديد الاشتراك للاستمرار في استخدام النظام."
        : "انتهت مدة الاشتراك. الرجاء التواصل مع مدير المركز لتفعيل الحساب.";

    const socialLinks = [
        { name: 'واتساب', href: appSettings.contact.whatsapp, icon: WhatsappIcon, color: 'bg-green-500 hover:bg-green-600' },
        { name: 'فيسبوك', href: appSettings.contact.facebook, icon: FacebookIcon, color: 'bg-blue-600 hover:bg-blue-700' },
        { name: 'تلغرام', href: appSettings.contact.telegram, icon: TelegramIcon, color: 'bg-sky-500 hover:bg-sky-600' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all" role="dialog" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="إغلاق"><XIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <div className="p-6">
                    <p className="text-md text-gray-600 dark:text-gray-300 text-center">{message}</p>
                    {isManager && (
                        <div className="mt-6">
                            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 text-center">قنوات التواصل مع فريق الدعم</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {socialLinks.map(link => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 text-white font-semibold rounded-lg shadow-md transition-transform hover:scale-105 ${link.color}`}
                                    >
                                        <link.icon className="h-5 w-5" />
                                        <span>{link.name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl flex justify-end">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-6 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};


const LoginPage: React.FC = () => {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, register } = useAuth();
    const { settings } = useAppSettings();
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [subscriptionError, setSubscriptionError] = useState<{ role: UserRole } | null>(null);

    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        const savedPassword = localStorage.getItem('rememberedPassword');
        if (savedEmail && savedPassword) {
            setEmail(savedEmail);
            setPassword(savedPassword);
            setRememberMe(true);
        }
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        window.addEventListener('appinstalled', () => {
            setIsInstallable(false);
            setInstallPrompt(null);
            console.log('PWA was installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', () => {});
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) {
            return;
        }
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted' || outcome === 'dismissed') {
            setIsInstallable(false);
            setInstallPrompt(null);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubscriptionError(null);
        
        const maliciousPattern = /[<>;]|--/;
        if (maliciousPattern.test(email) || maliciousPattern.test(password)) {
            setError('تم اكتشاف أحرف غير صالحة. يرجى إزالتها والمحاولة مرة أخرى.');
            return;
        }
        
        setLoading(true);
        try {
            const user = await login(email, password);
            if (!user) {
                setError('البريد الإلكتروني أو كلمة المرور غير صالحة.');
            } else {
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                    localStorage.setItem('rememberedPassword', password);
                } else {
                    localStorage.removeItem('rememberedEmail');
                    localStorage.removeItem('rememberedPassword');
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'SubscriptionExpiredError') {
                setSubscriptionError({ role: (err as any).role });
            } else {
                setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const maliciousPattern = /[<>;]|--/;
        if (maliciousPattern.test(name) || maliciousPattern.test(email) || maliciousPattern.test(password)) {
            setError('تم اكتشاف أحرف غير صالحة. يرجى إزالتها والمحاولة مرة أخرى.');
            return;
        }

        if (password.length < 6) {
            setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
            return;
        }

        setLoading(true);
        try {
            const user = await register(name, email, password);
            if (!user) {
                 setError('فشل إنشاء الحساب. قد يكون البريد الإلكتروني مستخدماً بالفعل.');
            }
        } catch (err) {
             if (err instanceof ApiError && err.errors) {
                 const errorMessages = Object.values(err.errors).flat().join(' ');
                 setError(errorMessages || 'فشل التحقق من البيانات.');
            } else if (err instanceof Error){
                setError(err.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
            } else {
                setError('فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode);
        setError('');
        setName('');
        setEmail('');
        setPassword('');
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            {subscriptionError && (
                <SubscriptionExpiredModal
                    role={subscriptionError.role}
                    onClose={() => setSubscriptionError(null)}
                />
            )}
            <div className="relative w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                 {isInstallable && (
                    <button
                        onClick={handleInstallClick}
                        className="absolute top-4 left-4 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-primary"
                        aria-label="تثبيت التطبيق"
                        title="تثبيت التطبيق"
                    >
                        <ArrowDownOnSquareIcon className="h-6 w-6" />
                    </button>
                )}
                <div className="text-center">
                    <img src={settings.appLogo} alt="شعار التطبيق" className="mx-auto h-16 w-16" />
                    <h1 className="mt-2 text-3xl font-bold text-primary">{settings.appName}</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        {isRegisterMode ? 'إنشاء حساب جديد للبدء.' : 'مرحباً بعودتك! الرجاء تسجيل الدخول إلى حسابك.'}
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={isRegisterMode ? handleRegisterSubmit : handleLoginSubmit}>
                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg" role="alert">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4 rounded-md">
                        {isRegisterMode && (
                            <div>
                                <label htmlFor="name" className="sr-only">الاسم</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    className="relative block w-full px-3 py-2 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                    placeholder="الاسم الكامل"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-address" className="sr-only">البريد الإلكتروني</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full px-3 py-2 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="البريد الإلكتروني"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">كلمة المرور</label>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                className="relative block w-full px-3 pr-10 py-2 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border border-gray-800 dark:border-gray-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="كلمة المرور"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                             <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {!isRegisterMode && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-500 rounded"
                                />
                                <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-900 dark:text-gray-300">
                                    تذكرني
                                </label>
                            </div>
                        </div>
                    )}


                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md group bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                        >
                            {loading ? (isRegisterMode ? 'جاري الإنشاء...' : 'جاري تسجيل الدخول...') : (isRegisterMode ? 'إنشاء حساب' : 'تسجيل الدخول')}
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="font-medium text-primary hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none"
                        >
                            {isRegisterMode 
                                ? 'لديك حساب بالفعل؟ تسجيل الدخول' 
                                : 'ليس لديك حساب؟ إنشاء حساب جديد'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;