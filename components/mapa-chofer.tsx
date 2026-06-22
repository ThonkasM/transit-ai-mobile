/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from 'react-native';

let MapaChoferScreen: React.ComponentType;

if (Platform.OS === 'web') {
  MapaChoferScreen = require('./mapa-chofer.web').default;
} else {
  MapaChoferScreen = require('./mapa-chofer.native').default;
}

export default MapaChoferScreen;
