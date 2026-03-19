import { Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/core/auth/useAuth';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, signOut, isLoading } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('home.title')}</Text>
      <Text style={styles.welcome}>{t('home.welcome')}</Text>
      {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}

      <Button mode="outlined" onPress={signOut} disabled={isLoading} style={styles.button}>
        {t('home.signOut')}
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  welcome: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 40,
  },
  button: {
    width: '100%',
  },
});
