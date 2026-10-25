import {
  createNavigationContainerRef,
  DarkTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { FocusGuide } from '../components/FocusGuide';
import { installWebFocus } from '../focus/webFocus';
import { HomeScreen } from '../screens/HomeScreen';
import { MyListScreen } from '../screens/MyListScreen';
import { colors } from '../theme';
import { NavBar, type NavRoute } from './NavBar';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const theme: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.background, primary: colors.accent },
};

// Web and TV are driven by directional input, where a left rail is the convention.
const SIDEBAR = Platform.isTV || Platform.OS === 'web';

function HomeRoute() {
  // Detail screen lands next; selection is a no-op until then.
  return <HomeScreen onSelectShow={() => {}} />;
}

export function RootNavigator() {
  const [current, setCurrent] = useState<string>('Home');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    return installWebFocus({ onBack: () => navigationRef.canGoBack() && navigationRef.goBack() });
  }, []);

  const navigate = (route: NavRoute) => {
    if (navigationRef.isReady()) navigationRef.navigate(route);
  };
  const nav = <NavBar orientation={SIDEBAR ? 'vertical' : 'horizontal'} current={current} onNavigate={navigate} />;

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={theme}
      onStateChange={() => setCurrent(navigationRef.getCurrentRoute()?.name ?? 'Home')}
    >
      <View style={[styles.shell, { flexDirection: SIDEBAR ? 'row' : 'column' }]}>
        {SIDEBAR ? nav : null}
        <FocusGuide name="content" style={styles.content}>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="Home" component={HomeRoute} />
            <Stack.Screen name="MyList" component={MyListScreen} />
          </Stack.Navigator>
        </FocusGuide>
        {SIDEBAR ? null : nav}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});
