import { StyleSheet, Text, View } from 'react-native';

import { colors, useLayout } from '../theme';
import { FocusButton } from './FocusButton';

type Props = {
  message: string;
  detail?: string;
  action?: { label: string; onPress: () => void; preferredFocus?: boolean };
  align?: 'start' | 'center';
};

/** Shared empty/error body. The action is a focusable button so it works with a remote. */
export function StateMessage({ message, detail, action, align = 'start' }: Props) {
  const layout = useLayout();
  const center = align === 'center';

  return (
    <View style={[styles.container, center && styles.centered]}>
      <Text style={[styles.message, { fontSize: layout.bodySize }, center && styles.centerText]}>{message}</Text>
      {detail ? (
        <Text style={[styles.detail, { fontSize: layout.bodySize * 0.8 }, center && styles.centerText]}>{detail}</Text>
      ) : null}
      {action ? (
        <View style={styles.action}>
          <FocusButton label={action.label} onPress={action.onPress} preferredFocus={action.preferredFocus} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', gap: 8, paddingVertical: 12 },
  centered: { alignItems: 'center' },
  message: { color: colors.text },
  detail: { color: colors.muted },
  centerText: { textAlign: 'center' },
  action: { marginTop: 4 },
});
