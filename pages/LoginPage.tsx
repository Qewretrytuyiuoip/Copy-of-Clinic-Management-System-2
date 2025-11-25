import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppSettings } from '../hooks/useAppSettings';
import { EyeIcon, EyeSlashIcon, ArrowDownOnSquareIcon, WhatsappIcon, FacebookIcon, TelegramIcon, XIcon, ResetIcon, EnvelopeIcon, LockClosedIcon } from '../components/Icons';
import { api, ApiError } from '../services/api';
import { UserRole } from '../types';
import { appSettings } from '../appSettings';
import LoadingSpinner from '../components/LoadingSpinner';
import ThemeToggleButton from '../components/ThemeToggleButton';

const SubscriptionExpiredModal: React.FC<{
    role: UserRole;
    onClose: () => void;
}> = ({ role, onClose }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await api.exportCenterData();
        } catch (err) {
            alert(`فشل تصدير البيانات: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
        } finally {
            setIsExporting(false);
        }
    };

    const isManager = role === UserRole.Admin || role === UserRole.SubManager;
    const title = "انتهاء الاشتراك";
    const message = isManager
        ? "انتهى اشتراكك. يرجى تجديده للاستمرار في استخدام النظام. يمكنك تحميل بياناتك قبل التواصل مع الدعم."
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
                <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl flex flex-col sm:flex-row justify-end gap-3">
                     {isManager && (
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                            {isExporting ? <LoadingSpinner className="h-5 w-5" /> : <ArrowDownOnSquareIcon className="h-5 w-5" />}
                            <span>{isExporting ? 'جاري التحميل...' : 'تحميل البيانات'}</span>
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="w-full sm:w-auto rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-6 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

const SocialButton: React.FC<{ icon: React.ElementType, href: string, label: string }> = ({ icon: Icon, href, label }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        title={label}
        className="group relative w-12 h-12 flex items-center justify-center rounded-full bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-white/5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-600 hover:shadow-primary/30"
    >
        <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-primary-500 transition-colors" />
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium">{label}</span>
    </a>
);

const LoginPage: React.FC = () => {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, register } = useAuth();
    const { settings } = useAppSettings();
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [subscriptionError, setSubscriptionError] = useState<{ role: UserRole } | null>(null);

    // Captcha State
    const [captchaNum1, setCaptchaNum1] = useState(0);
    const [captchaNum2, setCaptchaNum2] = useState(0);
    const [captchaInput, setCaptchaInput] = useState('');

    const generateCaptcha = () => {
        setCaptchaNum1(Math.floor(Math.random() * 10));
        setCaptchaNum2(Math.floor(Math.random() * 10));
        setCaptchaInput('');
    };

    useEffect(() => {
        generateCaptcha();
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
        
        if (parseInt(captchaInput) !== captchaNum1 + captchaNum2) {
            setError('ناتج العملية الحسابية غير صحيح.');
            generateCaptcha();
            return;
        }

        const maliciousPattern = /[<>;]|--/;
        if (maliciousPattern.test(email) || maliciousPattern.test(password)) {
            setError('أحرف غير صالحة.');
            return;
        }
        
        setLoading(true);
        try {
            const user = await login(email, password);
            if (!user) {
                setError('بيانات الدخول غير صحيحة.');
                generateCaptcha(); 
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'SubscriptionExpiredError') {
                setSubscriptionError({ role: (err as any).role });
            } else {
                setError('حدث خطأ. حاول مرة أخرى.');
            }
            generateCaptcha();
        } finally {
            setLoading(false);
        }
    };
    
    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (parseInt(captchaInput) !== captchaNum1 + captchaNum2) {
            setError('ناتج العملية الحسابية غير صحيح.');
            generateCaptcha();
            return;
        }

        const maliciousPattern = /[<>;]|--/;
        if (maliciousPattern.test(name) || maliciousPattern.test(email) || maliciousPattern.test(password)) {
            setError('أحرف غير صالحة.');
            return;
        }

        if (password.length < 6) {
            setError('كلمة المرور قصيرة جداً.');
            return;
        }

        setLoading(true);
        try {
            const user = await register(name, email, password);
            if (!user) {
                 setError('فشل إنشاء الحساب.');
                 generateCaptcha();
            }
        } catch (err) {
             if (err instanceof ApiError && err.errors) {
                 const errorMessages = Object.values(err.errors).flat().join(' ');
                 setError(errorMessages || 'فشل التحقق.');
            } else {
                setError('فشل إنشاء الحساب.');
            }
            generateCaptcha();
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
        generateCaptcha(); 
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-[#F7F9FC] dark:bg-[#0F172A] transition-colors duration-500 overflow-hidden font-sans">
            
            {subscriptionError && (
                <SubscriptionExpiredModal
                    role={subscriptionError.role}
                    onClose={() => setSubscriptionError(null)}
                />
            )}

            {/* Top Right Controls */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
                {isInstallable && (
                    <button
                        onClick={handleInstallClick}
                        className="p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 text-gray-700 dark:text-gray-200 shadow-md backdrop-blur-sm hover:scale-105 transition-all"
                        title="تثبيت التطبيق"
                    >
                        <ArrowDownOnSquareIcon className="h-5 w-5" />
                    </button>
                )}
                <ThemeToggleButton className="p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 text-gray-700 dark:text-gray-200 shadow-md backdrop-blur-sm hover:scale-105 transition-all" />
            </div>

            {/* Main Glass Card */}
            <div className="relative w-full max-w-[400px] mx-4">
                <div className="relative z-10 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/50 dark:border-white/10 p-8 overflow-hidden">
                    
                    {/* Top Highlight/Reflection */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-50"></div>

                    {/* Logo & Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="mb-4 relative group">
                            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <img 
                                src={settings.appLogo} 
                                alt="App Logo" 
                                className="relative h-24 w-24 object-contain drop-shadow-md transform transition-transform duration-500 hover:scale-110 hover:rotate-3" 
                            />
                        </div>
                        <h1 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500 dark:from-primary-400 dark:to-secondary-300 animate-pulse">
                            {settings.appName.toUpperCase()}
                        </h1>
                    </div>

                    <form className="space-y-5" onSubmit={isRegisterMode ? handleRegisterSubmit : handleLoginSubmit}>
                        {error && (
                            <div className="p-3 text-sm text-center text-red-600 dark:text-red-300 bg-red-100/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl backdrop-blur-sm animate-pulse">
                                {error}
                            </div>
                        )}

                        {isRegisterMode && (
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <span className="text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </span>
                                </div>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="الاسم الكامل"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 outline-none transition-all shadow-inner"
                                />
                            </div>
                        )}

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="البريد الإلكتروني / اسم المستخدم"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 outline-none transition-all shadow-inner"
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                            </div>
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="كلمة المرور"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3.5 rounded-full bg-white/50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 outline-none transition-all shadow-inner"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>

                        {/* Compact Captcha */}
                        <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700">
                            <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap font-medium">{captchaNum1} + {captchaNum2} = ?</span>
                            <input
                                type="number"
                                required
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                className="w-full bg-transparent border-none text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-0 text-center font-bold h-8"
                                placeholder="الناتج"
                            />
                            <button type="button" onClick={generateCaptcha} className="text-gray-400 hover:text-primary-500 transition-colors">
                                <ResetIcon className="h-4 w-4" />
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-6 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white font-bold text-lg tracking-widest uppercase shadow-[0_10px_20px_-10px_rgba(26,115,232,0.5)] hover:shadow-[0_15px_25px_-10px_rgba(26,115,232,0.6)] transform transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
                        >
                            <span className="relative z-10">{loading ? 'جاري المعالجة...' : (isRegisterMode ? 'إنشاء حساب' : 'تسجيل الدخول')}</span>
                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-shimmer"></div>
                        </button>

                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors underline underline-offset-4 decoration-transparent hover:decoration-primary-500"
                            >
                                {isRegisterMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                            </button>
                        </div>
                    </form>

                    {/* Social Icons Section */}
                    <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-center gap-6">
                        <SocialButton icon={appSettings.contact.whatsapp ? WhatsappIcon : () => null} href={appSettings.contact.whatsapp} label="Whatsapp" />
                        <SocialButton icon={appSettings.contact.facebook ? FacebookIcon : () => null} href={appSettings.contact.facebook} label="Facebook" />
                        <SocialButton icon={appSettings.contact.telegram ? TelegramIcon : () => null} href={appSettings.contact.telegram} label="Telegram" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;