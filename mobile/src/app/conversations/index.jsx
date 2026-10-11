import { Redirect, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Avatar from '../../components/Avatar'
import ErrorNotice from '../../components/ErrorNotice'
import ConversationRow from '../../features/chat/ConversationRow'
import { listConversations } from '../../features/chat/chatApi'
import { colors, spacing } from '../../constants/theme'
import { useAuth } from '../../providers/AuthProvider'

export default function ConversationsRoute() {
  const router = useRouter()
  const { accessToken, currentUser, isReady, logout } = useAuth()
  const [conversations, setConversations] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConversations = useCallback(async () => {
    try {
      const result = await listConversations(accessToken)
      setConversations(result)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useFocusEffect(useCallback(() => {
    if (!accessToken) return undefined
    let cancelled = false
    listConversations(accessToken)
      .then(result => {
        if (!cancelled) {
          setConversations(result)
          setError('')
        }
      })
      .catch(requestError => { if (!cancelled) setError(requestError.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [accessToken]))

  const filteredConversations = useMemo(() => conversations.filter(conversation =>
    (conversation.other_user?.username || '').toLowerCase().includes(query.trim().toLowerCase()),
  ), [conversations, query])

  if (isReady && !currentUser) return <Redirect href="/login" />
  if (!isReady || !currentUser) return null

  function openConversation(conversation) {
    router.push({
      pathname: '/conversation/[id]',
      params: {
        id: String(conversation.id),
        otherUser: JSON.stringify(conversation.other_user),
      },
    })
  }

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <View style={styles.profile}>
          <Avatar username={currentUser.username} size={43} />
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>SIGNED IN AS @{currentUser.username}</Text>
            <Text style={styles.title}>Messages</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <TextInput
          accessibilityLabel="Search conversations"
          placeholder="Search conversations"
          placeholderTextColor={colors.faint}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        <Pressable accessibilityRole="button" onPress={() => router.push('/friends')} style={styles.addButton}>
          <Text style={styles.addButtonText}>＋  Find people</Text>
        </Pressable>
      </View>

      {error ? <View style={styles.error}><ErrorNotice>{error}</ErrorNotice></View> : null}

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.green} /></View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={conversation => String(conversation.id)}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              currentUserId={currentUser.id}
              onPress={() => openConversation(item)}
            />
          )}
          contentContainerStyle={filteredConversations.length ? styles.list : styles.emptyList}
          refreshing={loading}
          onRefresh={loadConversations}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Text style={styles.emptyGlyph}>C</Text></View>
              <Text style={styles.emptyTitle}>{query ? 'No matching conversations' : 'No conversations yet'}</Text>
              <Text style={styles.emptyText}>{query
                ? 'Try another username.'
                : 'Find a friend by username to start a private chat.'}</Text>
              <Pressable onPress={() => router.push('/friends')} style={styles.emptyAction}>
                <Text style={styles.emptyActionText}>Find a friend</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingTop: 13, paddingBottom: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headingCopy: { flex: 1 },
  eyebrow: { color: colors.faint, fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginBottom: 3 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '800', letterSpacing: -0.7 },
  logoutButton: { borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: colors.surfaceMuted },
  logoutText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  actions: { paddingHorizontal: spacing.lg, gap: 10, paddingBottom: 14 },
  search: { height: 45, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: '#FAFAF8', paddingHorizontal: 14, color: colors.ink, fontSize: 14 },
  addButton: { minHeight: 43, borderRadius: 12, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: colors.greenDark, fontSize: 13, fontWeight: '700' },
  error: { paddingHorizontal: spacing.lg, paddingBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 12 },
  emptyList: { flexGrow: 1 },
  empty: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 35 },
  emptyIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenSoft, marginBottom: 18 },
  emptyGlyph: { color: colors.green, fontSize: 23, fontWeight: '800' },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 7 },
  emptyAction: { paddingHorizontal: 17, paddingVertical: 11, borderRadius: 11, backgroundColor: colors.green, marginTop: 19 },
  emptyActionText: { color: colors.white, fontSize: 13, fontWeight: '700' },
})
