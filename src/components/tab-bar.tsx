import Ionicons from '@expo/vector-icons/Ionicons';
import type { ColorValue } from 'react-native';

import { HeaderAccountButton } from '@/components/header-account-button';
import type { IconName } from '@/components/ui';
import { Colors } from '@/theme';

export const tabScreenOptions = {
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: Colors.textMuted,
  headerTintColor: Colors.text,
  headerRight: () => <HeaderAccountButton />,
  sceneStyle: { backgroundColor: Colors.background },
};

export function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };
}
