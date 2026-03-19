import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="workout" options={{ title: t('tabs.workout') }} />
      <Tabs.Screen name="cardio" options={{ title: t('tabs.cardio') }} />
      <Tabs.Screen name="habits" options={{ title: t('tabs.habits') }} />
      <Tabs.Screen name="history" options={{ title: t('tabs.history') }} />
    </Tabs>
  );
}
