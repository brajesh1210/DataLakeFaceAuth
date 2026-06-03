import React from 'react';
import { StyleSheet, View, TextInput, Pressable } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}

export const SearchBar = React.memo(({
  value,
  onChangeText,
  placeholder = 'Search...',
  onSubmit,
}: SearchBarProps) => {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.input, borderRadius: radius.md },
      ]}
    >
      <Icon name="magnify" size={24} color={colors.text.secondary} style={styles.icon} />
      <TextInput
        style={[styles.input, typography.body, { color: colors.text.primary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} style={styles.clearButton} hitSlop={10}>
          <Icon name="close-circle" size={20} color={colors.text.tertiary} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 0, // override default android padding
    height: '100%',
  },
  clearButton: {
    marginLeft: 8,
  },
});
