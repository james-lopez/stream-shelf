import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, useLayout } from '../theme';

type Props = {
  message: string;
  detail?: string;
  action?: { label: string; onPress: () => void };
};

/** Shared empty/error body. The action is a focusable button so it works with a remote. */
export function StateMessage({ message, detail, action }: Props) {
  const layout = useLayout();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.message, { fontSize: layout.bodySize }]}>{message}</Text>
      {detail ? <Text style={[styles.detail, { fontSize: layout.bodySize * 0.8 }]}>{detail}</Text> : null}
      {action ? (
        <Pressable
          onPress={action.onPress}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityRole="button"
          style={[styles.button, focused && styles.buttonFocused]}
        >
          <Text style={[styles.buttonText, { fontSize: layout.bodySize }, focused && styles.buttonTextFocused]}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', gap: 8, paddingVertical: 12 },
  message: { color: colors.text },
  detail: { color: colors.muted },
  button: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.muted,
  },
  buttonFocused: { borderColor: colors.focus, backgroundColor: colors.focus },
  buttonText: { color: colors.text },
  buttonTextFocused: { color: colors.background },
});
