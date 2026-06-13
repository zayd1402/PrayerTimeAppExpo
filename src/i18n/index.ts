import { useCallback } from 'react';
import * as Localization from 'expo-localization';
import { useLocales } from 'expo-localization';
import en from './en.json';
import ar from './ar.json';

const translations: Record<string, Record<string, string>> = {
  en,
  ar,
};

export function getDeviceLocale(): string {
  const locales = Localization.getLocales();
  const primary = locales[0]?.languageTag || 'en';
  if (primary.startsWith('ar')) return 'ar';
  return 'en';
}

export function t(key: string, locale: string, params?: Record<string, string>): string {
  const dict = translations[locale] || translations.en;
  let value = dict[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(`{${k}}`, v);
    });
  }
  return value;
}

export function useTranslation() {
  const locales = useLocales();
  const locale = locales[0]?.languageTag?.startsWith('ar') ? 'ar' : 'en';

  const translate = useCallback(
    (key: string, params?: Record<string, string>) => t(key, locale, params),
    [locale],
  );

  const isRTL = locale === 'ar';

  return { t: translate, locale, isRTL };
}
