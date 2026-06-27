import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import en from '@/lib/i18n/locales/en'
import ar from '@/lib/i18n/locales/ar'

export type Locale = 'en' | 'ar'

const translations: Record<Locale, Record<string, string>> = { en, ar }

interface I18nState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'app-locale' }
  )
)

/**
 * Get a translated string by key.
 * Supports interpolation: t('welcome', { name: 'John' }) → replaces {name} in the string.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const { locale } = useI18nStore.getState()
  const translationsMap = translations[locale] || translations.en
  let value = translationsMap[key] || translations.en[key as keyof typeof en] || key

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }

  return value
}

/**
 * React hook to get translation function that re-renders on locale change.
 */
export function useT() {
  const locale = useI18nStore((s) => s.locale)
  const setLocale = useI18nStore((s) => s.setLocale)

  const translate = (key: string, params?: Record<string, string | number>): string => {
    const translationsMap = translations[locale] || translations.en
    let value = translationsMap[key] || translations.en[key as keyof typeof en] || key

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }

    return value
  }

  return { t: translate, locale, setLocale, isRTL: locale === 'ar' }
}

export function isRTLLocale(locale: Locale): boolean {
  return locale === 'ar'
}
