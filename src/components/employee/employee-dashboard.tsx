'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore, type EmployeeView } from '@/store/app-store'
import { api } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search, ShoppingBag, Gift, LogOut, UserCheck, Coins,
  Phone, Star, Award, CheckCircle, XCircle, UserPlus, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { BRAND } from '@/lib/brand'

export function EmployeeDashboard() {
  const { t } = useT()
  const { logout } = useAuthStore()
  const { employeeView, setEmployeeView } = useAppStore()
  const [searchPhone, setSearchPhone] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<any>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [rewards, setRewards] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAddingVisit, setIsAddingVisit] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null)
  const [pendingCustomers, setPendingCustomers] = useState<any[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const employeeNavItems: { key: EmployeeView; label: string; icon: any }[] = [
    { key: 'search', label: t('findCustomer'), icon: Search },
    { key: 'visit', label: t('addVisit'), icon: ShoppingBag },
    { key: 'redeem', label: t('redeem'), icon: Gift },
    { key: 'approvals', label: t('approvals'), icon: UserPlus },
  ]

  useEffect(() => {
    api.getRewards().then(data => setRewards(data.rewards)).catch(console.error)
  }, [])

  // Fetch pending signups (called when the Approvals tab is opened)
  const fetchPending = useCallback(async () => {
    setIsLoadingPending(true)
    try {
      const data = await api.getPendingApprovals()
      setPendingCustomers(data.customers)
    } catch (error: any) {
      console.error('Failed to load pending approvals:', error)
    } finally {
      setIsLoadingPending(false)
    }
  }, [])

  useEffect(() => {
    if (employeeView === 'approvals') {
      fetchPending()
    }
  }, [employeeView, fetchPending])

  const handleSearch = async () => {
    if (!searchPhone.trim()) {
      toast.error(t('enterPhone'))
      return
    }
    setIsSearching(true)
    try {
      const data = await api.searchCustomer(searchPhone.trim())
      setFoundCustomer(data.customer)
      setSelectedCustomer(data.customer)
      toast.success(t('found', { name: data.customer.name }))
    } catch (error: any) {
      setFoundCustomer(null)
      setSelectedCustomer(null)
      toast.error(error.message || t('customerNotFound'))
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddVisit = async () => {
    if (!selectedCustomer) {
      toast.error(t('searchCustomerFirst'))
      return
    }
    if (!invoiceAmount || parseFloat(invoiceAmount) <= 0) {
      toast.error(t('enterValidAmount'))
      return
    }

    setIsAddingVisit(true)
    try {
      const result = await api.createVisit(selectedCustomer.id, parseFloat(invoiceAmount))
      const ptsEarned = result.points_earned ?? result.pointsEarned ?? 0
      const newBal = result.new_points_balance ?? result.newPointsBalance ?? 0
      toast.success(t('visitAdded', { points: ptsEarned }), {
        description: t('pointsRemaining', { points: newBal })
      })
      setInvoiceAmount('')
      // Refresh customer data
      const data = await api.searchCustomer(selectedCustomer.phone)
      setFoundCustomer(data.customer)
      setSelectedCustomer(data.customer)
    } catch (error: any) {
      toast.error(error.message || t('failedToAddVisit'))
    } finally {
      setIsAddingVisit(false)
    }
  }

  const handleRedeemReward = async (rewardId: string) => {
    if (!selectedCustomer) {
      toast.error(t('searchCustomerFirst'))
      return
    }

    setIsRedeeming(true)
    setRedeemingRewardId(rewardId)
    try {
      const result = await api.redeemReward(rewardId, selectedCustomer.id)
      const newBal = result.new_points_balance ?? result.newPointsBalance ?? 0
      toast.success(t('redeemedFor', { name: selectedCustomer.name }), {
        description: t('pointsRemaining', { points: newBal })
      })
      // Refresh customer data
      const data = await api.searchCustomer(selectedCustomer.phone)
      setFoundCustomer(data.customer)
      setSelectedCustomer(data.customer)
    } catch (error: any) {
      toast.error(error.message || t('failedToRedeem'))
    } finally {
      setIsRedeeming(false)
      setRedeemingRewardId(null)
    }
  }

  // Approve a pending customer signup
  const handleApprove = async (customerId: string, customerName: string) => {
    setApprovingId(customerId)
    try {
      await api.approveCustomer(customerId)
      toast.success(t('customerApproved', { name: customerName }))
      setPendingCustomers(prev => prev.filter(c => c.id !== customerId))
    } catch (error: any) {
      toast.error(error.message || t('failedToApprove'))
    } finally {
      setApprovingId(null)
    }
  }

  // Reject a pending customer signup
  const handleReject = async (customerId: string, customerName: string) => {
    setRejectingId(customerId)
    try {
      await api.rejectCustomer(customerId)
      toast.success(t('customerRejected', { name: customerName }))
      setPendingCustomers(prev => prev.filter(c => c.id !== customerId))
    } catch (error: any) {
      toast.error(error.message || t('failedToReject'))
    } finally {
      setRejectingId(null)
    }
  }

  const renderCustomerCard = (customer: any) => (
    <Card className="glass-card border-0 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
            {customer.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{customer.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {customer.phone}
            </p>
          </div>
          <Badge variant="outline" className="border-green-500/30 text-green-400 shrink-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('activeStatus')}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-lg font-bold text-yellow-400">{customer.points}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t('pointsLabel')}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-lg font-bold">{customer.total_visits ?? customer.totalVisits ?? 0}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t('visitsLabel')}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-lg font-bold">{customer.missions?.filter((m: any) => m.completed).length || 0}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t('missionsLabel')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderSearch = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Search className="w-5 h-5 text-emerald-400" />
        {t('findCustomer')}
      </h2>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('enterPhoneSearch')}
            value={searchPhone}
            onChange={e => setSearchPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="glass-input pl-10 h-12"
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching} className="glass-button h-12 px-6">
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {foundCustomer && (
        <div className="space-y-4">
          {renderCustomerCard(foundCustomer)}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setEmployeeView('visit')}
              className="glass-button-success h-14 flex flex-col gap-1"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs">{t('addVisit')}</span>
            </Button>
            <Button
              onClick={() => setEmployeeView('redeem')}
              className="glass-button h-14 flex flex-col gap-1"
            >
              <Gift className="w-5 h-5" />
              <span className="text-xs">{t('redeemReward')}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  const renderAddVisit = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-emerald-400" />
        {t('addVisit')}
      </h2>

      {selectedCustomer ? (
        <div className="space-y-4">
          {renderCustomerCard(selectedCustomer)}

          <Card className="glass-card border-0">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">{t('invoiceAmount')}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={invoiceAmount}
                    onChange={e => setInvoiceAmount(e.target.value)}
                    className="glass-input pl-8 h-12 text-xl font-bold"
                  />
                </div>
              </div>

              {invoiceAmount && parseFloat(invoiceAmount) > 0 && (
                <div className="glass-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('pointsToBeEarned')}</p>
                  <p className="text-3xl font-bold text-green-400">
                    +{Math.floor(parseFloat(invoiceAmount) * 1)}
                  </p>
                </div>
              )}

              <Button
                onClick={handleAddVisit}
                disabled={isAddingVisit || !invoiceAmount || parseFloat(invoiceAmount) <= 0}
                className="glass-button-success w-full h-12"
              >
                {isAddingVisit ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('processing')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {t('addVisitAwardPoints')}
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <UserCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('searchCustomerFirst')}</p>
          <Button onClick={() => setEmployeeView('search')} className="glass-button mt-4">
            <Search className="w-4 h-4 mr-2" />
            {t('searchCustomer')}
          </Button>
        </div>
      )}
    </div>
  )

  const renderRedeem = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Gift className="w-5 h-5 text-amber-400" />
        {t('redeemReward')}
      </h2>

      {selectedCustomer ? (
        <div className="space-y-4">
          {renderCustomerCard(selectedCustomer)}

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {rewards.map(reward => {
                const canAfford = selectedCustomer.points >= reward.pointsCost
                return (
                  <Card key={reward.id} className={`glass-card border-0 ${canAfford ? '' : 'opacity-50'}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{reward.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{reward.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Coins className="w-3 h-3 text-yellow-400" />
                          <span className="text-sm font-bold text-yellow-400">{reward.pointsCost} pts</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRedeemReward(reward.id)}
                        disabled={!canAfford || isRedeeming}
                        className={`ml-3 ${canAfford ? 'glass-button-success' : 'glass-button opacity-50'} shrink-0`}
                        size="sm"
                      >
                        {redeemingRewardId === reward.id ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : canAfford ? (
                          t('redeem')
                        ) : (
                          t('locked')
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <UserCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('searchCustomerFirst')}</p>
          <Button onClick={() => setEmployeeView('search')} className="glass-button mt-4">
            <Search className="w-4 h-4 mr-2" />
            {t('searchCustomer')}
          </Button>
        </div>
      )}
    </div>
  )

  const renderApprovals = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{t('pendingApprovals')}</h2>
          <p className="text-xs text-muted-foreground">{t('pendingApprovalsDesc')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchPending} disabled={isLoadingPending}>
          <Clock className="w-4 h-4 mr-1" />
          {t('refresh')}
        </Button>
      </div>

      {isLoadingPending ? (
        <div className="glass-card p-8 text-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      ) : pendingCustomers.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('noPendingApprovals')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingCustomers.map((c) => (
            <Card key={c.id} className="glass-card border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold shrink-0">
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{c.name}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                      {c.email && c.email !== `${c.phone}@${BRAND.emailDomain}` && (
                        <span className="truncate">{c.email}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {t('signedUp')}: {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 border-0 shrink-0">
                    <Clock className="w-3 h-3 mr-1" />
                    {t('pending')}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="glass-button-success flex-1"
                    onClick={() => handleApprove(c.id, c.name)}
                    disabled={approvingId === c.id || rejectingId === c.id}
                  >
                    {approvingId === c.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    {t('approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => handleReject(c.id, c.name)}
                    disabled={approvingId === c.id || rejectingId === c.id}
                  >
                    {rejectingId === c.id ? (
                      <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-1" />
                    )}
                    {t('reject')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (employeeView) {
      case 'search': return renderSearch()
      case 'visit': return renderAddVisit()
      case 'redeem': return renderRedeem()
      case 'approvals': return renderApprovals()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-main flex flex-col">
      {/* Header */}
      <header className="glass-card rounded-none border-x-0 border-t-0 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold">{t('employeePortal')}</h1>
            <p className="text-[10px] text-muted-foreground">{t('staff')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={logout} className="h-9 w-9 text-muted-foreground hover:text-white">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-none border-x-0 border-b-0 px-2 py-2 z-50">
        <div className="flex items-center justify-around">
          {employeeNavItems.map(item => {
            const Icon = item.icon
            const isActive = employeeView === item.key
            return (
              <button
                key={item.key}
                onClick={() => setEmployeeView(item.key)}
                className={`mobile-nav-item relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive ? 'active text-emerald-400' : 'text-muted-foreground hover:text-white/70'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
