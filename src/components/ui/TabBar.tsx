import React from 'react';
import {StyleSheet, View, Text, Pressable, ScrollView} from 'react-native';
import {useTheme} from '@theme/ThemeContext';

interface TabBarProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabBar({tabs, activeTab, onTabChange}: TabBarProps) {
  const {colors, typography} = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: colors.background.card}]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                isActive && {borderBottomColor: colors.primary.navy},
              ]}
              onPress={() => onTabChange(tab)}>
              <Text
                style={[
                  typography.body,
                  styles.tabText,
                  {
                    color: isActive
                      ? colors.primary.navy
                      : colors.text.secondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
  },
});
