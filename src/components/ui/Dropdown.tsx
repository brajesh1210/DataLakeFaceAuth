import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  ViewStyle,
  SafeAreaView,
} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  label: string;
  value: string | null;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  error?: string;
}

export const Dropdown = React.memo(
  ({
    label,
    value,
    options,
    onChange,
    placeholder = 'Select...',
    style,
    error,
  }: DropdownProps) => {
    const {colors, typography, radius} = useTheme();
    const [modalVisible, setModalVisible] = useState(false);

    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption ? selectedOption.label : '';
    const isFilled = !!displayValue;

    return (
      <View style={[styles.wrapper, style]}>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={[
            styles.container,
            {
              backgroundColor: colors.background.input,
              borderRadius: radius.md,
              borderWidth: error ? 1.5 : 0,
              borderColor: colors.accent.red,
            },
          ]}>
          <View style={styles.textContainer}>
            <Text
              style={[
                typography.bodySmall,
                {
                  color: error
                    ? colors.accent.red
                    : isFilled
                    ? colors.text.secondary
                    : colors.text.primary,
                },
                !isFilled && {
                  fontSize: typography.body.fontSize,
                  transform: [{translateY: 6}],
                },
                isFilled && {transform: [{translateY: -2}]},
              ]}>
              {label}
            </Text>
            {isFilled && (
              <Text
                style={[
                  typography.body,
                  {color: colors.text.primary, marginTop: 2},
                ]}>
                {displayValue}
              </Text>
            )}
          </View>
          <Icon name="chevron-down" size={24} color={colors.text.secondary} />
        </Pressable>

      {error && (
          <Text
            style={[
              typography.caption,
              {color: colors.accent.red, marginTop: 4, marginLeft: 4},
            ]}>
            {error}
          </Text>
        )}

        <Modal
          visible={modalVisible}
          transparent
          animationType="none" // we use reanimated
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setModalVisible(false)}
            />

            <Animated.View
              entering={SlideInDown.springify().damping(15)}
              exiting={SlideOutDown}
              style={[
                styles.modalContent,
                {
                  backgroundColor: colors.background.card,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                },
              ]}>
              <View style={styles.modalHeader}>
                <Text style={[typography.h3, {color: colors.primary.navy}]}>
                  {label}
                </Text>
                <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                  <Icon name="close" size={24} color={colors.text.secondary} />
                </Pressable>
              </View>

            <FlatList
                data={options}
                keyExtractor={item => item.value}
                renderItem={({item}) => {
                  const isSelected = item.value === value;
                  return (
                    <Pressable
                      style={({pressed}) => [
                        styles.optionRow,
                        {
                          backgroundColor: pressed
                            ? colors.background.input
                            : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        onChange(item.value);
                        setModalVisible(false);
                      }}>
                      <Text
                        style={[
                          typography.bodyLarge,
                          {
                            color: isSelected
                              ? colors.primary.navy
                              : colors.text.primary,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}>
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Icon
                          name="check"
                          size={24}
                          color={colors.primary.navy}
                        />
                      )}
                    </Pressable>
                  );
                }}
                contentContainerStyle={styles.listContent}
              />
              <SafeAreaView />
            </Animated.View>
          </View>
        </Modal>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    minHeight: '30%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
});
