'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useT } from '@/lib/i18n'
import { api } from '@/lib/api'
import { AuthScreen } from '@/components/auth/auth-screen'
import { CustomerDashboard } from '@/components/dashboard/customer-dashboard'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { EmployeeDashboard } from '@/components/employee/employee-dashboard'
import { PublicMenu } from '@/components/public/public-menu'
import { Database, ExternalLink, Key, Server } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

function SetupGuide() {
  const { t } = useT()

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="flex justify-end mb-2">
            <LanguageSwitcher />
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-amber-400 to-blue-400 bg-clip-text text-transparent">
            {t('setupTitle')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('setupSubtitle')}</p>
        </div>

        <div className="glass-card p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            {t('step1Title')}
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>{t('step1_1')}</li>
            <li>{t('step1_2')}</li>
            <li>{t('step1_3')}</li>
            <li>{t('step1_4')}</li>
          </ol>

          <h2 className="text-lg font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            {t('step2Title')}
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>{t('step2_1')}</li>
            <li>{t('step2_2')}</li>
            <li>{t('step2_3')}</li>
          </ol>

          <h2 className="text-lg font-bold flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            {t('step3Title')}
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>{t('step3_1')}</li>
            <li>{t('step3_2')}</li>
            <li>{t('step3_3')}</li>
          </ol>

          <h2 className="text-lg font-bold flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-emerald-400" />
            {t('step4Title')}
          </h2>
          <div className="glass-card p-4 font-mono text-xs space-y-1">
            <p className="text-muted-foreground"># Create a .env.local file with:</p>
            <p><span className="text-green-400">NEXT_PUBLIC_SUPABASE_URL</span>=<span className="text-yellow-400">https://your-project.supabase.co</span></p>
            <p><span className="text-green-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=<span className="text-yellow-400">your-anon-key-here</span></p>
          </div>

          <div className="pt-2 text-center">
            <p className="text-sm text-amber-400">{t('envHint')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated, user, login, clearAuth } = useAuthStore()
  const { t } = useT()
  const [isChecking, setIsChecking] = useState(true)
  const [showPublicMenu, setShowPublicMenu] = useState(false)
  const initRef = useRef(false)

  // If Supabase isn't configured, show setup guide
  const showSetupGuide = !isSupabaseConfigured

  // Check for existing Supabase session on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (initRef.current) return
    initRef.current = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('customers')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            // status check on reload: a user whose account was rejected (or
            // is still pending approval) after they last logged in must NOT
            // be allowed back into the app via a stale localStorage session.
            // Sign them out and let them hit the friendly ACCOUNT_PENDING /
            // ACCOUNT_REJECTED toast next time they try to log in.
            const status = (profile as any).status || 'approved'
            if (status === 'pending' || status === 'rejected') {
              await supabase.auth.signOut()
              console.info('[session] signed out user with status=', status)
            } else {
              login(
                { ...profile, totalVisits: profile.total_visits, createdAt: profile.created_at, updatedAt: profile.updated_at },
                session.access_token
              )
            }
          } else {
            await supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
      }
      setIsChecking(false)
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        clearAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [login, clearAuth])

  // Show setup guide if Supabase isn't configured
  if (showSetupGuide) {
    return <SetupGuide />
  }

  if (isChecking && isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto animate-pulse-glow">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </div>
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (showPublicMenu) {
      return (
        <PublicMenu
          onBack={() => setShowPublicMenu(false)}
          onSignIn={() => setShowPublicMenu(false)}
        />
      )
    }
    return <AuthScreen onBrowseMenu={() => setShowPublicMenu(true)} />
  }

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />
    case 'employee':
      return <EmployeeDashboard />
    default:
      return <CustomerDashboard />
  }
}
