import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { getCurrentUser, registerAccount, signIn } from '../features/auth/authApi'

const TOKEN_STORAGE_KEY = 'convo.auth.tokens'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        const savedTokens = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY)
        if (!savedTokens) return

        const parsedTokens = JSON.parse(savedTokens)
        const user = await getCurrentUser(parsedTokens.access)
        if (!cancelled) {
          setTokens(parsedTokens)
          setCurrentUser(user)
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY)
      } finally {
        if (!cancelled) setIsReady(true)
      }
    }

    restoreSession()
    return () => { cancelled = true }
  }, [])

  const authenticate = useCallback(async ({ username, password, createAccount }) => {
    const cleanUsername = username.trim()
    if (createAccount) await registerAccount(cleanUsername, password)

    const tokenPair = await signIn(cleanUsername, password)
    const user = await getCurrentUser(tokenPair.access)
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, JSON.stringify(tokenPair))
    setTokens(tokenPair)
    setCurrentUser(user)
  }, [])

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY)
    setTokens(null)
    setCurrentUser(null)
  }, [])

  const value = useMemo(() => ({
    accessToken: tokens?.access || null,
    currentUser,
    isReady,
    authenticate,
    logout,
  }), [tokens, currentUser, isReady, authenticate, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
