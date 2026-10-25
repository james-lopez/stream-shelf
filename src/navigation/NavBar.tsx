import { useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoMark } from '../components/Brand';
import { FocusGuide } from '../components/FocusGuide';
import { HomeIcon, MyListIcon } from '../components/icons';
import { colors, useLayout } from '../theme';
import type { RootStackParamList } from './types';

export type NavRoute = keyof RootStackParamList;

const ITEMS: { route: NavRoute; label: string; Icon: ComponentType<{ size: number; color: string }> }[] = [
  { route: 'Home', label: 'Home', Icon: HomeIcon },
  { route: 'MyList', label: 'My List', Icon: MyListIcon },
];

type Props = {
  orientation: 'vertical' | 'horizontal';
  current: string;
  onNavigate: (route: NavRoute) => void;
};

/** Persistent nav: a left sidebar on web/TV, a bottom bar on phones. */
export function NavBar({ orientation, current, onNavigate }: Props) {
  const layout = useLayout();
  const insets = useSafeAreaInsets();
  const vertical = orientation === 'vertical';
  // Labels need room; narrow web keeps the sidebar to icons.
  const showLabels = !vertical || layout.tenFoot;

  return (
    <FocusGuide
      name="nav"
      accessibilityRole="tablist"
      style={
        vertical
          ? [styles.sidebar, { paddingTop: layout.overscanY + 24, paddingLeft: layout.tenFoot ? 32 : 8 }]
          : [styles.bottomBar, { paddingBottom: insets.bottom }]
      }
    >
      {vertical ? (
        <View style={styles.sidebarLogo}>
          <LogoMark size={layout.tenFoot ? 34 : 22} />
        </View>
      ) : null}
      {ITEMS.map((item) => (
        <NavItem
          key={item.route}
          {...item}
          active={current === item.route}
          vertical={vertical}
          showLabel={showLabels}
          onPress={() => onNavigate(item.route)}
        />
      ))}
    </FocusGuide>
  );
}

type ItemProps = {
  label: string;
  Icon: ComponentType<{ size: number; color: string }>;
  active: boolean;
  vertical: boolean;
  showLabel: boolean;
  onPress: () => void;
};

function NavItem({ label, Icon, active, vertical, showLabel, onPress }: ItemProps) {
  const [focused, setFocused] = useState(false);
  const layout = useLayout();
  const color = focused ? colors.background : active ? colors.text : colors.muted;
  const iconSize = layout.tenFoot ? 30 : 24;

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[
        vertical ? styles.sideItem : styles.bottomItem,
        vertical && active && styles.sideItemActive,
        focused && styles.itemFocused,
      ]}
    >
      <Icon size={iconSize} color={color} />
      {showLabel ? (
        <Text style={[{ color, fontSize: vertical ? layout.bodySize : 12 }, active && styles.activeLabel]}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    paddingRight: 16,
    gap: 8,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderRightColor: colors.surface,
  },
  sidebarLogo: { paddingHorizontal: 12, marginBottom: 24 },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  sideItemActive: { borderLeftColor: colors.accent },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  bottomItem: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8 },
  itemFocused: { backgroundColor: colors.focus },
  activeLabel: { fontWeight: '600' },
});
