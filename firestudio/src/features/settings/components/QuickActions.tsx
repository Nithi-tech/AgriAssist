import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, Languages, FileText, Zap } from 'lucide-react';
import { SettingsBundle } from '../types';
import { exportBackup, importBackup } from '../mockApi';
import { exportFarmReport } from '../pdf/exportFarmReport';
import { toast } from '@/hooks/use-toast';
import i18n from '../i18n';

interface QuickActionsProps {
  bundle: SettingsBundle;
  onUpdate: (bundle: SettingsBundle) => void;
}

export function QuickActions({ bundle, onUpdate }: QuickActionsProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const blob = await exportBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agriassist-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t('settings.messages.backupExported'),
        description: 'Your data has been exported successfully',
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to export backup',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await importBackup(file);
      
      // Reload the page to reflect imported data
      window.location.reload();
      
      toast({
        title: t('settings.messages.backupImported'),
        description: 'Your data has been restored successfully',
      });
    } catch (error) {
      toast({
        title: t('settings.messages.invalidFile'),
        description: error instanceof Error ? error.message : 'Failed to import backup file',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLanguageChange = async (language: 'en' | 'hi' | 'ta' | 'te') => {
    try {
      await i18n.changeLanguage(language);
      
      // This would typically be handled by the LanguageCard component
      // but we're providing a quick action here too
      toast({
        title: t('settings.messages.languageChanged'),
        description: `Language changed to ${getLanguageDisplayName(language)}`,
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: 'Failed to change language',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportFarmReport(bundle);
      
      toast({
        title: 'PDF Report Generated',
        description: 'Your farm report has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to generate PDF report',
        variant: 'destructive',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getLanguageDisplayName = (lang: string) => {
    const names = {
      en: 'English',
      hi: 'हिंदी',
      ta: 'தமிழ்',
      te: 'తెలుగు',
    };
    return names[lang as keyof typeof names] || lang;
  };

  const quickActionButtons = [
    {
      icon: Download,
      label: t('settings.quickActions.exportBackup'),
      onClick: handleExportBackup,
      loading: isExporting,
      variant: 'outline' as const,
    },
    {
      icon: Upload,
      label: t('settings.quickActions.importBackup'),
      onClick: handleImportBackup,
      loading: isImporting,
      variant: 'outline' as const,
    },
    {
      icon: FileText,
      label: t('settings.quickActions.exportPDF'),
      onClick: handleExportPDF,
      loading: isExportingPDF,
      variant: 'outline' as const,
    },
  ];

  return (
    <>
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-indigo-800 text-xl">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {t('settings.quickActions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActionButtons.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant}
                  onClick={action.onClick}
                  disabled={action.loading}
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 h-auto py-4 flex flex-col items-center gap-3 font-medium transition-all duration-200 hover:scale-105"
                >
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="text-sm">{action.loading ? 'Processing...' : action.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Language Selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-indigo-800 uppercase tracking-wide">
              {t('settings.quickActions.switchLanguage')}
            </label>
            <Select
              value={bundle.app.language}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="border-indigo-300 h-12 bg-white/80">
                <SelectValue>
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium">{getLanguageDisplayName(bundle.app.language)}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-xl">🇺🇸</span>
                    <span className="font-medium">English</span>
                  </div>
                </SelectItem>
                <SelectItem value="hi">
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-xl">🇮🇳</span>
                    <span className="font-medium">हिंदी</span>
                  </div>
                </SelectItem>
                <SelectItem value="ta">
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-xl">🇮🇳</span>
                    <span className="font-medium">தமிழ்</span>
                  </div>
                </SelectItem>
                <SelectItem value="te">
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-xl">🇮🇳</span>
                    <span className="font-medium">తెలుగు</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Helper Text */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
            <p className="text-sm text-indigo-700 font-medium">
              💾 {t('settings.quickActions.savedLocally')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
