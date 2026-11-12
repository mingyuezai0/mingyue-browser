import { useEffect, useRef, useState } from 'react'
import { readStorage, writeStorage } from './storage'

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  delay = 0
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStorage<T>(key, initialValue))
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (delay === 0) {
      writeStorage(key, value)
      return
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => writeStorage(key, value), delay)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [key, value, delay])

  return [value, setValue]
}
