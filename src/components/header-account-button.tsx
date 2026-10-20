import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Colors } from '@/theme';

export function HeaderAccountButton() {
  return (
    <Pressable
      onPress={() => router.push('/account')}
      accessibilityRole="button"
      accessibilityLabel="Account"
      hitSlop={12}
      style={{ paddingHorizontal: 8 }}>
      <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
    </Pressable>
  );
}
