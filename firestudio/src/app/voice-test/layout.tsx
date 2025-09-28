import { LanguageProvider } from '@/providers/language-provider-safe';

export default function VoiceTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}
