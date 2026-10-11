import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../constants/theme'

export default function ErrorNotice({ children }) {
  if (!children) return null
  return (
    <View accessibilityRole="alert" style={styles.box}>
      <Text style={styles.text}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: '#F0D2CF', backgroundColor: colors.dangerSoft, borderRadius: 11, padding: 12 },
  text: { color: colors.danger, fontSize: 13, lineHeight: 19 },
})
