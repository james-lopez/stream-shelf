import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { takePreferredFocus } from '../focus/webFocus';
import { colors, useLayout } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  icon?: (color: string) => ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  /** Initial focus when the screen opens: hasTVPreferredFocus on TV, claimed on web. */
  preferredFocus?: boolean;
  /** Called with the button's view when it gains focus. */
  onFocused?: (node: View | null) => void;
};

/** Remote-friendly button: focus inverts it rather than relying on hover or press states. */
export function FocusButton({ label, onPress, icon, variant = 'secondary', disabled, preferredFocus, onFocused }: Props) {
  const [focused, setFocused] = useState(false);
  const layout = useLayout();
  const ref = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && preferredFocus && !disabled) takePreferredFocus(ref.current);
  }, [preferredFocus, disabled]);

  const color = focused ? colors.background : colors.text;

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onFocused?.(ref.current);
      }}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      hasTVPreferredFocus={preferredFocus}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        { paddingHorizontal: layout.tenFoot ? 28 : 18, paddingVertical: layout.tenFoot ? 14 : 10 },
        variant === 'primary' && styles.primary,
        focused && styles.focused,
        disabled && styles.disabled,
      ]}
    >
      {icon ? icon(color) : null}
      <Text style={[styles.label, { fontSize: layout.bodySize, color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.muted,
  },
  primary: { borderColor: colors.accent, backgroundColor: colors.accent },
  focused: { borderColor: colors.focus, backgroundColor: colors.focus },
  disabled: { opacity: 0.5 },
  label: { fontWeight: '600' },
});
