import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../constants/theme'

export default function Avatar({ username, size = 46, muted = false }) {
  const initial = (username || '?').slice(0, 1).toUpperCase()
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.32 }, muted && styles.muted]}>
      <Text style={[styles.initial, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenSoft },
  muted: { backgroundColor: colors.surfaceMuted },
  initial: { color: colors.green, fontWeight: '700' },
})
