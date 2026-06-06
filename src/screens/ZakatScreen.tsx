import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, ZakatRecord, CharityRecord } from '../types';
import {
  loadZakatRecords, addZakatRecord,
  loadCharityLog, addCharityRecord, getCharityTotal
} from '../services/StorageService';

export default function ZakatScreen() {
  const [zakatRecords, setZakatRecords] = useState<ZakatRecord[]>([]);
  const [charityRecords, setCharityRecords] = useState<CharityRecord[]>([]);
  const [charityTotal, setCharityTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'zakat' | 'charity'>('zakat');

  // Zakat calculator inputs
  const [goldValue, setGoldValue] = useState('');
  const [silverValue, setSilverValue] = useState('');
  const [cash, setCash] = useState('');
  const [investments, setInvestments] = useState('');
  const [debts, setDebts] = useState('');

  // Charity input
  const [charityAmount, setCharityAmount] = useState('');
  const [charityCategory, setCharityCategory] = useState<CharityRecord['category']>('sadaqah');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [zr, cr] = await Promise.all([
      loadZakatRecords(),
      loadCharityLog(),
    ]);
    setZakatRecords(zr);
    setCharityRecords(cr);
    setCharityTotal(await getCharityTotal());
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
      Alert.alert('Invalid Input', 'Please enter valid asset values');
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
      totalAssets,
      zakatDue,
      paid: false};

    const records = await addZakatRecord(record);
    setZakatRecords(records);
    Alert.alert('Zakat Calculated', `Zakat due: $${zakatDue.toFixed(2)}`);
  };

  const addCharity = async () => {
    const amount = parseFloat(charityAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const record: CharityRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      amount,
      category: charityCategory};

    const records = await addCharityRecord(record);
    setCharityRecords(records);
    setCharityTotal(await getCharityTotal());
    setCharityAmount('');
  };

  const { totalAssets, netAssets, zakatDue } = calculateZakat();
  const nisab = 4500; // Approximate nisab threshold in USD
  const meetsNisab = netAssets >= nisab;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Zakat & Charity</Text>
        <Text style={styles.subtitle}>Calculate, track, and give</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'zakat' && styles.tabActive]} onPress={() => setActiveTab('zakat')}>
          <Ionicons name="calculator-outline" size={16} color={activeTab === 'zakat' ? '#FFF' : C.textSecondary} />
          <Text style={[styles.tabLabel, activeTab === 'zakat' && styles.tabLabelActive]}>Zakat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'charity' && styles.tabActive]} onPress={() => setActiveTab('charity')}>
          <Ionicons name="heart-outline" size={16} color={activeTab === 'charity' ? '#FFF' : C.textSecondary} />
          <Text style={[styles.tabLabel, activeTab === 'charity' && styles.tabLabelActive]}>Charity</Text>
        </TouchableOpacity>
      </View>

      {/* Zakat Tab */}
      {activeTab === 'zakat' && (
        <>
          {/* Nisab Status */}
          <View style={[styles.nisabCard, meetsNisab ? styles.nisabMet : styles.nisabNotMet]}>
            <Ionicons name={meetsNisab ? 'checkmark-circle' : 'alert-circle'} size={24} color={meetsNisab ? C.coral : C.textMuted} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.nisabTitle}>{meetsNisab ? 'Nisab Threshold Met' : 'Below Nisab Threshold'}</Text>
              <Text style={styles.nisabDesc}>
                {meetsNisab
                  ? 'You are eligible to pay Zakat (2.5% of net assets)'
                  : `Nisab is approximately $${nisab.toLocaleString()}. Keep tracking your wealth.`}
              </Text>
            </View>
          </View>

          {/* Calculator Inputs */}
          <Text style={styles.sectionTitle}>Your Assets</Text>
          {[
            { label: 'Gold & Jewelry ($)', value: goldValue, setter: setGoldValue, icon: 'diamond-outline' },
            { label: 'Silver ($)', value: silverValue, setter: setSilverValue, icon: 'disc-outline' },
            { label: 'Cash & Bank ($)', value: cash, setter: setCash, icon: 'cash-outline' },
            { label: 'Investments ($)', value: investments, setter: setInvestments, icon: 'trending-up-outline' },
            { label: 'Debts Owed ($)', value: debts, setter: setDebts, icon: 'card-outline' },
          ].map(field => (
            <View key={field.label} style={styles.inputRow}>
              <Ionicons name={field.icon as any} size={18} color={C.textMuted} style={{ marginRight: 10 }} />
              <Text style={styles.inputLabel}>{field.label}</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={field.value}
                onChangeText={field.setter}
                placeholder="0"
                placeholderTextColor={C.textMuted}
              />
            </View>
          ))}

          {/* Results */}
          <View style={styles.resultsCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total Assets</Text>
              <Text style={styles.resultValue}>${totalAssets.toLocaleString()}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Less Debts</Text>
              <Text style={styles.resultValue}>-${(parseFloat(debts) || 0).toLocaleString()}</Text>
            </View>
            <View style={[styles.resultRow, styles.resultHighlight]}>
              <Text style={styles.resultLabel}>Net Assets</Text>
              <Text style={styles.resultValue}>${netAssets.toLocaleString()}</Text>
            </View>
            <View style={[styles.resultRow, styles.resultZakat]}>
              <Text style={styles.zakatLabel}>Zakat Due (2.5%)</Text>
              <Text style={styles.zakatValue}>${zakatDue.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.calculateBtn} onPress={saveZakat}>
            <Text style={styles.calculateBtnText}>Save Zakat Record</Text>
          </TouchableOpacity>

          {/* Past Records */}
          {zakatRecords.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Past Records</Text>
              {zakatRecords.slice().reverse().map(record => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordDate}>{record.date}</Text>
                    <View style={[styles.recordBadge, record.paid ? styles.recordPaid : styles.recordUnpaid]}>
                      <Text style={styles.recordBadgeText}>{record.paid ? 'Paid' : 'Due'}</Text>
                    </View>
                  </View>
                  <Text style={styles.recordAmount}>${record.zakatDue.toFixed(2)}</Text>
                  <Text style={styles.recordDetail}>Net assets: ${record.totalAssets.toLocaleString()}</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}

      {/* Charity Tab */}
      {activeTab === 'charity' && (
        <>
          {/* Total */}
          <View style={styles.charityTotalCard}>
            <Ionicons name="heart" size={28} color={C.coral} />
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.charityTotalLabel}>Total Given</Text>
              <Text style={styles.charityTotalValue}>${charityTotal.toFixed(2)}</Text>
            </View>
          </View>

          {/* Add Charity */}
          <Text style={styles.sectionTitle}>Add Charity</Text>
          <View style={styles.charityInputWrap}>
            <TextInput
              style={styles.charityInput}
              keyboardType="decimal-pad"
              value={charityAmount}
              onChangeText={setCharityAmount}
              placeholder="Amount ($)"
              placeholderTextColor={C.textMuted}
            />
            <View style={styles.categoryRow}>
              {(['sadaqah', 'zakat', 'fidya', 'kaffarah', 'general'] as const).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, charityCategory === cat && styles.categoryChipActive]}
                  onPress={() => setCharityCategory(cat)}
                >
                  <Text style={[styles.categoryLabel, charityCategory === cat && styles.categoryLabelActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.addCharityBtn} onPress={addCharity}>
              <Text style={styles.addCharityText}>Add Record</Text>
            </TouchableOpacity>
          </View>

          {/* Charity History */}
          {charityRecords.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>History</Text>
              {charityRecords.slice().reverse().map(record => (
                <View key={record.id} style={styles.charityRecord}>
                  <View style={[styles.charityDot, { backgroundColor: record.category === 'zakat' ? C.coral : record.category === 'sadaqah' ? C.coral : C.gold }]} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.charityRecordCat}>{record.category.charAt(0).toUpperCase() + record.category.slice(1)}</Text>
                    <Text style={styles.charityRecordDate}>{record.date}</Text>
                  </View>
                  <Text style={styles.charityRecordAmount}>${record.amount.toFixed(2)}</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bgBase },
  content: { paddingBottom: 120 },
  header: { padding: 18, paddingTop: 60, backgroundColor: C.heroBg },
  title: { fontSize: 24, fontFamily: 'BodoniModa_700Bold', color: C.textPrimary },
  subtitle: { fontSize: 14, color: C.textSecondary, fontFamily: "Inter_400Regular", marginTop: 4 },

  tabBar: { flexDirection: 'row', backgroundColor: C.bgSurface, borderRadius: 16, margin: 18, marginBottom: 12, padding: 4},
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: C.coral },
  tabLabel: { fontSize: 13, color: C.textSecondary, fontFamily: 'Jost_500Medium' },
  tabLabelActive: { color: '#FFF', fontFamily: 'Jost_700Bold' },

  nisabCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginTop: 8, padding: 16, borderRadius: 16 },
  nisabMet: { backgroundColor: C.primaryLight },
  nisabNotMet: { backgroundColor: '#F5F5F0' },
  nisabTitle: { fontSize: 15, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  nisabDesc: { fontSize: 12, color: C.textSecondary, marginTop: 2 },

  sectionTitle: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary, marginHorizontal: 18, marginTop: 18, marginBottom: 10 },

  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSurface, borderRadius: 14, marginHorizontal: 18, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 12 },
  inputLabel: { flex: 1, fontSize: 14, color: C.textPrimary },
  input: { width: 100, fontSize: 15, color: C.textPrimary, textAlign: 'right', fontFamily: 'Jost_600SemiBold' },

  resultsCard: { backgroundColor: C.bgSurface, borderRadius: 18, marginHorizontal: 18, padding: 18, marginTop: 8 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  resultHighlight: { borderBottomWidth: 2, borderBottomColor: C.coral },
  resultZakat: { paddingTop: 12, borderBottomWidth: 0 },
  resultLabel: { fontSize: 14, color: C.textSecondary },
  resultValue: { fontSize: 14, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  zakatLabel: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.coral },
  zakatValue: { fontSize: 18, fontFamily: 'Jost_700Bold', color: C.coral },

  calculateBtn: { backgroundColor: C.coral, borderRadius: 16, marginHorizontal: 18, marginTop: 16, paddingVertical: 16, alignItems: 'center' },
  calculateBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'Jost_700Bold' },

  recordCard: { backgroundColor: C.bgSurface, borderRadius: 16, marginHorizontal: 18, marginBottom: 10, padding: 16 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  recordDate: { fontSize: 13, color: C.textMuted },
  recordBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  recordPaid: { backgroundColor: C.primaryLight },
  recordUnpaid: { backgroundColor: C.goldPale },
  recordBadgeText: { fontSize: 11, fontFamily: 'Jost_700Bold', color: C.coral },
  recordAmount: { fontSize: 20, fontFamily: 'Jost_700Bold', color: C.textPrimary },
  recordDetail: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  charityTotalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSurface, borderRadius: 18, marginHorizontal: 18, marginTop: 8, padding: 18},
  charityTotalLabel: { fontSize: 13, color: C.textMuted },
  charityTotalValue: { fontSize: 28, fontFamily: 'Jost_700Bold', color: C.red, marginTop: 2 },

  charityInputWrap: { backgroundColor: C.bgSurface, borderRadius: 18, marginHorizontal: 18, padding: 16 },
  charityInput: { fontSize: 18, fontFamily: 'Jost_600SemiBold', color: C.textPrimary, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 12 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F0' },
  categoryChipActive: { backgroundColor: C.red },
  categoryLabel: { fontSize: 12, color: C.textSecondary, fontFamily: 'Jost_500Medium' },
  categoryLabelActive: { color: '#FFF', fontFamily: 'Jost_600SemiBold' },
  addCharityBtn: { backgroundColor: C.red, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  addCharityText: { color: '#FFF', fontSize: 15, fontFamily: 'Jost_700Bold' },

  charityRecord: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSurface, borderRadius: 14, marginHorizontal: 18, marginBottom: 8, padding: 14 },
  charityDot: { width: 10, height: 10, borderRadius: 5 },
  charityRecordCat: { fontSize: 14, fontFamily: 'Jost_600SemiBold', color: C.textPrimary },
  charityRecordDate: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  charityRecordAmount: { fontSize: 16, fontFamily: 'Jost_700Bold', color: C.textPrimary }});
