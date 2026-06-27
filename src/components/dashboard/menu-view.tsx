'use client'

import { useState, useEffect } from 'react'
import { useT } from '@/lib/i18n'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  UtensilsCrossed, Coffee, Salad, Beef, Cake, Flame,
  Pizza, Soup, IceCream, Croissant, Wine, Fish, Drumstick,
  Cookie, Sandwich, GlassWater, Apple, Carrot,
  Egg, Wheat, Donut, CupSoda,
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl: string
  available: boolean
}

interface MenuCategory {
  id: string
  name: string
  displayName: string
  icon: string
  color: string
  sortOrder: number
  visible: boolean
}

// Map of icon-name (stored in DB) -> lucide-react component.
// Used so the admin can pick from a curated set and the customer view renders
// the right icon without bundling all of lucide-react.
const ICON_REGISTRY: Record<string, any> = {
  UtensilsCrossed,
  Coffee,
  Salad,
  Beef,
  Cake,
  Flame,
  Pizza,
  Soup,
  IceCream,
  Croissant,
  Wine,
  Fish,
  Drumstick,
  Cookie,
  Sandwich,
  GlassWater,
  Apple,
  Carrot,
  Egg,
  Wheat,
  Donut,
  CupSoda,
}

// Fallback icons/colors for items whose category has no row in menu_categories
// (keeps the old behavior working before the admin sets up categories).
const FALLBACK_CATEGORY_ICONS: Record<string, any> = {
  Burgers: Beef,
  Coffee: Coffee,
  Salads: Salad,
  Sides: Flame,
  Desserts: Cake,
  Main: UtensilsCrossed,
}

const FALLBACK_CATEGORY_COLORS: Record<string, string> = {
  Burgers: 'from-amber-500/20 to-orange-500/20',
  Coffee: 'from-amber-700/20 to-yellow-600/20',
  Salads: 'from-green-500/20 to-emerald-500/20',
  Sides: 'from-orange-500/20 to-red-500/20',
  Desserts: 'from-amber-500/20 to-rose-500/20',
  Main: 'from-amber-500/20 to-orange-500/20',
}

const DEFAULT_FALLBACK_COLOR = 'from-amber-500/20 to-orange-500/20'

function resolveIcon(iconName: string | undefined, categoryName: string) {
  if (iconName && ICON_REGISTRY[iconName]) return ICON_REGISTRY[iconName]
  return FALLBACK_CATEGORY_ICONS[categoryName] || UtensilsCrossed
}

function resolveColor(colorClasses: string | undefined, categoryName: string) {
  if (colorClasses) return colorClasses
  return FALLBACK_CATEGORY_COLORS[categoryName] || DEFAULT_FALLBACK_COLOR
}

export function MenuView() {
  const { t } = useT()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.getMenu()
      .then(data => {
        setMenuItems(data.menuItems)
        setCategories(data.categories || [])
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  // Build the filter bar: "All" + visible categories, sorted by sort_order.
  // If no categories are configured, derive them from the items (backward compat).
  const visibleCategories = categories.filter(c => c.visible !== false)

  const categoryFilterList: { key: string; label: string }[] =
    visibleCategories.length > 0
      ? visibleCategories.map(c => ({ key: c.name, label: c.displayName || c.name }))
      : Array.from(new Set(menuItems.map(item => item.category)))
          .map(name => ({ key: name, label: name }))

  const categoriesWithAll = [{ key: 'All', label: t('all') }, ...categoryFilterList]

  // If the active category is no longer in the list (e.g. admin hid it),
  // fall back to "All" so the customer never sees an empty menu.
  const effectiveActiveCategory = categoriesWithAll.some(c => c.key === activeCategory)
    ? activeCategory
    : 'All'

  const filteredItems = effectiveActiveCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === effectiveActiveCategory)

  // Look up a category's config by its `name` (which matches item.category)
  const categoryByName = (name: string) => categories.find(c => c.name === name)

  const handleImageError = (id: string) => {
    setImageErrors(prev => new Set(prev).add(id))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-amber-400" />
          {t('ourMenu')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="w-full h-24 rounded-lg bg-white/5 mb-3" />
              <div className="h-4 bg-white/5 rounded mb-2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-amber-400" />
          {t('ourMenu')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('browseOfferings')}</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categoriesWithAll.map(cat => {
          const isActive = effectiveActiveCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  : 'glass-card text-muted-foreground hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredItems.map(item => {
          const catConfig = categoryByName(item.category)
          const CatIcon = resolveIcon(catConfig?.icon, item.category)
          const colorClass = resolveColor(catConfig?.color, item.category)
          const hasImage = item.imageUrl && !imageErrors.has(item.id)

          return (
            <Card key={item.id} className="glass-card border-0 glass-card-hover overflow-hidden">
              <CardContent className="p-0">
                {/* Item Image */}
                <div className="w-full h-28 relative overflow-hidden">
                  {hasImage ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(item.id)}
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                      <CatIcon className="w-10 h-10 text-white/40" />
                    </div>
                  )}
                  {/* Price overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                    <p className="text-sm font-bold text-green-400">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Item Info */}
                <div className="p-3 pt-2">
                  {/* Category Badge */}
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 mb-1.5 border-white/10 text-muted-foreground"
                  >
                    {catConfig?.displayName || item.category}
                  </Badge>

                  {/* Name */}
                  <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>

                  {/* Description */}
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="glass-card p-8 text-center">
          <UtensilsCrossed className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('noItemsInCategory')}</p>
        </div>
      )}
    </div>
  )
}
