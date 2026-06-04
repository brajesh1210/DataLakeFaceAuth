import React from 'react';
import {StyleSheet, View, Text, Image} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {RootStackScreenProps} from '@navigation/navigationTypes';
import {Card} from '@components/ui/Card';
import {PrimaryButton} from '@components/ui/PrimaryButton';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = RootStackScreenProps<'Splash'>;

export function SplashScreen({navigation}: Props) {
  const {colors, typography} = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {backgroundColor: colors.background.page}]}>
      {/* Top Section */}
      <View style={[styles.topSection, {paddingTop: insets.top + 40}]}>
        <Text style={[typography.h1, {color: colors.primary.navy, textAlign: 'center'}]}>
          Digital Backbone for
        </Text>
        <Text style={[typography.h1, {color: colors.primary.navy, textAlign: 'center'}]}>
          National Highways.
        </Text>
      </View>

      {/* Main Card */}
      <View style={styles.cardContainer}>
        <Card style={styles.card}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1592834103389-23a9c4e8a1c6?w=800',
              }}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={styles.imageCredit}>Image credit: nhai.gov.in</Text>
          </View>

          <View style={styles.titleContainer}>
            <Text
              style={[
                typography.h1,
                {color: colors.text.primary, textAlign: 'center', marginBottom: 8},
              ]}>
              Workforce Portal
            </Text>
            <Text
              style={[
                typography.caption,
                {
                  color: colors.accent.green,
                  textAlign: 'center',
                  fontWeight: '700',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                },
              ]}>
              Powered by Digital India
            </Text>
          </View>
        </Card>
      </View>

      {/* Bottom Button */}
      <View style={[styles.bottomSection, {paddingBottom: insets.bottom + 24}]}>
        <PrimaryButton
          title="Access Secure Portal →"
          onPress={() => navigation.replace('Login')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 0, // Override default card padding to let image bleed to edges if wanted, or pad inside
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageCredit: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: 10,
    color: '#E2E8F0',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  titleContainer: {
    padding: 24,
    alignItems: 'center',
  },
  bottomSection: {
    marginTop: 'auto',
  },
});
