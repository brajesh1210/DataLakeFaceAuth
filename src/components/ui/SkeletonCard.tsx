import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';

export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <Skeleton height={24} width="60%" style={{ marginBottom: 12 }} />
    <Skeleton height={16} width="40%" style={{ marginBottom: 8 }} />
    <Skeleton height={16} width="80%" />
  </View>
);

export const SkeletonListItem: React.FC = () => (
  <View style={styles.listItem}>
    <Skeleton width={40} height={40} borderRadius={20} />
    <View style={styles.listContent}>
      <Skeleton height={16} width="50%" style={{ marginBottom: 6 }} />
      <Skeleton height={12} width="70%" />
    </View>
  </View>
);

export const SkeletonStatsRow: React.FC = () => (
  <View style={styles.statsRow}>
    {[1, 2, 3].map(i => (
      <View key={i} style={styles.statItem}>
        <Skeleton height={32} width={50} style={{ marginBottom: 6 }} />
        <Skeleton height={12} width={60} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  listContent: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
});
