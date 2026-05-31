import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, UtensilsCrossed, ShoppingCart, User } from 'lucide-react-native';
import { Colors, FontSizes } from '../../constants/theme';
import { useCart } from '../../context/CartContext';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary[600],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarLabelStyle: {
          fontSize: FontSizes.xs,
          fontWeight: '600',
          fontFamily: 'Inter-SemiBold',
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: 'Browse',
          tabBarIcon: ({ size, color }) => <UtensilsCrossed size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ size, color }) => <CartIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}

function CartIcon({ size, color }: { size: number; color: string }) {
  const { totalItems } = useCart();
  return (
    <>
      <ShoppingCart size={size} color={color} strokeWidth={2} />
      {totalItems > 0 && <CartBadge count={totalItems} />}
    </>
  );
}

function CartBadge({ count }: { count: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: Colors.primary[500],
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
});
