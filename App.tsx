import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';

import AddExercisesScreen from './src/screens/AddExercisesScreen';
import TemplateDetailsScreen, { type TemplateDetails } from './src/screens/TemplateDetailsScreen';

export default function App() {
  const [templateDetails, setTemplateDetails] = useState<TemplateDetails | null>(null);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {templateDetails ? <AddExercisesScreen details={templateDetails} onBack={() => setTemplateDetails(null)} /> : <TemplateDetailsScreen onNext={setTemplateDetails} />}
        <StatusBar style="light" />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
});