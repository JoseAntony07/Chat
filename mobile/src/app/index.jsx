import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuth } from '../providers/AuthProvider'
import { colors } from '../constants/theme'

export default function IndexRoute() {
  const { currentUser, isReady } = useAuth()

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.green} />
      </View>
    )
  }

  return <Redirect href={currentUser ? '/conversations' : '/login'} />
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
})
