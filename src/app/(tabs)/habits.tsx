import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HabitsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Hábitos — em breve</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#9ca3af' },
});
