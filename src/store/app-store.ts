import { create } from 'zustand'

export type CustomerView = 'dashboard' | 'games' | 'rewards' | 'history' | 'missions' | 'menu'
export type AdminView = 'analytics' | 'settings' | 'menu' | 'rewards' | 'missions'
export type EmployeeView = 'search' | 'visit' | 'redeem' | 'approvals'
export type GameType =
  | 'burger_catch'
  | 'coffee_shooter'
  | 'grand_wheel'
  | 'predict_match'
  | 'shoot_target'
  | 'lucky_scratch'

interface AppState {
  customerView: CustomerView
  adminView: AdminView
  employeeView: EmployeeView
  activeGame: GameType | null
  setCustomerView: (view: CustomerView) => void
  setAdminView: (view: AdminView) => void
  setEmployeeView: (view: EmployeeView) => void
  setActiveGame: (game: GameType | null) => void
}

export const useAppStore = create<AppState>()((set) => ({
  customerView: 'dashboard',
  adminView: 'analytics',
  employeeView: 'search',
  activeGame: null,
  setCustomerView: (view) => set({ customerView: view, activeGame: null }),
  setAdminView: (view) => set({ adminView: view }),
  setEmployeeView: (view) => set({ employeeView: view }),
  setActiveGame: (game) => set({ activeGame: game }),
}))
