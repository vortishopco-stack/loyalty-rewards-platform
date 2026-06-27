'use client'

import { useT } from '@/lib/i18n'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useT()

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'ar' : 'en')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLocale}
      className="h-9 w-9 text-muted-foreground hover:text-white"
      title={t('switchLanguage')}
    >
      <Languages className="w-4 h-4" />
    </Button>
  )
}
