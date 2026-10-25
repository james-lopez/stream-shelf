import {
  CommonActions,
  createNavigationContainerRef,
  DarkTheme,
  NavigationContainer,
  type NavigationState,
  type PartialState,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import type { ShowSummary } from '../catalog/types';
import { FocusGuide } from '../components/FocusGuide';
import { installWebFocus, releaseFocus } from '../focus/webFocus';
import { DetailScreen } from '../screens/DetailScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MyListScreen } from '../screens/MyListScreen';
import { colors } from '../theme';
import { NavBar } from './NavBar';
import type { NavRoute, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const theme: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.background, primary: colors.accent },
};

// Web and TV are driven by directional input, where a left rail is the convention.
const SIDEBAR = Platform.isTV || Platform.OS === 'web';

type ScreenProps<R extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, R>;

/** Each screen is its own focus region, so web focus can tell which screen it is on. */
function Screen({ name, children }: { name: string; children: ReactNode }) {
  return (
    <FocusGuide name={`screen-${name}`} style={styles.fill}>
      {children}
    </FocusGuide>
  );
}

/** Navigation started from inside a screen: release focus first so the outgoing screen can be hidden. */
const leaving =
  <A extends unknown[]>(go: (...args: A) => void) =>
  (...args: A) => {
    releaseFocus();
    go(...args);
  };

function HomeRoute({ navigation }: ScreenProps<'Home'>) {
  return (
    <Screen name="home">
      <HomeScreen onSelectShow={leaving((show: ShowSummary) => navigation.navigate('Detail', { id: show.id }))} />
    </Screen>
  );
}

function MyListRoute({ navigation }: ScreenProps<'MyList'>) {
  return (
    <Screen name="my-list">
      <MyListScreen
        onSelectShow={leaving((show: ShowSummary) => navigation.navigate('Detail', { id: show.id }))}
        onBrowse={leaving(() => navigation.popToTop())}
      />
    </Screen>
  );
}

function DetailRoute({ navigation, route }: ScreenProps<'Detail'>) {
  return (
    <Screen name="detail">
      <DetailScreen id={route.params.id} onBack={leaving(() => navigation.goBack())} />
    </Screen>
  );
}

const isNavRoute = (name: string | undefined): name is NavRoute => name === 'Home' || name === 'MyList';

export function RootNavigator() {
  // The nav highlights the section you're in, which stays put while viewing a detail page.
  const [section, setSection] = useState<NavRoute>('Home');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    return installWebFocus({
      onBack: () => {
        if (!navigationRef.canGoBack()) return;
        releaseFocus();
        navigationRef.goBack();
      },
    });
  }, []);

  // Sections behave like tabs over a Home root: Home pops everything, My List sits directly
  // above Home. Reusing the existing route objects keeps their keys, so mounted screens
  // (and their scroll and focus memory) survive the switch. A plain `navigate` would push
  // another copy each time in React Navigation 7 and grow the Back history.
  const navigate = (route: NavRoute) => {
    const routes = navigationRef.isReady() ? navigationRef.getRootState()?.routes : undefined;
    if (!routes) return;
    // The key is what keeps a screen mounted; a route without one is created fresh.
    const existing = (name: NavRoute) => {
      const found = routes.find((r) => r.name === name);
      return found ? { key: found.key, name } : { name };
    };
    const home = existing('Home');
    const myList = existing('MyList');
    const next: PartialState<NavigationState> =
      route === 'Home' ? { index: 0, routes: [home] } : { index: 1, routes: [home, myList] };
    navigationRef.dispatch(CommonActions.reset(next));
  };
  const nav = <NavBar orientation={SIDEBAR ? 'vertical' : 'horizontal'} current={section} onNavigate={navigate} />;

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={theme}
      onStateChange={() => {
        const name = navigationRef.getCurrentRoute()?.name;
        if (isNavRoute(name)) setSection(name);
      }}
    >
      <View style={[styles.fill, styles.shell, { flexDirection: SIDEBAR ? 'row' : 'column' }]}>
        {SIDEBAR ? nav : null}
        <FocusGuide name="content" style={styles.fill}>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="Home" component={HomeRoute} />
            <Stack.Screen name="MyList" component={MyListRoute} />
            <Stack.Screen
              name="Detail"
              component={DetailRoute}
              // Phones get a native back button; TV uses the remote's back/menu, web uses Escape.
              options={{ headerShown: !SIDEBAR, headerTransparent: true, title: '', headerTintColor: colors.text }}
            />
          </Stack.Navigator>
        </FocusGuide>
        {SIDEBAR ? null : nav}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  shell: { backgroundColor: colors.background },
});
