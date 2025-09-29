/**
 * Hooks personalizados para lógica de UI reutilizable
 * Implementando separation of concerns y reusabilidad
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { debounce, validation } from '@/lib/utils/index'
import { FilterState, ChallengeCreateFormData, CreateTestCase } from '@/lib/types'

// Hook para manejo de loading states
export const useAsyncState = <T>(
  initialValue: T
) => {
  const [data, setData] = useState<T>(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async <R = T>(asyncFunction: () => Promise<R>): Promise<R> => {
    try {
      setLoading(true)
      setError(null)
      const result = await asyncFunction()
      setData(result as unknown as T)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setData(initialValue)
    setError(null)
    setLoading(false)
  }, [initialValue])

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData
  }
}

// Hook para search con debounce
export const useDebounceSearch = (
  initialValue: string = '',
  delay: number = 300
) => {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)

  const debouncedUpdate = useMemo(
    () => debounce((newValue: string) => {
      setDebouncedValue(newValue)
    }, delay),
    [delay]
  )

  useEffect(() => {
    debouncedUpdate(value)
  }, [value, debouncedUpdate])

  return {
    value,
    debouncedValue,
    setValue
  }
}

// Hook para manejo de filtros
export const useFilters = (initialFilters: FilterState = {}) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters)

  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => 
      value !== undefined && value !== null && value !== ''
    )
  }, [filters])

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    setFilters
  }
}

// Hook para localStorage con SSR safety
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}

// Hook para manejo de estados de formulario
export const useFormState = <T extends Record<string, any>>(
  initialState: T,
  validationRules?: Partial<Record<keyof T, (value: any) => string | null>>
) => {
  const [values, setValues] = useState<T>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const setValue = useCallback(<K extends keyof T>(
    key: K,
    value: T[K]
  ) => {
    setValues(prev => ({ ...prev, [key]: value }))
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }))
    }
  }, [errors])

  const markTouched = useCallback(<K extends keyof T>(key: K) => {
    setTouched(prev => ({ ...prev, [key]: true }))
  }, [])

  const validate = useCallback(() => {
    if (!validationRules) return true

    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.entries(validationRules).forEach(([key, rule]) => {
      if (rule) {
        const error = rule(values[key as keyof T])
        if (error) {
          newErrors[key as keyof T] = error
          isValid = false
        }
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validationRules])

  const reset = useCallback(() => {
    setValues(initialState)
    setErrors({})
    setTouched({})
  }, [initialState])

  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => error !== undefined)
  }, [errors])

  return {
    values,
    errors,
    touched,
    setValue,
    markTouched,
    validate,
    reset,
    hasErrors,
    isValid: !hasErrors
  }
}

// Hook para scroll infinito
export const useInfiniteScroll = (
  callback: () => void,
  hasMore: boolean = true
) => {
  useEffect(() => {
    if (!hasMore) return

    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        callback()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [callback, hasMore])
}

// Hook para detectar clicks fuera de un elemento
export const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ref, callback])
}

// Hook para manejo de paginación
export const usePagination = (
  totalItems: number,
  itemsPerPage: number = 10
) => {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const reset = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    reset
  }
}

// Hook para debounce de valores
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para manejo de favoritos/likes
export const useFavorites = (initialFavorites: string[] = []) => {
  const [favorites, setFavorites] = useState<string[]>(initialFavorites)
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const toggleFavorite = useCallback(async (id: string) => {
    setLoading(prev => ({ ...prev, [id]: true }))
    
    try {
      const isFavorite = favorites.includes(id)
      const newFavorites = isFavorite
        ? favorites.filter(fav => fav !== id)
        : [...favorites, id]
      
      setFavorites(newFavorites)
      
      // API call to persist favorite status
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: isFavorite ? 'remove' : 'add' })
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)
      // Revert on error
      setFavorites(prev => prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
      )
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }))
    }
  }, [favorites])

  const isFavorite = useCallback((id: string) => {
    return favorites.includes(id)
  }, [favorites])

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    loading
  }
}

// Hook para manejo de notificaciones
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: Date
  }>>([])

  const addNotification = useCallback((notification: {
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
  }) => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, {
      ...notification,
      id,
      timestamp: new Date()
    }])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  }
}

// Challenge specific hooks
export function useChallengeForm(initialData?: Partial<ChallengeCreateFormData>) {
  return useFormState<ChallengeCreateFormData>(
    {
      title: initialData?.title || '',
      description: initialData?.description || '',
      difficulty: initialData?.difficulty || 'EASY',
      points: initialData?.points || 100,
      timeLimit: initialData?.timeLimit || 30,
      startDate: initialData?.startDate || new Date(),
      endDate: initialData?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      testCases: initialData?.testCases || [{ input: '', expectedOutput: '', isPublic: true }]
    },
    {
      title: (value) => !validation.required(value) ? "Title is required" : null,
      description: (value) => !validation.required(value) ? "Description is required" : null,
      difficulty: (value) => !validation.required(value) ? "Difficulty is required" : null,
      points: (value) => !validation.positiveNumber(value) ? "Points must be positive" : null,
      timeLimit: (value) => !validation.positiveNumber(value) ? "Time limit must be positive" : null,
      testCases: (value) => !value || value.length === 0 ? "At least one test case is required" : null
    }
  )
}

export function useTestCases(initialTestCases: CreateTestCase[] = []) {
  const [testCases, setTestCases] = React.useState<CreateTestCase[]>(
    initialTestCases.length > 0 ? initialTestCases : [{ input: '', expectedOutput: '', isPublic: true }]
  )

  const addTestCase = () => {
    setTestCases(prev => [...prev, { input: '', expectedOutput: '', isPublic: true }])
  }

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateTestCase = (index: number, field: keyof CreateTestCase, value: any) => {
    setTestCases(prev => prev.map((tc, i) => 
      i === index ? { ...tc, [field]: value } : tc
    ))
  }

  return {
    testCases,
    addTestCase,
    removeTestCase,
    updateTestCase,
    setTestCases
  }
}

export function useChallengeActions() {
  const { loading, execute } = useAsyncState(null)

  const createChallenge = async (data: ChallengeCreateFormData) => {
    return execute(async () => {
      // Preparar los datos para la API con fechas como strings y status
      const apiData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        status: 'ACTIVE' // Por defecto activo
      }
      
      console.log('API payload:', apiData)
      
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('API error response:', error)
        throw new Error(error.message || 'Failed to create challenge')
      }

      return response.json()
    })
  }

  const updateChallengeStatus = async (challengeId: string, status: string) => {
    return execute(async () => {
      const response = await fetch(`/api/challenges/${challengeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update challenge status')
      }

      return response.json()
    })
  }

  const deleteChallenge = async (challengeId: string) => {
    return execute(async () => {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete challenge')
      }

      return response.json()
    })
  }

  const submitChallenge = async (challengeId: string, submissionData: {
    code?: string
    language?: string
    fileUrl?: string
    isDraft: boolean
  }) => {
    return execute(async () => {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          ...submissionData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit solution')
      }

      return response.json()
    })
  }

  return {
    loading,
    createChallenge,
    updateChallengeStatus,
    deleteChallenge,
    submitChallenge
  }
}
