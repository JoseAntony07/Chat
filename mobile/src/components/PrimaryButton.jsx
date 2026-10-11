import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../constants/theme'

export default function PrimaryButton({ title, onPress, disabled = false, loading = false, secondary = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {loading
        ? <ActivityIndicator color={secondary ? colors.green : colors.white} />
        : <Text style={[styles.label, secondary && styles.secondaryLabel]}>{title}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { minHeight: 50, borderRadius: 13, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  secondary: { backgroundColor: colors.greenSoft },
  label: { color: colors.white, fontSize: 15, fontWeight: '700' },
  secondaryLabel: { color: colors.greenDark },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
})
