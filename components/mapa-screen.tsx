/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

let MapaScreen: React.ComponentType;

if (Platform.OS === 'web') {
  MapaScreen = require('./mapa-screen.web').default;
} else {
  MapaScreen = require('./mapa-screen.native').default;
}

export default MapaScreen;
