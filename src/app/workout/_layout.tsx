import { Stack } from 'expo-router';

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: true,
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen name="[id]" options={{ headerBackVisible: true }} />
      <Stack.Screen name="summary/[sessionId]" options={{ headerBackVisible: false }} />
    </Stack>
  );
}
