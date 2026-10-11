import { Redirect, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import ErrorNotice from '../components/ErrorNotice'
import PrimaryButton from '../components/PrimaryButton'
import { colors, spacing } from '../constants/theme'
import { useAuth } from '../providers/AuthProvider'

export default function LoginRoute() {
  const router = useRouter()
  const { authenticate, currentUser, isReady } = useAuth()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (isReady && currentUser) return <Redirect href="/conversations" />

  async function handleSubmit() {
    setError('')
    setBusy(true)
    try {
      await authenticate({ username, password, createAccount: mode === 'register' })
      router.replace('/conversations')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function toggleMode() {
    setMode(current => current === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.logo}><Text style={styles.logoGlyph}>C</Text></View>
          <Text style={styles.eyebrow}>YOUR SPACE</Text>
          <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? 'Sign in to catch up with your people.' : 'Pick a username your friends can find.'}
          </Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                placeholder="e.g. alex"
                placeholderTextColor={colors.faint}
                returnKeyType="next"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.faint}
                returnKeyType="done"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
              />
            </View>
            <ErrorNotice>{error}</ErrorNotice>
            <PrimaryButton
              title={mode === 'login' ? 'Sign in' : 'Create account'}
              onPress={handleSubmit}
              loading={busy}
              disabled={username.trim().length < 2 || password.length < 8}
            />
          </View>

          <View style={styles.switchLine}>
            <Text style={styles.switchText}>{mode === 'login' ? 'New to Convo?' : 'Already have an account?'}</Text>
            <Pressable onPress={toggleMode} hitSlop={8}>
              <Text style={styles.switchAction}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center', backgroundColor: colors.surface, borderRadius: 24, padding: 27, borderWidth: 1, borderColor: colors.line },
  logo: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 23 },
  logoGlyph: { color: colors.white, fontSize: 23, fontWeight: '800' },
  eyebrow: { color: colors.faint, fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: 8 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  form: { gap: 17, marginTop: 28 },
  field: { gap: 8 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  input: { minHeight: 49, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FCFCFA', borderRadius: 12, color: colors.ink, fontSize: 15 },
  switchLine: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 23, flexWrap: 'wrap' },
  switchText: { color: colors.muted, fontSize: 13 },
  switchAction: { color: colors.green, fontSize: 13, fontWeight: '700' },
})
