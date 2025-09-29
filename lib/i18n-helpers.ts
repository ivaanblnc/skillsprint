// Helper puro para traducción, seguro para Client Components
export function translate(messages: Record<string, any>, key: string, params?: Record<string, string>): string {
  const keys = key.split('.')
  let value: any = messages

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key
    }
  }

  if (typeof value !== 'string') {
    return key
  }

  if (params) {
    return Object.entries(params).reduce((text, [param, replacement]) => {
      return text.replace(new RegExp(`{{${param}}}`, 'g'), replacement)
    }, value)
  }

  return value
}
