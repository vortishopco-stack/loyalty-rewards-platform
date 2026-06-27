'use client'

import { useState } from 'react'
import { api, AuthError } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useT } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, User, Lock, Sparkles, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { normalizePhone } from '@/lib/brand'

interface AuthScreenProps {
  onBrowseMenu?: () => void
}

export function AuthScreen({ onBrowseMenu }: AuthScreenProps) {
  const { login } = useAuthStore()
  const { t } = useT()
  const [isLoading, setIsLoading] = useState(false)
  // `activeTab` lets us programmatically switch to the login tab after a
  // successful signup (so the user can immediately try to sign in once staff
  // approves them, instead of being left on a stale signup form).
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' })
  const [signupForm, setSignupForm] = useState({ phone: '', name: '', password: '' })

  /**
   * Map an AuthError code (thrown by api.ts) to a translated toast.
   * For codes that have a `...Desc` companion, pass it as the toast description
   * so the user gets a one-line title + a helpful explanation.
   */
  const showAuthError = (err: unknown) => {
    if (err instanceof AuthError) {
      switch (err.code) {
        case 'ACCOUNT_PENDING':
          toast.error(t('accountPending'), { description: t('accountPendingDesc') })
          return
        case 'ACCOUNT_REJECTED':
          toast.error(t('accountRejected'), { description: t('accountRejectedDesc') })
          return
        case 'SIGNUP_PENDING':
          // Friendly success-style message — the signup DID succeed, the
          // account is just awaiting staff approval.
          toast.success(t('signupReceived'), { description: t('signupReceivedDesc') })
          return
        case 'INVALID_CREDENTIALS':
          toast.error(t('errInvalidCredentials'), { description: t('errInvalidCredentialsDesc') })
          return
        case 'USER_ALREADY_REGISTERED':
          toast.error(t('errUserAlreadyRegistered'), {
            description: t('errUserAlreadyRegisteredDesc'),
          })
          return
        case 'EMAIL_CONFIRMATION_REQUIRED':
          toast.error(t('errEmailConfirmationRequired'), {
            description: t('errEmailConfirmationRequiredDesc'),
          })
          return
        case 'PHONE_REQUIRED':
          toast.error(t('errPhoneRequired'))
          return
        case 'PASSWORD_TOO_SHORT':
          toast.error(t('errPasswordTooShort'))
          return
        case 'PROFILE_MISSING':
          toast.error(t('errProfileMissing'), { description: t('errProfileMissingDesc') })
          return
        case 'NETWORK_ERROR':
          toast.error(t('errNetworkError'), { description: t('errNetworkErrorDesc') })
          return
        case 'UNKNOWN_ERROR':
        default:
          // For UNKNOWN_ERROR we fall back to the raw Supabase message if
          // one was attached — useful for debugging rare issues.
          toast.error(t('errUnknown'), {
            description: err.message && err.message !== 'UNKNOWN_ERROR' ? err.message : t('errUnknownDesc'),
          })
          return
      }
    }
    // Non-AuthError thrown — surface the raw message, or a generic fallback.
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(t('errUnknown'), { description: msg || t('errUnknownDesc') })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const data = await api.login(loginForm.phone, loginForm.password)
      login(
        {
          ...data.user,
          totalVisits: data.user.total_visits || data.user.totalVisits || 0,
          createdAt: data.user.created_at || data.user.createdAt,
          updatedAt: data.user.updated_at || data.user.updatedAt,
        },
        data.token
      )
      toast.success(t('welcomeBack', { name: data.user.name }))
    } catch (error) {
      showAuthError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Customer signups always end in SIGNUP_PENDING (status='pending').
      // The api.signup() function will throw SIGNUP_PENDING after creating
      // the customer profile + default missions. We catch it below and treat
      // it as a SUCCESS path — the user sees a confirmation toast, the form
      // resets, and the tab switches to login.
      const data = await api.signup(
        signupForm.phone,
        signupForm.name,
        signupForm.password
      )
      // If we get here, the account was created AND auto-approved (staff
      // phone — shouldn't normally happen since signup forces role=customer).
      // Log them in anyway as a safety net.
      login(
        {
          ...data.user,
          totalVisits: data.user.total_visits || data.user.totalVisits || 0,
          createdAt: data.user.created_at || data.user.createdAt,
          updatedAt: data.user.updated_at || data.user.updatedAt,
        },
        data.token
      )
      toast.success(t('welcomeNew', { name: data.user.name }))
    } catch (error) {
      const wasPending =
        error instanceof AuthError && error.code === 'SIGNUP_PENDING'
      showAuthError(error)
      if (wasPending) {
        // Reset the signup form so the next visitor (or the same user after
        // approval) starts fresh, and switch to the login tab so the user
        // knows to come back here once staff approves them.
        setSignupForm({ phone: '', name: '', password: '' })
        setActiveTab('login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Language Switcher */}
        <div className="text-center mb-8">
          <div className="flex justify-end mb-2">
            <LanguageSwitcher />
          </div>
          <div className="inline-flex items-center justify-center ">
              <img src="logo.png" alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-amber-400 to-blue-400 bg-clip-text text-transparent">
            {t('appName')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('appTagline')}</p>
        </div>

        {/* Auth Card */}
        <Card className="glass-card border-0 shadow-2xl">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')} className="w-full">
              <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none h-14 p-0">
                <TabsTrigger
                  value="login"
                  className="flex-1 h-full rounded-none data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-white"
                >
                  {t('signIn')}
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="flex-1 h-full rounded-none data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-white"
                >
                  {t('signUp')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="p-6 mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">{t('phoneNumber')}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                      <Input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder={t('enterPhone')}
                        value={loginForm.phone}
                        onChange={(e) =>
                          // Strip non-digit characters on every keystroke so the
                          // user sees exactly what we'll send to Supabase Auth.
                          // This prevents the 'Invalid email' error caused by
                          // spaces, +, (), - in the synthesized auth email.
                          setLoginForm((prev) => ({ ...prev, phone: normalizePhone(e.target.value).slice(0, 15) }))
                        }
                        className="glass-input pl-10 h-12 border-white/10"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder={t('enterPassword')}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="glass-input pl-10 h-12 border-white/10"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full glass-button h-12 text-base"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('signingIn')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {t('signIn')}
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="p-6 mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">{t('fullName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                      <Input
                        type="text"
                        autoComplete="name"
                        placeholder={t('enterName')}
                        value={signupForm.name}
                        onChange={(e) => setSignupForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="glass-input pl-10 h-12 border-white/10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">{t('phoneNumber')}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                      <Input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder={t('enterPhone')}
                        value={signupForm.phone}
                        onChange={(e) =>
                          setSignupForm((prev) => ({ ...prev, phone: normalizePhone(e.target.value).slice(0, 15) }))
                        }
                        className="glass-input pl-10 h-12 border-white/10"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-sm">{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 rtl:left-auto" />
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder={t('createPassword')}
                        value={signupForm.password}
                        onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="glass-input pl-10 h-12 border-white/10"
                        dir="ltr"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full glass-button h-12 text-base"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('creatingAccount')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {t('signUp')}
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Browse menu + Setup hint */}
        <div className="mt-6 text-center space-y-3">
          {onBrowseMenu && (
            <button
              onClick={onBrowseMenu}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm text-muted-foreground hover:text-white transition-colors w-full justify-center"
            >
              <BookOpen className="w-4 h-4" />
              {t('browseMenu')}
            </button>
          )}
          <div>
            {/* <p className="text-xs text-muted-foreground/60">
              {t('poweredBy')}
            </p>
            <p className="text-xs text-muted-foreground/40 mt-1">
              {t('demoAccounts')}
            </p> */}
          </div>
        </div>
      </div>
    </div>
  )
}
