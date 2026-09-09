import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, FontSizes } from '../../constants/theme';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [counts, setCounts] = useState({ restaurants: 0, orders: 0, users: 0 });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        // Check platform_roles for current user
        const { data: roles } = await supabase.from('platform_roles').select('*').eq('user_id', user.id).maybeSingle();
        if (roles && roles.role === 'admin') {
          setIsAdmin(true);
          const [{ data: r }, { data: o }] = await Promise.all([
            supabase.from('restaurants').select('*'),
            supabase.from('orders').select('*')
          ]);
          setCounts({ restaurants: r?.length || 0, orders: o?.length || 0, users: 0 });
          // users count: best-effort via auth.users is not available from client; skip
        }
      } catch (e) {
        console.warn('Admin load failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator /></View>;
  if (!isAdmin) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text style={{color:Colors.text}}>Access denied.</Text></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
      <Text style={{ fontSize: FontSizes.xxl, fontWeight: '700', marginBottom: Spacing.md }}>Admin Dashboard</Text>
      <View style={{ backgroundColor: Colors.neutral[50], padding: Spacing.md, borderRadius: 8 }}>
        <Text style={{ fontWeight: '700' }}>Summary</Text>
        <Text>Restaurants: {counts.restaurants}</Text>
        <Text>Orders: {counts.orders}</Text>
        <Text>Users: {counts.users || 'N/A'}</Text>
      </View>
    </ScrollView>
  );
}
