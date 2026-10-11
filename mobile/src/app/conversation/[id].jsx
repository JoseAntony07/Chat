import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Avatar from '../../components/Avatar'
import ErrorNotice from '../../components/ErrorNotice'
import { colors } from '../../constants/theme'
import { listMessages } from '../../features/chat/chatApi'
import useChatSocket from '../../features/chat/useChatSocket'
import { useAuth } from '../../providers/AuthProvider'

function parseOtherUser(value) {
  if (!value || Array.isArray(value)) return null
  try { return JSON.parse(value) } catch { return null }
}

function MessageBubble({ message, isMine }) {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return (
    <View style={[styles.messageRow, isMine ? styles.messageMine : styles.messageOther]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{message.body}</Text>
      </View>
      <Text style={[styles.messageMeta, isMine && styles.messageMetaMine]}>
        {time}{isMine ? '  ✓' : ''}
      </Text>
    </View>
  )
}

export default function ConversationRoute() {
  const router = useRouter()
  const { id, otherUser: otherUserParam } = useLocalSearchParams()
  const { accessToken, currentUser, isReady } = useAuth()
  const otherUser = parseOtherUser(otherUserParam)
  const conversationId = Array.isArray(id) ? id[0] : id
  const [messages, setMessages] = useState([])
  const [loadState, setLoadState] = useState({ id: null, status: 'loading', error: '' })
  const historyLoaded = loadState.id === String(conversationId) && loadState.status === 'loaded'
  const loadingError = loadState.id === String(conversationId) ? loadState.error : ''
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    listMessages(conversationId, accessToken)
      .then(result => {
        if (!cancelled) {
          setMessages(result)
          setLoadState({ id: String(conversationId), status: 'loaded', error: '' })
        }
      })
      .catch(requestError => {
        if (!cancelled) setLoadState({ id: String(conversationId), status: 'error', error: requestError.message })
      })

    return () => { cancelled = true }
  }, [accessToken, conversationId])

  const handleIncomingMessage = useCallback(message => {
    setMessages(previous => previous.some(item => item.id === message.id)
      ? previous
      : [...previous, message])
  }, [])

  const { status, sendMessage } = useChatSocket({
    conversationId,
    token: accessToken,
    enabled: historyLoaded && !loadingError,
    onMessage: handleIncomingMessage,
  })

  useEffect(() => {
    if (messages.length) listRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  if (isReady && !currentUser) return <Redirect href="/login" />
  if (!isReady || !currentUser) return null

  function sendDraft() {
    const body = draft.trim()
    if (!body) return
    if (!sendMessage(body)) {
      setSendError('Reconnecting to chat… Your message is still in the box. Try again when connected.')
      return
    }
    setDraft('')
    setSendError('')
  }

  function goBack() {
    if (router.canGoBack()) router.back()
    else router.replace('/conversations')
  }

  const connectionLabel = status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting…' : status
  const showStatusError = status !== 'connected' && status !== 'connecting' && status !== 'disconnected'

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <Pressable onPress={goBack} accessibilityRole="button" style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Avatar username={otherUser?.username} size={43} />
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.username}>@{otherUser?.username || 'Conversation'}</Text>
            <Text numberOfLines={1} style={[styles.connection, status === 'connected' && styles.connected]}>
              {connectionLabel}
            </Text>
          </View>
        </View>

        {loadingError || sendError || (showStatusError ? status : '')
          ? <View style={styles.error}><ErrorNotice>{loadingError || sendError || status}</ErrorNotice></View>
          : null}

        {loadingError ? (
          <View style={styles.loadingError}>
            <Text style={styles.loadingErrorTitle}>Could not load this conversation</Text>
            <Pressable onPress={() => router.replace('/conversations')}><Text style={styles.backToChats}>Back to messages</Text></Pressable>
          </View>
        ) : historyLoaded ? (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={message => String(message.id)}
            renderItem={({ item }) => (
              <MessageBubble message={item} isMine={item.sender === currentUser.id} />
            )}
            contentContainerStyle={messages.length ? styles.messageList : styles.emptyThread}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListHeaderComponent={(
              <View style={styles.intro}>
                <Avatar username={otherUser?.username} size={70} />
                <Text style={styles.introName}>@{otherUser?.username}</Text>
                <Text style={styles.introText}>Your private conversation</Text>
                <Text style={styles.divider}>MESSAGES</Text>
              </View>
            )}
            ListEmptyComponent={(
              <Text style={styles.emptyHint}>Say hello to start chatting 👋</Text>
            )}
          />
        ) : (
          <View style={styles.loading}><ActivityIndicator color={colors.green} /></View>
        )}

        <View style={styles.composerArea}>
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel={`Message @${otherUser?.username || 'friend'}`}
              editable={!loadingError}
              maxLength={5000}
              multiline
              placeholder={`Message @${otherUser?.username || 'friend'}`}
              placeholderTextColor={colors.faint}
              style={styles.input}
              value={draft}
              onChangeText={value => { setDraft(value); setSendError('') }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={!draft.trim() || Boolean(loadingError)}
              onPress={sendDraft}
              style={({ pressed }) => [styles.sendButton, !draft.trim() && styles.sendDisabled, pressed && styles.sendPressed]}
            >
              <Text style={styles.sendGlyph}>➤</Text>
            </Pressable>
          </View>
          <View style={styles.composerFooter}>
            <Text style={styles.footerHint}>Messages send in real time</Text>
            <Text style={styles.footerCount}>{draft.length}/5000</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  page: { flex: 1, backgroundColor: colors.surface },
  header: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  backButton: { width: 35, height: 42, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.green, fontSize: 34, lineHeight: 38, fontWeight: '300' },
  headerCopy: { flex: 1, minWidth: 0 },
  username: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  connection: { color: colors.faint, fontSize: 11, marginTop: 3 },
  connected: { color: colors.green },
  error: { paddingHorizontal: 13, paddingTop: 10 },
  messageList: { paddingHorizontal: 13, paddingBottom: 18 },
  emptyThread: { flexGrow: 1, paddingHorizontal: 13, paddingBottom: 18 },
  intro: { alignItems: 'center', paddingTop: 26, paddingBottom: 20 },
  introName: { color: colors.ink, fontSize: 16, fontWeight: '800', marginTop: 11 },
  introText: { color: colors.muted, fontSize: 12, marginTop: 4 },
  divider: { color: colors.faint, fontSize: 9, letterSpacing: 1.7, fontWeight: '700', marginTop: 27, marginBottom: 8 },
  messageRow: { maxWidth: '84%', marginTop: 11 },
  messageMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 17, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: colors.greenSoft, borderBottomRightRadius: 5 },
  bubbleOther: { backgroundColor: colors.surfaceMuted, borderBottomLeftRadius: 5 },
  messageText: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  messageTextMine: { color: '#43513E' },
  messageMeta: { color: colors.faint, fontSize: 10, marginTop: 5, paddingHorizontal: 2 },
  messageMetaMine: { textAlign: 'right' },
  emptyHint: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 13 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingError: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  loadingErrorTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  backToChats: { color: colors.green, fontWeight: '700' },
  composerArea: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface },
  composer: { minHeight: 48, maxHeight: 130, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: '#FCFCFA', paddingLeft: 13, paddingRight: 6, paddingVertical: 5, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 36, maxHeight: 112, color: colors.ink, fontSize: 14, paddingTop: 8, paddingBottom: 7 },
  sendButton: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, marginBottom: 1 },
  sendDisabled: { backgroundColor: colors.surfaceMuted },
  sendPressed: { opacity: 0.78 },
  sendGlyph: { color: colors.white, fontSize: 18, lineHeight: 22, transform: [{ rotate: '-35deg' }], marginLeft: 2 },
  composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  footerHint: { color: colors.faint, fontSize: 10 },
  footerCount: { color: colors.faint, fontSize: 10 },
})
