import { Pressable, StyleSheet, Text, View } from 'react-native'
import Avatar from '../../components/Avatar'
import { colors } from '../../constants/theme'

export default function ConversationRow({ conversation, currentUserId, onPress }) {
  const lastMessage = conversation.last_message
  const preview = lastMessage
    ? `${lastMessage.sender === currentUserId ? 'You: ' : ''}${lastMessage.body}`
    : 'Say hello 👋'

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Avatar username={conversation.other_user?.username} size={50} />
      <View style={styles.details}>
        <View style={styles.top}>
          <Text style={styles.name}>@{conversation.other_user?.username || 'unknown'}</Text>
          <Text style={styles.time}>
            {lastMessage ? new Date(lastMessage.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.preview}>{preview}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, gap: 13 },
  details: { flex: 1, minWidth: 0, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, height: '100%' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 },
  name: { color: colors.ink, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  time: { color: colors.faint, fontSize: 11 },
  preview: { color: colors.muted, fontSize: 13 },
  pressed: { backgroundColor: colors.surfaceMuted },
})
