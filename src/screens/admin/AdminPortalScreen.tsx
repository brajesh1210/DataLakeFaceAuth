import React, {useState} from 'react';
import {StyleSheet, View, ScrollView} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {RootStackScreenProps} from '@navigation/navigationTypes';
import {NavyAppHeader} from '@components/ui/NavyAppHeader';
import {TabBar} from '@components/ui/TabBar';

import {CoreTab} from './CoreTab';
import {LogsTab} from './LogsTab';
import {MonthlyTab} from './MonthlyTab';
import {LeavesTab} from './LeavesTab';
import {RegisterTab} from './RegisterTab';

type Props = RootStackScreenProps<'AdminPortal'>;
type TabName = 'Core' | 'Logs' | 'Monthly' | 'Leaves' | 'Register';

export function AdminPortalScreen({navigation}: Props) {
  const {colors} = useTheme();
  const [activeTab, setActiveTab] = useState<TabName>('Core');

  const tabs: TabName[] = ['Core', 'Logs', 'Monthly', 'Leaves', 'Register'];

  return (
    <View style={[styles.container, {backgroundColor: colors.background.page}]}>
      <NavyAppHeader title="Admin Master Portal" />
      
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabBar 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as TabName)}
          />
        </ScrollView>
      </View>

      <View style={styles.content}>
        {activeTab === 'Core' && <CoreTab />}
        {activeTab === 'Logs' && <LogsTab />}
        {activeTab === 'Monthly' && <MonthlyTab />}
        {activeTab === 'Leaves' && <LeavesTab />}
        {activeTab === 'Register' && <RegisterTab />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
