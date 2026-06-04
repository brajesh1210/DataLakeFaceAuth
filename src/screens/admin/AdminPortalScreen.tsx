import React, {useState} from 'react';
import {StyleSheet, View, ScrollView, Text} from 'react-native';
import {useTheme} from '@theme/ThemeContext';
import {RootStackScreenProps} from '@navigation/navigationTypes';
import {NavyAppHeader} from '@components/ui/NavyAppHeader';
import {TabBar} from '@components/ui/TabBar';
import {SyncStatusBadge} from '@components/ui/SyncStatusBadge';
import {databaseService} from '@services/DatabaseService';

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
  const [lastSyncTime, setLastSyncTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchSync = async () => {
      const history = await databaseService.getSyncHistory(1);
      if (history.length > 0) {
        setLastSyncTime(history[0].timestamp);
      }
    };
    fetchSync();
    const unsubscribe = navigation.addListener('focus', fetchSync);
    return unsubscribe;
  }, [navigation]);

  const tabs: TabName[] = ['Core', 'Logs', 'Monthly', 'Leaves', 'Register'];

  const timeAgo = (ts: number | null) => {
    if (!ts) return 'Never';
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} mins ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background.page}]}>
      <NavyAppHeader 
        title="Admin Master Portal"
        showSyncBadge={false}
      />
      
      <View style={styles.syncBar}>
        <SyncStatusBadge onPress={() => navigation.navigate('SyncDetails' as never)} />
        <Text style={styles.syncBarText}>
          Last sync: {timeAgo(lastSyncTime)}
        </Text>
      </View>

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
  syncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  syncBarText: {
    fontSize: 12,
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
});
