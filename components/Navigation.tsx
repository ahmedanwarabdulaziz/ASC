'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, signOut, AuthUser } from '@/lib/auth';
import Button from './Button';

interface MenuItem {
  href: string;
  label: string;
  iconType: 'home' | 'search' | 'dashboard' | 'users' | 'status' | 'conflicts' | 'reports' | 'voices' | 'download';
  public: boolean;
  roles?: ('admin' | 'supervisor' | 'team_leader')[];
}

export default function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();
  }, [pathname]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const handleInstallApp = async () => {
    try {
      if (deferredPrompt) {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
        } else {
          router.push('/download');
        }
      } else {
        router.push('/download');
      }
    } catch {
      router.push('/download');
    }
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      admin: 'مدير',
      supervisor: 'مشرف',
      team_leader: 'قائد فريق',
    };
    return labels[role] || role;
  };

  const visibleMenuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        href: '/',
        label: 'الصفحة الرئيسية',
        iconType: 'home',
        public: true,
      },
      {
        href: '/about',
        label: 'المزيد عن ناجح البارودي',
        iconType: 'home',
        public: true,
      },
      {
        href: '/download',
        label: 'تحميل التطبيق',
        iconType: 'download',
        public: true,
      },
    ];

    if (currentUser) {
      items.push({
        href: '/members',
        label: 'البحث عن الأعضاء',
        iconType: 'search',
        public: false,
      });
      
      items.push({
        href: '/dashboard',
        label: 'لوحة التحكم',
        iconType: 'dashboard',
        public: false,
      });


      // My Voices for all authenticated users
      items.push({
        href: '/dashboard/my-voices',
        label: 'أصواتي',
        iconType: 'voices',
        public: false,
        roles: ['admin', 'supervisor', 'team_leader'],
      });

      // Admin and supervisor menu items
      if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
        items.push({
          href: '/dashboard/users',
          label: 'إدارة المستخدمين',
          iconType: 'users',
          public: false,
        });
      }

      // Admin only menu items
      if (currentUser.role === 'admin') {
        items.push({
          href: '/dashboard/conflicts',
          label: 'حل التعارضات',
          iconType: 'conflicts',
          public: false,
          roles: ['admin'],
        });
        items.push({
          href: '/dashboard/reports',
          label: 'التقارير',
          iconType: 'reports',
          public: false,
          roles: ['admin'],
        });
      }
    }

    return items.filter((item) => {
      if (item.public) return true;
      if (!currentUser) return false;
      if (item.roles && !item.roles.includes(currentUser.role)) return false;
      return true;
    });
  }, [currentUser]);

  const getPageTitle = (): string => {
    if (pathname === '/about') return 'المزيد عن ناجح البارودي';
    if (pathname === '/members') return 'البحث عن الأعضاء';
    if (pathname === '/dashboard') return 'لوحة التحكم';
    if (pathname === '/dashboard/my-voices') return 'أصواتي';
    if (pathname === '/dashboard/users') return 'إدارة المستخدمين';
    if (pathname === '/dashboard/conflicts') return 'حل تعارضات الحالات';
    if (pathname === '/dashboard/reports') return 'التقارير';
    return 'نادي ASC';
  };

  const getPageSubtitle = (): string => {
    if (pathname === '/about') return 'مرشح رئاسة مجلس ادارة نادي اسيوط الرياضي';
    if (pathname === '/members') return 'نظام بحث متقدم باللغة العربية';
    if (pathname === '/dashboard/my-voices') return 'الأعضاء الذين قمت بتحديث حالتهم';
    if (pathname === '/dashboard/users') return 'إدارة المستخدمين والأدوار';
    if (pathname === '/dashboard/conflicts') return 'حل التعارضات بين الحالات';
    if (pathname === '/dashboard/reports') return 'تقارير مفصلة عن الحالات والفئات';
    return 'نظام إدارة انتخابات النادي';
  };

  const renderIcon = (iconType: string): JSX.Element | null => {
    switch (iconType) {
      case 'home':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'search':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'dashboard':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case 'users':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'status':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'conflicts':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'reports':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'voices':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m-6 8h6a2 2 0 002-2V7a2 2 0 00-2-2h-1.5a1.5 1.5 0 01-3 0H9A2 2 0 007 7v9a2 2 0 002 2z" />
          </svg>
        );
      case 'download':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const isHomePage = pathname === '/';

  return (
    <>
      <header className="bg-black/80 border-yellow-500/20 border-b shadow-sm sticky top-0 z-50 backdrop-blur-md" dir="rtl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {!isHomePage && (
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 text-white">
                    {getPageTitle()}
                  </h1>
                  <p className="text-xs sm:text-sm hidden sm:block text-gray-300">
                    {getPageSubtitle()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentUser && (
                <>
                  {/* Desktop/tablet badge */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                    <span className="text-xs font-medium text-yellow-400">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded text-yellow-500 bg-yellow-500/20">
                      {getRoleLabel(currentUser.role)}
                    </span>
                  </div>
                  {/* Mobile compact label */}
                  <div className="sm:hidden flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/30">
                    <span className="text-[11px] font-medium text-yellow-400 truncate max-w-[120px]">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-yellow-500 bg-yellow-500/20 whitespace-nowrap">
                      {getRoleLabel(currentUser.role)}
                    </span>
                  </div>
                </>
              )}
              <div className="hidden sm:block">
                <Button
                  onClick={handleInstallApp}
                  className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                  </svg>
                  <span>تحميل التطبيق</span>
                </Button>
              </div>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-yellow-500/20 focus:ring-yellow-500"
                aria-label="Menu"
              >
                {menuOpen ? (
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white border-gray-200 border-l shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir="rtl"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">القائمة</h2>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-gray-100"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
              {visibleMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  item.iconType === 'download' ? (
                    <button
                      key={item.href}
                      onClick={() => {
                        handleInstallApp();
                        setMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-yellow-500 text-black shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={isActive ? 'text-black' : 'text-gray-500'}>
                        {renderIcon(item.iconType)}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-yellow-500 text-black shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className={isActive ? 'text-black' : 'text-gray-500'}>
                        {renderIcon(item.iconType)}
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                );
              })}

              {currentUser && (
                <>
                  <div className="border-t my-2 border-gray-200"></div>
                  <Button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    fullWidth={true}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>تسجيل الخروج</span>
                  </Button>
                </>
              )}

              {!currentUser && (
                <>
                  <div className="border-t my-2 border-gray-200"></div>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block"
                  >
                    <Button
                      fullWidth={true}
                      className="flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>تسجيل الدخول</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
