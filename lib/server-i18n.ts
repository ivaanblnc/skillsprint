import { cookies } from 'next/headers'
import { readFileSync } from 'fs'
import { join } from 'path'

export type Locale = 'en' | 'es'

// Función para obtener el locale desde cookies o usar default
export async function getLocale(): Promise<Locale> {
  const cookieStore = cookies()
  const locale = cookieStore.get('locale')?.value as Locale
  return locale && (locale === 'en' || locale === 'es') ? locale : 'en'
}

// Función para obtener las traducciones del servidor
export async function getMessages(locale?: Locale): Promise<Record<string, any>> {
  const currentLocale = locale || await getLocale()
  
  try {
    const messagesPath = join(process.cwd(), 'public', 'messages', `${currentLocale}.json`)
    const messages = JSON.parse(readFileSync(messagesPath, 'utf8'))
    return messages
  } catch (error) {
    console.error(`Failed to load messages for locale ${currentLocale}:`, error)
    // Fallback to English if current locale fails
    if (currentLocale !== 'en') {
      try {
        const messagesPath = join(process.cwd(), 'public', 'messages', 'en.json')
        const messages = JSON.parse(readFileSync(messagesPath, 'utf8'))
        return messages
      } catch (fallbackError) {
        console.error('Failed to load fallback messages:', fallbackError)
        return {}
      }
    }
    return {}
  }
}

// Función para traducir una clave
export function translate(messages: Record<string, any>, key: string, params?: Record<string, string>): string {
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
