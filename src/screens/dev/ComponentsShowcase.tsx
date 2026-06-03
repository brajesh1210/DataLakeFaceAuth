import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// UI Components
import { GradientBackground } from '@components/ui/GradientBackground';
import { Card } from '@components/ui/Card';
import { PrimaryButton } from '@components/ui/PrimaryButton';
import { SecondaryButton } from '@components/ui/SecondaryButton';
import { TogglePill } from '@components/ui/TogglePill';
import { AppHeader } from '@components/ui/AppHeader';
import { ListItem } from '@components/ui/ListItem';
import { SearchBar } from '@components/ui/SearchBar';
import { StatsCard } from '@components/ui/StatsCard';

// Advanced Components
import { IconBadge } from '@components/ui/IconBadge';
import { SectionHeader } from '@components/ui/SectionHeader';
import { FloatingInput } from '@components/ui/FloatingInput';
import { Dropdown } from '@components/ui/Dropdown';
import { Checkbox } from '@components/ui/Checkbox';
import { ProgressBar } from '@components/ui/ProgressBar';
import { StatusBadge } from '@components/ui/StatusBadge';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';

// Branding Components
import { NHAIHeader } from '@components/branding/NHAIHeader';
import { DigitalIndiaBadge } from '@components/branding/DigitalIndiaBadge';

