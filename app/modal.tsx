import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { VoltText } from '@/components/volt-text';
import { VoltView } from '@/components/volt-view';
import { colors } from '@/constants/colors';

export default function ModalScreen() {
  return (
    <VoltView style={styles.container}>
      <VoltText type="title">This is a modal</VoltText>
      <Link href="/" dismissTo style={styles.link}>
        <VoltText type="body-sm" color={colors.primarySoft}>Go to home screen</VoltText>
      </Link>
    </VoltView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
