import { Stack } from 'expo-router';

export default function CardioLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: true,
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="complete/[id]" />
    </Stack>
  );
}
