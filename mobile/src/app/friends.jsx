import { Redirect, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Avatar from '../components/Avatar'
import ErrorNotice from '../components/ErrorNotice'
import { colors, spacing } from '../constants/theme'
import { getOrCreateConversation, searchUsers } from '../features/chat/chatApi'
import { useAuth } from '../providers/AuthProvider'

export default function FriendsRoute() {
  const router = useRouter()
  const { accessToken, currentUser, isReady } = useAuth()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectingId, setSelectingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const cleanQuery = query.trim()
    let cancelled = false
    const timer = setTimeout(() => {
      if (!accessToken || cleanQuery.length < 2) {
        setUsers([])
        setLoading(false)
        setError('')
        return
      }

      setLoading(true)
      setError('')
      searchUsers(cleanQuery, accessToken)
        .then(result => { if (!cancelled) setUsers(result) })
        .catch(requestError => { if (!cancelled) setError(requestError.message) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, cleanQuery.length < 2 ? 0 : 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [accessToken, query])

  if (isReady && !currentUser) return <Redirect href="/login" />
  if (!isReady || !currentUser) return null

  async function chooseUser(user) {
    setSelectingId(user.id)
    setError('')
    try {
      const conversation = await getOrCreateConversation(user.username, accessToken)
      router.replace({
        pathname: '/conversation/[id]',
        params: {
          id: String(conversation.id),
          otherUser: JSON.stringify(conversation.other_user || user),
        },
      })
    } catch (requestError) {
      setError(requestError.message)
      setSelectingId(null)
    }
  }

  function goBack() {
    if (router.canGoBack()) router.back()
    else router.replace('/conversations')
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backButton} accessibilityRole="button">
          <Text style={styles.backText}>‹  Messages</Text>
        </Pressable>
        <Text style={styles.eyebrow}>GROW YOUR CIRCLE</Text>
        <Text style={styles.title}>Find a friend</Text>
        <Text style={styles.subtitle}>Search their username to start a private chat.</Text>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          placeholder="Search usernames"
          placeholderTextColor={colors.faint}
          returnKeyType="search"
          style={styles.search}
          value={query}
          onChangeText={setQuery}
        />
        {loading && <ActivityIndicator color={colors.green} />}
      </View>

      {error ? <View style={styles.error}><ErrorNotice>{error}</ErrorNotice></View> : null}

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.results}>
        {users.map(user => (
          <Pressable
            key={user.id}
            disabled={selectingId !== null}
            onPress={() => chooseUser(user)}
            style={({ pressed }) => [styles.userRow, pressed && styles.pressed]}
          >
            <Avatar username={user.username} size={45} />
            <View style={styles.userCopy}>
              <Text style={styles.username}>@{user.username}</Text>
              <Text style={styles.userCaption}>Convo member</Text>
            </View>
            {selectingId === user.id
              ? <ActivityIndicator color={colors.green} />
              : <Text style={styles.addIcon}>＋</Text>}
          </Pressable>
        ))}
        {!loading && !error && users.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{query.trim().length < 2 ? 'Start with a username' : 'No users found'}</Text>
            <Text style={styles.emptyCopy}>{query.trim().length < 2
              ? 'Enter at least two characters to search.'
              : 'Try a different spelling and search again.'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingTop: 8, paddingBottom: 20 },
  backButton: { alignSelf: 'flex-start', marginBottom: 21, paddingVertical: 5, paddingRight: 10 },
  backText: { color: colors.green, fontSize: 14, fontWeight: '700' },
  eyebrow: { color: colors.faint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  title: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 7, lineHeight: 19 },
  searchWrap: { height: 47, marginHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line, backgroundColor: '#FAFAF8', borderRadius: 12, paddingHorizontal: 13, gap: 8 },
  searchIcon: { color: colors.muted, fontSize: 22, lineHeight: 24 },
  search: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 14, paddingVertical: 0 },
  error: { marginHorizontal: spacing.lg, marginTop: 14 },
  results: { paddingTop: 12, paddingBottom: 30, flexGrow: 1 },
  userRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: 12 },
  userCopy: { flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, height: '100%', justifyContent: 'center' },
  username: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  userCaption: { color: colors.faint, fontSize: 11, marginTop: 4 },
  addIcon: { width: 30, height: 30, borderRadius: 10, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', color: colors.green, backgroundColor: colors.greenSoft, fontSize: 21 },
  empty: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  emptyCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  pressed: { backgroundColor: colors.surfaceMuted },
})
