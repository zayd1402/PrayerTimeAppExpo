import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, ZakatRecord, CharityRecord } from '../types';
import { useTheme } from '../theme/ThemeProvider';
import { useSnackbar } from '../components/Snackbar';
import { Fab } from '../components/Fab';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import {
  loadZakatRecords, addZakatRecord,
  loadCharityLog, addCharityRecord, getCharityTotal
} from '../services/StorageService';

export default function ZakatScreen() {
  const { c, type, radius } = useTheme();
  const { show } = useSnackbar();
  const [zakatRecords, setZakatRecords] = useState<ZakatRecord[]>([]);
  const [charityRecords, setCharityRecords] = useState<CharityRecord[]>([]);
  const [charityTotal, setCharityTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'zakat' | 'charity'>('zakat');
  const [refreshing, setRefreshing] = useState(false);

  const [goldValue, setGoldValue] = useState('');
  const [silverValue, setSilverValue] = useState('');
  const [cash, setCash] = useState('');
  const [investments, setInvestments] = useState('');
  const [debts, setDebts] = useState('');

  const [charityAmount, setCharityAmount] = useState('');
  const [charityCategory, setCharityCategory] = useState<CharityRecord['category']>('sadaqah');

  const loadData = useCallback(async () => {
    const [zr, cr] = await Promise.all([loadZakatRecords(), loadCharityLog()]);
    setZakatRecords(zr);
    setCharityRecords(cr);
    setCharityTotal(await getCharityTotal());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateZakat = () => {
    const g = parseFloat(goldValue) || 0;
    const s = parseFloat(silverValue) || 0;
    const c = parseFloat(cash) || 0;
    const i = parseFloat(investments) || 0;
    const d = parseFloat(debts) || 0;
    const totalAssets = g + s + c + i;
    const netAssets = Math.max(0, totalAssets - d);
    const zakatDue = netAssets * 0.025;
    return { totalAssets, netAssets, zakatDue };
  };

  const saveZakat = async () => {
    const { totalAssets, netAssets, zakatDue } = calculateZakat();
    if (netAssets <= 0) {
      show({ message: 'Please enter valid asset values', variant: 'error', icon: 'alert-circle' });
      return;
    }
    const record: ZakatRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      goldValue: parseFloat(goldValue) || 0,
      silverValue: parseFloat(silverValue) || 0,
      cash: parseFloat(cash) || 0,
      investments: parseFloat(investments) || 0,
      debts: parseFloat(debts) || 0,
      totalAssets, zakatDue, paid: false,
    };
    const records = await addZakatRecord(record);
    setZakatRecords(records);
    show({ message: `Zakat calculated: $${zakatDue.toFixed(2)}`, variant: 'success', icon: 'calculator' });
  };

  const addCharity = async () => {
    const amount = parseFloat(charityAmount);
    if (isNaN(amount) || amount <= 0) {
      show({ message: 'Please enter a valid amount', variant: 'error', icon: 'alert-circle' });
      return;
    }
    const record: CharityRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      amount, category: charityCategory,
    };
    const records = await addCharityRecord(record);
    setCharityRecords(records);
    setCharityTotal(await getCharityTotal());
    setCharityAmount('');
    show({ message: `Added $${amount.toFixed(2)} to ${charityCategory}`, variant: 'success', icon: 'heart' });
  };

  const { totalAssets, netAssets, zakatDue } = calculateZakat();
  const nisab = 4500;
  const meetsNisab = netAssets >= nisab;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bgBase }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.emerald} colors={[c.emerald]} />}
      >
        <View style={[styles.header, { backgroundColor: c.heroBg, paddingTop: 60 }]}>
          <Text style={[type.headline, { color: c.onHero, fontSize: 22, fontWeight: '700' }]}>Zakat & Charity</Text>
          <Text style={[type.body, { color: c.onDarkMuted, marginTop: 4 }]}>Calculate, track, and give</Text>
        </View>

        <View
          style={[styles.tabBar, { backgroundColor: c.bgSurface, borderRadius: radius.lg, margin: 18, marginBottom: 12, padding: 4 }]}
          accessibilityRole="tablist"
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'zakat' && { backgroundColor: c.emerald, borderRadius: 12 }]}
            onPress={() => setActiveTab('zakat')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'zakat' }}
            accessibilityLabel="Zakat calculator"
          >
            <Ionicons name="calculator-outline" size={16} color={activeTab === 'zakat' ? '#FFF' : c.textSecondary} />
            <Text style={[type.label, { color: activeTab === 'zakat' ? '#FFF' : c.textSecondary, fontWeight: activeTab === 'zakat' ? '700' : '500' }]}>
              Zakat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'charity' && { backgroundColor: c.red, borderRadius: 12 }]}
            onPress={() => setActiveTab('charity')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'charity' }}
            accessibilityLabel="Charity log"
          >
            <Ionicons name="heart-outline" size={16} color={activeTab === 'charity' ? '#FFF' : c.textSecondary} />
            <Text style={[type.label, { color: activeTab === 'charity' ? '#FFF' : c.textSecondary, fontWeight: activeTab === 'charity' ? '700' : '500' }]}>
              Charity
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'zakat' && (
          <>
            <View
              style={[
                styles.nisabCard,
                {
                  backgroundColor: meetsNisab ? c.emeraldPale : c.bgMuted,
                  borderRadius: radius.lg, marginHorizontal: 18, marginTop: 8, padding: 16,
                },
              ]}
            >
              <Ionicons name={meetsNisab ? 'checkmark-circle' : 'alert-circle'} size={24} color={meetsNisab ? c.emerald : c.textMuted} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[type.body, { color: c.textPrimary, fontWeight: '700' }]}>
                  {meetsNisab ? 'Nisab Threshold Met' : 'Below Nisab Threshold'}
                </Text>
                <Text style={[type.caption, { color: c.textSecondary, marginTop: 2 }]}>
                  {meetsNisab
                    ? 'You are eligible to pay Zakat (2.5% of net assets)'
                    : `Nisab is approximately $${nisab.toLocaleString()}. Keep tracking your wealth.`}
                </Text>
              </View>
            </View>

            <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 18, marginBottom: 10 }]}>
              Your Assets
            </Text>
            {[
              { label: 'Gold & Jewelry ($)', value: goldValue, setter: setGoldValue, icon: 'diamond-outline' },
              { label: 'Silver ($)',           value: silverValue, setter: setSilverValue, icon: 'disc-outline' },
              { label: 'Cash & Bank ($)',     value: cash, setter: setCash, icon: 'cash-outline' },
              { label: 'Investments ($)',     value: investments, setter: setInvestments, icon: 'trending-up-outline' },
              { label: 'Debts Owed ($)',      value: debts, setter: setDebts, icon: 'card-outline' },
            ].map(field => (
              <View
                key={field.label}
                style={[styles.inputRow, { backgroundColor: c.bgSurface, borderRadius: radius.md, marginHorizontal: 18, marginBottom: 8 }]}
              >
                <Ionicons name={field.icon as any} size={18} color={c.textMuted} style={{ marginRight: 10 }} />
                <Text style={[type.body, { flex: 1, color: c.textPrimary }]}>{field.label}</Text>
                <TextInput
                  style={[styles.input, { color: c.textPrimary }]}
                  keyboardType="decimal-pad"
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder="0"
                  placeholderTextColor={c.textMuted}
                  accessibilityLabel={field.label}
                />
              </View>
            ))}

            <View style={[styles.resultsCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, padding: 18, marginTop: 8 }]}>
              <View style={[styles.resultRow, { borderBottomColor: c.border }]}>
                <Text style={[type.body, { color: c.textSecondary }]}>Total Assets</Text>
                <Text style={[type.body, { color: c.textPrimary, fontWeight: '600' }]}>${totalAssets.toLocaleString()}</Text>
              </View>
              <View style={[styles.resultRow, { borderBottomColor: c.border }]}>
                <Text style={[type.body, { color: c.textSecondary }]}>Less Debts</Text>
                <Text style={[type.body, { color: c.textPrimary, fontWeight: '600' }]}>-${(parseFloat(debts) || 0).toLocaleString()}</Text>
              </View>
              <View style={[styles.resultRow, { borderBottomWidth: 2, borderBottomColor: c.emerald }]}>
                <Text style={[type.body, { color: c.textSecondary }]}>Net Assets</Text>
                <Text style={[type.body, { color: c.textPrimary, fontWeight: '600' }]}>${netAssets.toLocaleString()}</Text>
              </View>
              <View style={[styles.resultZakat, { paddingTop: 12 }]}>
                <Text style={[type.title, { color: c.emerald, fontWeight: '700' }]}>Zakat Due (2.5%)</Text>
                <Text style={[type.headline, { color: c.emerald, fontSize: 22, fontWeight: '700' }]}>${zakatDue.toLocaleString()}</Text>
              </View>
            </View>

            <View style={{ paddingHorizontal: 18, marginTop: 16 }}>
              <Button label="Save Zakat Record" onPress={saveZakat} icon="save-outline" variant="filled" size="lg" fullWidth />
            </View>

            {zakatRecords.length > 0 && (
              <>
                <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 24, marginBottom: 10 }]}>
                  Past Records
                </Text>
                {zakatRecords.slice().reverse().map(record => (
                  <View
                    key={record.id}
                    style={[styles.recordCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, marginBottom: 10, padding: 16 }]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={[type.caption, { color: c.textMuted }]}>{record.date}</Text>
                      <View style={[styles.recordBadge, { backgroundColor: record.paid ? c.emeraldPale : c.goldPale }]}>
                        <Text style={[type.caption, { color: c.emerald, fontWeight: '700', fontSize: 11 }]}>{record.paid ? 'Paid' : 'Due'}</Text>
                      </View>
                    </View>
                    <Text style={[type.headline, { color: c.textPrimary, fontSize: 20, fontWeight: '700' }]}>${record.zakatDue.toFixed(2)}</Text>
                    <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>Net assets: ${record.totalAssets.toLocaleString()}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'charity' && (
          <>
            <View style={[styles.charityTotalCard, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, marginTop: 8, padding: 18 }]}>
              <Ionicons name="heart" size={28} color={c.red} />
              <View style={{ marginLeft: 14 }}>
                <Text style={[type.caption, { color: c.textMuted }]}>Total Given</Text>
                <Text style={[type.display, { color: c.red, fontSize: 28, fontWeight: '700', marginTop: 2 }]}>${charityTotal.toFixed(2)}</Text>
              </View>
            </View>

            <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 18, marginBottom: 10 }]}>
              Add Charity
            </Text>
            <View style={[styles.charityInputWrap, { backgroundColor: c.bgSurface, borderRadius: radius.lg, marginHorizontal: 18, padding: 16 }]}>
              <TextInput
                style={[styles.charityInput, { color: c.textPrimary, borderBottomColor: c.border }]}
                keyboardType="decimal-pad"
                value={charityAmount}
                onChangeText={setCharityAmount}
                placeholder="Amount ($)"
                placeholderTextColor={c.textMuted}
                accessibilityLabel="Charity amount"
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {(['sadaqah', 'zakat', 'fidya', 'kaffarah', 'general'] as const).map(cat => (
                  <Chip
                    key={cat}
                    label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    selected={charityCategory === cat}
                    onPress={() => setCharityCategory(cat)}
                  />
                ))}
              </View>
              <Button label="Add Record" onPress={addCharity} icon="add" variant="filled" size="md" fullWidth />
            </View>

            <Text style={[type.title, { color: c.textPrimary, marginHorizontal: 18, marginTop: 24, marginBottom: 10 }]}>
              History
            </Text>
            {charityRecords.length === 0 ? (
              <EmptyState
                icon="heart-outline"
                title="No charity logged yet"
                message="Add your first donation above to start tracking"
                compact
              />
            ) : (
              charityRecords.slice().reverse().map(record => (
                <View
                  key={record.id}
                  style={[styles.charityRecord, { backgroundColor: c.bgSurface, borderRadius: radius.md, marginHorizontal: 18, marginBottom: 8, padding: 14 }]}
                >
                  <View
                    style={[
                      styles.charityDot,
                      { backgroundColor: record.category === 'zakat' ? c.emerald : record.category === 'sadaqah' ? c.red : c.gold },
                    ]}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[type.body, { color: c.textPrimary, fontWeight: '600' }]}>
                      {record.category.charAt(0).toUpperCase() + record.category.slice(1)}
                    </Text>
                    <Text style={[type.caption, { color: c.textMuted, marginTop: 1 }]}>{record.date}</Text>
                  </View>
                  <Text style={[type.body, { color: c.textPrimary, fontWeight: '700' }]}>${record.amount.toFixed(2)}</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Fab
        icon="add"
        label={activeTab === 'zakat' ? 'New Zakat' : 'Add Charity'}
        onPress={activeTab === 'zakat' ? saveZakat : addCharity}
        style={{ position: 'absolute', right: 16, bottom: 96 }}
        accessibilityLabel={activeTab === 'zakat' ? 'Save Zakat record' : 'Add charity record'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { padding: 18 },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  nisabCard: { flexDirection: 'row', alignItems: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  input: { width: 100, fontSize: 15, textAlign: 'right', fontWeight: '600' },
  resultsCard: {},
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  resultZakat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordCard: {},
  recordBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  charityTotalCard: { flexDirection: 'row', alignItems: 'center' },
  charityInputWrap: {},
  charityInput: { fontSize: 18, fontWeight: '600', paddingVertical: 10, borderBottomWidth: 1, marginBottom: 12 },
  charityRecord: { flexDirection: 'row', alignItems: 'center' },
  charityDot: { width: 10, height: 10, borderRadius: 5 },
});
