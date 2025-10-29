import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppSettings } from '../hooks/useAppSettings';
import { EyeIcon, EyeSlashIcon, ArrowDownOnSquareIcon } from '../components/Icons';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const { settings } = useAppSettings();
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
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
            setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
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
                    <p className="mt-2 text-gray-600 dark:text-gray-300">مرحباً بعودتك! الرجاء تسجيل الدخول إلى حسابك.</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg" role="alert">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4 rounded-md">
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


                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md group bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                        >
                            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;