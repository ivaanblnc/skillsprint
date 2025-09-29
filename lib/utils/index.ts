/**
 * Utilidades para formateo y helpers comunes
 * Centralizando lógica reutilizable
 */

import { ChallengeDifficulty, SubmissionStatus } from '@/lib/types'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function for merging classes (ya existe en utils.ts pero la mejoramos)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export const formatDate = {
  short: (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  },
  
  long: (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },

  relative: (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    
    return formatDate.short(d)
  }
}

// Badge variant utilities
export const getBadgeVariant = {
  difficulty: (difficulty: ChallengeDifficulty) => {
    switch (difficulty) {
      case 'EASY': return 'default'
      case 'MEDIUM': return 'secondary'
      case 'HARD': return 'destructive'
      default: return 'outline'
    }
  },

  status: (status: SubmissionStatus) => {
    switch (status) {
      case 'ACCEPTED': return 'default'
      case 'PENDING': return 'secondary'
      case 'WRONG_ANSWER': return 'destructive'
      case 'TIME_LIMIT_EXCEEDED': return 'destructive'
      case 'RUNTIME_ERROR': return 'destructive'
      case 'COMPILATION_ERROR': return 'destructive'
      case 'REJECTED': return 'destructive'
      default: return 'outline'
    }
  }
}

// Text utilities
export const getStatusText = (status: SubmissionStatus, t: (key: string) => string) => {
  const statusMap = {
    ACCEPTED: 'submissions.status.accepted',
    PENDING: 'submissions.status.pending',
    WRONG_ANSWER: 'submissions.status.wrongAnswer',
    TIME_LIMIT_EXCEEDED: 'submissions.status.timeLimit',
    RUNTIME_ERROR: 'submissions.status.runtimeError',
    COMPILATION_ERROR: 'submissions.status.compilationError',
    REJECTED: 'submissions.status.rejected'
  }
  
  return t(statusMap[status] || 'submissions.status.unknown')
}

// Number formatting utilities
export const formatNumber = {
  compact: (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  },

  percentage: (num: number, decimals: number = 1) => {
    return `${num.toFixed(decimals)}%`
  },

  score: (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'N/A'
    return `${score}/100`
  }
}

// User name utilities
export const formatUserName = (email: string) => {
  const emailName = email.split('@')[0]
  return emailName
    .replace(/[._]/g, ' ')
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// URL utilities
export const createSearchParams = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value.toString())
    }
  })
  
  return searchParams.toString()
}

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Local storage utilities with error handling
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  }
}

// Validation utilities
export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  required: (value: string | null | undefined): boolean => {
    return value !== null && value !== undefined && value.trim() !== ''
  },

  minLength: (value: string, min: number): boolean => {
    return value.length >= min
  },

  positiveNumber: (value: number): boolean => {
    return typeof value === 'number' && value > 0
  }
}

// Duration formatting utility
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}
