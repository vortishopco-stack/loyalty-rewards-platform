'use client'

import { useT } from '@/lib/i18n'
import { MenuView } from '@/components/dashboard/menu-view'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { UtensilsCrossed, ArrowLeft, Sparkles } from 'lucide-react'

interface PublicMenuProps {
  onBack: () => void
  onSignIn: () => void
}

export function PublicMenu({ onBack, onSignIn }: PublicMenuProps) {
  const { t } = useT()

  return (
    <div className="min-h-screen bg-gradient-main flex flex-col">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="glass-card text-muted-foreground hover:text-white gap-2"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span className="hidden sm:inline">{t('backToSignIn')}</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-9 h-9">
              <img src="logo.png" alt="Logo" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
                {t('appName')}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">{t('menuPreview')}</p>
            </div>
          </div>

          <LanguageSwitcher />
        </div>
      </header>

      {/* Menu Content */}
      <main className="relative z-10 flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <MenuView />
        </div>
      </main>

      {/* Sign-in CTA Footer */}
      <footer className="relative z-10 px-4 pb-6 pt-2">
        <div className="max-w-2xl mx-auto glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground text-center sm:text-start">
            {t('signInToEarn')}
          </p>
          <Button
            onClick={onSignIn}
            className="glass-button shrink-0 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {t('signInNow')}
          </Button>
        </div>
      </footer>
    </div>
  )
}
