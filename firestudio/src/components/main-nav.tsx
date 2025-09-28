'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Sprout,
  Stethoscope,
  Cloud,
  Landmark,
  Settings,
  MessageCircle,
  TrendingUp,
  TestTube,
  Droplets,
  AlertTriangle,
  Users,
  Bot,
  IndianRupee,
  ShoppingCart,
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation';

interface MainNavProps {
  onLinkClick?: () => void;
  collapsed?: boolean;
}

export function MainNav({ onLinkClick, collapsed = false }: MainNavProps) {
  const pathname = usePathname();
  const { t } = useUnifiedTranslation();

  const navItems = [
    { href: '/dashboard', label: t('dashboard', 'Dashboard'), icon: LayoutDashboard },
    { href: '/crops', label: t('all_crops', 'All Crops'), icon: Sprout },
    { href: '/crop-recommendation', label: t('cropRecommendation', 'Crop Recommendation'), icon: TrendingUp },
    { href: '/disease-diagnosis', label: t('diseaseDiagnosis', 'Disease Diagnosis'), icon: Stethoscope },
    { href: '/weather', label: t('weatherForecast', 'Weather Forecast'), icon: Cloud },
    { href: '/market-prices-new', label: t('market_prices', 'Market Prices'), icon: IndianRupee },
    { href: '/government-schemes', label: t('govtSchemes', 'Govt. Schemes'), icon: Landmark },
    { href: '/fertilizer-shop', label: t('fertilizerShops', 'Fertilizer Shops'), icon: ShoppingCart },
    { href: '/community', label: t('farmerCommunity', 'Farmer Community'), icon: Users, badge: 'new' },
    { href: '/chat', label: t('ai_assistant', 'AI Assistant'), icon: Bot },
    { href: '/my-crop', label: t('admin_panel', 'Admin Panel'), icon: MessageCircle },
    { href: '/settings', label: t('settings.title', 'Settings'), icon: Settings },
  ];

  return (
    <nav className="grid items-start px-4 text-sm font-medium space-y-2">
      {navItems.map(({ href, label, icon: Icon, badge }) => (
        <Link
          key={href}
          href={href}
          onClick={onLinkClick}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 group relative overflow-hidden card-hover',
            'hover:scale-105',
            collapsed ? 'justify-center px-2' : '',
            {
              'glass border border-primary/30 text-primary shadow-lg hover:bg-primary/10': pathname === href,
              'hover:bg-white/10 hover:backdrop-blur-sm': pathname !== href,
            }
          )}
          title={collapsed ? label : undefined}
        >
          {/* Background gradient effect */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            pathname === href && "opacity-100"
          )} />
          
          {/* Icon */}
          <Icon className={cn(
            "h-5 w-5 relative z-10 transition-transform duration-200 group-hover:scale-110",
            pathname === href ? "text-primary" : "text-foreground/70"
          )} />
          
          {/* Label */}
          {!collapsed && (
            <span className={cn(
              "relative z-10 font-medium transition-colors duration-200",
              pathname === href ? "text-primary" : "text-foreground/80"
            )}>
              {label}
            </span>
          )}
          
          {/* New Badge */}
          {badge && !collapsed && (
            <span className="relative z-10 ml-auto px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-accent to-destructive text-white rounded-full animate-pulse-glow">
              {badge.toUpperCase()}
            </span>
          )}
          
          {/* Active indicator */}
          {pathname === href && !collapsed && (
            <div className="absolute right-2 w-2 h-2 bg-accent rounded-full animate-pulse" />
          )}
        </Link>
      ))}
      
      {/* Divider */}
      {!collapsed && (
        <div className="my-4 border-t border-white/20" />
      )}
    </nav>
  );
}
