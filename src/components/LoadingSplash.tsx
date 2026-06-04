import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const LoadingSplash = () => (
  <View style={styles.container}>
    <Text style={styles.title}>DataLake</Text>
    <Text style={styles.subtitle}>Workforce Portal</Text>
    <ActivityIndicator 
      size="large" 
      color="#1B3A6B" 
      style={styles.spinner} 
    />
    <Text style={styles.status}>Initializing...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1B3A6B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#1B3A6B',
    marginBottom: 32,
  },
  spinner: {
    marginVertical: 24,
  },
  status: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 16,
  },
});
