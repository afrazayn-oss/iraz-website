import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Colors, Radius, Spacing } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children,
  refreshing,
  onRefresh,
  contentStyle,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.screenContent, contentStyle]}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
        }>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Body({ children, muted, onPress }: { children: ReactNode; muted?: boolean; onPress?: () => void }) {
  return (
    <Text style={[styles.body, muted && styles.muted, onPress && styles.link]} onPress={onPress}>
      {children}
    </Text>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return <Text style={styles.caption}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  const isDisabled = disabled || loading;
  const color = variant === 'primary' ? Colors.primaryText : variant === 'danger' ? Colors.danger : Colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={color} />}
          <Text style={[styles.buttonText, { color }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.textMuted}
        {...props}
        style={[styles.input, props.multiline && styles.inputMultiline, error && styles.inputError]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color={Colors.textMuted} />
      <Text style={styles.heading}>{title}</Text>
      {message ? <Text style={[styles.body, styles.muted, styles.center]}>{message}</Text> : null}
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        {icon && <Ionicons name={icon} size={22} color={Colors.primary} />}
        <View style={styles.flex}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.caption}>{subtitle}</Text> : null}
        </View>
        {right}
        {onPress && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
      </View>
    </Card>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <Text style={styles.errorText}>{children}</Text>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: Colors.background },
  screenContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text },
  heading: { fontSize: 18, fontWeight: '600', color: Colors.text },
  body: { fontSize: 16, lineHeight: 23, color: Colors.text },
  muted: { color: Colors.textMuted },
  link: { color: Colors.primary, textDecorationLine: 'underline' },
  center: { textAlign: 'center' },
  caption: { fontSize: 13, lineHeight: 18, color: Colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  button: {
    minHeight: 48,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: Colors.primary },
  buttonSecondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary },
  buttonDanger: { borderColor: Colors.danger },
  buttonText: { fontSize: 16, fontWeight: '600' },
  field: { gap: Spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  inputMultiline: { minHeight: 120, textAlignVertical: 'top' },
  inputError: { borderColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: 14 },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.text },
  chipTextSelected: { color: Colors.primaryText },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});
