'use client'

import { useEffect } from 'react'
import { useI18nStore, isRTLLocale } from '@/lib/i18n'

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useI18nStore((s) => s.locale)

  useEffect(() => {
    const html = document.documentElement
    html.lang = locale
    html.dir = isRTLLocale(locale) ? 'rtl' : 'ltr'

    // Add/remove RTL class for Tailwind
    if (isRTLLocale(locale)) {
      html.classList.add('rtl')
    } else {
      html.classList.remove('rtl')
    }
  }, [locale])

  return <>{children}</>
}
