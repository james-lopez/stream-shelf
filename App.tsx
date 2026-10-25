import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CatalogProvider } from './src/catalog/CatalogContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <CatalogProvider>
        <RootNavigator />
      </CatalogProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
