"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Define available locales
export type Locale = 'en' | 'es'

// Type for translations
type Messages = Record<string, any>

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: Messages
  t: (key: string, params?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
  defaultLocale?: Locale
}

export function I18nProvider({ children, defaultLocale = 'en' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [messages, setMessages] = useState<Messages>({})

  // Load messages when locale changes
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`/messages/${locale}.json`)
        if (response.ok) {
          const newMessages = await response.json()
          setMessages(newMessages)
        }
      } catch (error) {
        console.error(`Failed to load messages for locale ${locale}:`, error)
      }
    }

    loadMessages()
  }, [locale])

  // Load locale from localStorage and cookies on mount
  useEffect(() => {
    // Check localStorage first
    const savedLocale = localStorage.getItem('locale') as Locale
    
    // Check cookies as fallback
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] as Locale
    
    const preferredLocale = savedLocale || cookieLocale
    
    if (preferredLocale && (preferredLocale === 'en' || preferredLocale === 'es')) {
      setLocaleState(preferredLocale)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    
    // Set cookie for server-side access
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`
    
    // Force page reload to update server-side translations
    window.location.reload()
  }

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.')
    let value: any = messages

    // Navigate through nested object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to key if translation not found
        return key
      }
    }

    // If value is not a string, return the key
    if (typeof value !== 'string') {
      return key
    }

    // Replace parameters if provided
    if (params) {
      return Object.entries(params).reduce((text, [param, replacement]) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), replacement)
      }, value)
    }

    return value
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, messages, t }}>
      {children}
    </I18nContext.Provider>
  )
}

// Hook to use i18n
export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Hook for translations only (shorter)
export function useTranslations() {
  const { t } = useI18n()
  return t
}
