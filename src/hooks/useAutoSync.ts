"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const STORAGE_KEY = "hubz-foc-auto-sync-enabled"

function getStoredEnabled(): boolean {
    if (typeof window === "undefined") return false
    try {
        return localStorage.getItem(STORAGE_KEY) === "true"
    } catch {
        return false
    }
}

function setStoredEnabled(value: boolean) {
    try {
        localStorage.setItem(STORAGE_KEY, String(value))
    } catch {}
}

export function useAutoSync(
    handleSync: () => void,
    isPending: boolean,
    interval: number = 30000,
    enabled: boolean
) {
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
    const [nextSyncIn, setNextSyncIn] = useState(interval)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const syncedAtRef = useRef(lastSyncedAt)
    const handleSyncRef = useRef(handleSync)

    syncedAtRef.current = lastSyncedAt
    handleSyncRef.current = handleSync

    const resetTimer = useCallback(() => {
        setNextSyncIn(interval)
    }, [interval])

    useEffect(() => {
        if (!enabled) {
            if (timerRef.current) clearInterval(timerRef.current)
            if (countdownRef.current) clearInterval(countdownRef.current)
            timerRef.current = null
            countdownRef.current = null
            return
        }

        setNextSyncIn(interval)

        countdownRef.current = setInterval(() => {
            setNextSyncIn((prev) => Math.max(0, prev - 1000))
        }, 1000)

        timerRef.current = setInterval(() => {
            if (document.visibilityState === "hidden") return
            handleSyncRef.current()
            setLastSyncedAt(new Date())
            setNextSyncIn(interval)
        }, interval)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (countdownRef.current) clearInterval(countdownRef.current)
            timerRef.current = null
            countdownRef.current = null
        }
    }, [enabled, interval])

    useEffect(() => {
        if (!enabled) return

        const onVisible = () => {
            if (syncedAtRef.current) {
                const elapsed = Date.now() - syncedAtRef.current.getTime()
                if (elapsed >= interval) {
                    handleSyncRef.current()
                    setLastSyncedAt(new Date())
                    setNextSyncIn(interval)
                } else {
                    setNextSyncIn(interval - elapsed)
                }
            }
        }

        document.addEventListener("visibilitychange", onVisible)
        return () => document.removeEventListener("visibilitychange", onVisible)
    }, [enabled, interval])

    useEffect(() => {
        if (isPending && enabled) {
            resetTimer()
        }
    }, [isPending, enabled, resetTimer])

    return { lastSyncedAt, nextSyncIn, resetTimer }
}

export function useAutoSyncEnabled() {
    const [enabled, setEnabled] = useState(getStoredEnabled)

    const toggle = useCallback(() => {
        setEnabled((prev) => {
            const next = !prev
            setStoredEnabled(next)
            return next
        })
    }, [])

    return { autoSyncEnabled: enabled, toggleAutoSync: toggle }
}
