import React from 'react';
import {StyleSheet, View, Text, Pressable} from 'react-native';
import {useTheme} from '@theme/ThemeContext';

interface CalendarGridProps {
  month: number; // 0-11
  year: number;
  attendanceData: {[date: string]: 'complete' | 'pending' | 'absent' | 'leave'};
  selectedDate?: string; // YYYY-MM-DD
  onDateSelect?: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarGrid = React.memo(({
  month,
  year,
  attendanceData,
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
}: CalendarGridProps) => {
  const {colors, typography} = useTheme();

  // Calculate days in month and starting day of week
  // JavaScript Date: 0 is Sunday. Let's map to Monday=0
  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m: number, y: number) => {
    let day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1; // Map Sun(0)->6, Mon(1)->0
  };

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);

  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const currentDay = today.getDate();

  const isPastDate = (date: Date) => {
    if (!minDate) return false;
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const minOnly = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return dateOnly < minOnly;
  };

  const grid = [];
  let dayCounter = 1;

  for (let row = 0; row < 6; row++) {
    const week = [];
    for (let col = 0; col < 7; col++) {
      if ((row === 0 && col < firstDay) || dayCounter > daysInMonth) {
        week.push(<View key={`empty-${row}-${col}`} style={styles.dayCell} />);
      } else {
        const d = dayCounter++;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
          d,
        ).padStart(2, '0')}`;
        
        const status = attendanceData[dateStr];
        const isSelected = selectedDate === dateStr;
        const isToday = isCurrentMonth && d === currentDay;

        let dotColor = null;
        if (status === 'complete') dotColor = colors.accent.green;
        else if (status === 'absent') dotColor = colors.accent.red;
        else if (status === 'pending') dotColor = colors.accent.orange;
        else if (status === 'leave') dotColor = '#3B82F6'; // Blue dot for leave

        const cellDate = new Date(year, month, d);
        const isDisabled = isPastDate(cellDate);

        week.push(
          <Pressable
            key={`day-${d}`}
            style={[
              styles.dayCell,
              isSelected && {backgroundColor: colors.primary.navy, borderRadius: 8},
              isToday && !isSelected && {borderWidth: 1, borderColor: colors.primary.navy, borderRadius: 8},
              isDisabled && styles.disabledDate,
            ]}
            onPress={isDisabled ? undefined : () => onDateSelect?.(dateStr)}>
            <Text
              style={[
                typography.body,
                {color: isSelected ? colors.text.white : colors.text.primary},
                isDisabled && styles.disabledText,
              ]}>
              {d}
            </Text>
            <View style={styles.dotContainer}>
              {dotColor ? (
                <View style={[styles.dot, {backgroundColor: dotColor}]} />
              ) : null}
            </View>
          </Pressable>
        );
      }
    }
    grid.push(
      <View key={`row-${row}`} style={styles.row}>
        {week}
      </View>
    );
    if (dayCounter > daysInMonth) break;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {DAYS_OF_WEEK.map((day) => (
          <Text
            key={day}
            style={[
              typography.label,
              styles.headerText,
              {color: colors.primary.navy},
            ]}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>{grid}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    width: '14.28%',
    textAlign: 'center',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dotContainer: {
    height: 8,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  disabledDate: {
    opacity: 0.3,
  },
  disabledText: {
    color: '#94A3B8',
  },
});
