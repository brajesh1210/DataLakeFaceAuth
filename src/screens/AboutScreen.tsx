import React from 'react';
import {StyleSheet, View, Text, ScrollView, Image} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {NavyAppHeader} from '@components/ui/NavyAppHeader';
import {Card} from '@components/ui/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export function AboutScreen() {
  const {colors, typography} = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: colors.background.page}]}>
      <NavyAppHeader title="About App" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Icon name="face-recognition" size={64} color={colors.primary.navy} />
          <Text style={[typography.h1, {color: colors.primary.navy, marginTop: 16}]}>
            DataLake Workforce Portal
          </Text>
          <Text style={[typography.caption, {color: colors.text.secondary, marginTop: 4}]}>
            Version 1.0.0
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={[typography.h3, {color: colors.text.primary, marginBottom: 16}]}>
            Powered By Digital India
          </Text>
          <Text style={[typography.body, {color: colors.text.secondary, marginBottom: 8}]}>
            Designed and developed for the National Highways Authority of India (NHAI) to securely manage and authenticate workforce deployment using cutting-edge edge AI and liveness detection.
          </Text>
          <Text style={[typography.body, {color: colors.text.secondary}]}>
            Core Technologies: React Native, ML Kit, SQLite, Reanimated, Vision Camera.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[typography.h3, {color: colors.text.primary, marginBottom: 16}]}>
            Support & Contacts
          </Text>
          <View style={styles.row}>
            <Icon name="phone" size={20} color={colors.text.tertiary} />
            <Text style={[typography.body, {color: colors.text.secondary, marginLeft: 8}]}>
              1800-XXX-XXXX
            </Text>
          </View>
          <View style={[styles.row, {marginTop: 12}]}>
            <Icon name="email" size={20} color={colors.text.tertiary} />
            <Text style={[typography.body, {color: colors.text.secondary, marginLeft: 8}]}>
              support@nhai.gov.in
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