export const ComponentsShowcase = () => {
  const { colors, typography, spacing } = useTheme();
  
  // States
  const [refreshing, setRefreshing] = useState(false);
  const [pillState, setPillState] = useState('Me');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [dropdownValue, setDropdownValue] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderSectionHeader = (title: string) => (
    <View style={[styles.sectionHeader, { borderBottomColor: colors.border.default }]}>
      <Text style={[typography.h3, { color: colors.primary.navy }]}>{title}</Text>
    </View>
  );

  const renderItemSpacer = () => <View style={{ height: spacing.lg }} />;

  return (
    <GradientBackground>
      <AppHeader title="Component Library" rightComponent={<Icon name="cog" size={24} color={colors.primary.navy} />} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.navy]} />}
      >
        {/* Page Header Polish */}
        <View style={styles.pageHeader}>
          <Text style={[typography.h1, { color: colors.primary.navy, textAlign: 'center' }]}>DataLake 3.0 Design System</Text>
          <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginTop: 4 }]}>Component Library v1.0</Text>
          <View style={[styles.badgeContainer, { backgroundColor: colors.accent.green }]}>
            <Text style={[typography.caption, { color: colors.text.white, fontWeight: 'bold' }]}>19/19 Components Complete ✓</Text>
          </View>
        </View>

        {renderSectionHeader('1. Buttons (Primary & Secondary)')}
        <Card padding={16}>
          <PrimaryButton title="Large Primary" size="large" onPress={() => {}} />
          {renderItemSpacer()}
          <PrimaryButton title="Medium Primary (Default)" onPress={() => {}} icon="login" />
          {renderItemSpacer()}
          <PrimaryButton title="Small Primary" size="small" onPress={() => {}} />
          {renderItemSpacer()}
          <PrimaryButton title="Loading State" loading onPress={() => {}} />
          {renderItemSpacer()}
          <PrimaryButton title="Disabled State" disabled onPress={() => {}} />
          {renderItemSpacer()}
          <SecondaryButton title="Secondary Button" onPress={() => {}} icon="sync" />
        </Card>

        {renderItemSpacer()}
        {renderSectionHeader('2. Card & StatsCard')}
        <Card onPress={() => {}}>
          <Text style={[typography.h4, { marginBottom: spacing.md }]}>Attendance Stats</Text>
          <StatsCard 
            columns={2}
            stats={[
              { value: '142', label: 'Present Today' },
              { value: '12', label: 'Absent' },
              { value: '98%', label: 'Attendance Rate', color: colors.accent.green },
              { value: '3', label: 'Pending Leaves', color: colors.accent.orange },
            ]} 
          />
        </Card>

        {renderItemSpacer()}
        {renderSectionHeader('3. Interactive Elements')}
        <Card padding={16}>
          <Text style={[typography.label, { marginBottom: spacing.sm }]}>Toggle Pill</Text>
          <TogglePill 
            options={['Me', 'My Team']} 
            selected={pillState} 
            onChange={setPillState} 
          />
          
          {renderItemSpacer()}
          <Text style={[typography.label, { marginBottom: spacing.sm }]}>Search Bar</Text>
          <SearchBar 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search employees..."
          />
        </Card>

        {renderItemSpacer()}
        {renderSectionHeader('4. List Items')}
        <Card padding={0}>
          <ListItem 
            icon={<Icon name="calendar-check" size={24} color={colors.primary.navy} />}
            label="Mark Attendance"
            onPress={() => {}}
          />
          <ListItem 
            icon={<Icon name="face-recognition" size={24} color={colors.primary.navy} />}
            label="Face Registration"
            onPress={() => {}}
            badge={2}
          />
          <ListItem 
            icon={<Icon name="shield-check" size={24} color={colors.primary.navy} />}
            label="Safety Audit"
            onPress={() => {}}
            rightLabel="Due Today"
          />
        </Card>
        
        {renderItemSpacer()}
        {renderSectionHeader('5. IconBadge')}
        <Card padding={16} style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <IconBadge icon="help" color={colors.accent.green} label="Ask us" onPress={() => {}} />
          <IconBadge icon="email" color={colors.accent.orange} label="Mail us" onPress={() => {}} />
          <IconBadge icon="phone" color={colors.primary.lightBlue} label="Call us" onPress={() => {}} />
        </Card>

        {renderItemSpacer()}
        {renderSectionHeader('6. SectionHeader')}
        <Card padding={0}>
          <SectionHeader title="My Overview" style={{ paddingHorizontal: 16 }} />
          <SectionHeader 
            title="Last 7 Days" 
            rightAction={{ label: 'View All', onPress: () => {} }} 
            style={{ paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.border.default }} 
          />
        </Card>

        {renderItemSpacer()}
        {renderSectionHeader('7. Forms & Inputs')}
        <Card padding={16}>
          <FloatingInput 
            label="Employee ID" 
            value={inputValue} 
            onChangeText={setInputValue} 
          />
          {renderItemSpacer()}
          <FloatingInput 
            label="Password (Error state)" 
            value="invalid-pass" 
            onChangeText={() => {}} 
            error="Incorrect password entered."
            secureTextEntry
          />
          {renderItemSpacer()}
          <Dropdown 
            label="Select Role"
            value={dropdownValue}
            onChange={setDropdownValue}
            options={[
              { label: 'Site Engineer', value: 'eng' },
              { label: 'Project Manager', value: 'pm' },
              { label: 'Safety Officer', value: 'so' },
              { label: 'Quality Inspector', value: 'qi' },
              { label: 'General Staff', value: 'staff' },
            ]}
          />
          {renderItemSpacer()}
          <Checkbox checked={isChecked} onToggle={setIsChecked} label="I agree to terms and conditions" />
          {renderItemSpacer()}
          <Checkbox checked={false} onToggle={() => {}} label="Unchecked state" />
        </Card>

        {renderItemSpacer()}
        {renderSectionHeader('8. Progress & Status')}
        <Card padding={16}>
          <ProgressBar progress={0.25} label="Storage Used" showPercentage />
          {renderItemSpacer()}
          <ProgressBar progress={0.5} label="Upload Progress" color={colors.accent.green} showPercentage />
          {renderItemSpacer()}
          <ProgressBar progress={0.75} label="Syncing Data" color={colors.accent.orange} showPercentage />
          
          {renderItemSpacer()}
          <Text style={[typography.label, { marginBottom: spacing.sm }]}>Status Badges</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <StatusBadge variant="success" label="Active" icon="check-circle" />
            <StatusBadge variant="warning" label="Pending" icon="clock-outline" />
            <StatusBadge variant="danger" label="Failed" icon="alert-circle" />
            <StatusBadge variant="info" label="Syncing" icon="sync" />
            <StatusBadge variant="neutral" label="Draft" />
          </View>
        </Card>

        {renderItemSpacer()}
        {renderSectionHeader('9. LoadingSpinner')}
        <Card padding={24} style={{ alignItems: 'center' }}>
          <LoadingSpinner message="Syncing records..." size="large" />
        </Card>

        {renderItemSpacer()}
        {renderSectionHeader('10. Branding Components')}
        <Card padding={16}>
          <Text style={[typography.label, { marginBottom: spacing.md }]}>NHAIHeader (Full)</Text>
          <NHAIHeader />
          
          <View style={{ height: spacing.xl }} />
          
          <Text style={[typography.label, { marginBottom: spacing.md }]}>NHAIHeader (Compact)</Text>
          <NHAIHeader compact />
          
          <View style={{ height: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border.default, marginBottom: spacing.xl }} />
          
          <Text style={[typography.label, { marginBottom: spacing.md }]}>DigitalIndiaBadge</Text>
          <DigitalIndiaBadge />
        </Card>
        
        {renderItemSpacer()}
        {renderItemSpacer()}
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  sectionHeader: {
    paddingBottom: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    marginTop: 16,
  },
});
