import { supabase } from './supabase';
import { Restaurant, MenuItem, CartItem, Offer } from '../types';

// Let's create an in-memory or localStorage cache for mock data to persist business actions in preview mode.
const LOCAL_STORAGE_RESTAURANT_KEY = 'localeats_owned_restaurant_';
const LOCAL_STORAGE_MENU_ITEMS_KEY = 'localeats_owned_menu_items_';
const LOCAL_STORAGE_ORDERS_KEY = 'localeats_owned_orders_';
const LOCAL_STORAGE_CUSTOMER_ORDERS_KEY = 'localeats_customer_orders_';

// Curated default food images for easy selection in business registration
export const CURATED_FOOD_IMAGES = [
  {
    name: 'Elegant Biryani',
    url: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'North Indian Feast',
    url: 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Crispy Dosa & Idli',
    url: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Gourmet Desserts',
    url: 'https://images.pexels.com/photos/2915282/pexels-photo-2915282.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Sizzling Samosas & Snacks',
    url: 'https://images.pexels.com/photos/14477873/pexels-photo-14477873.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'South Indian Meals Thali',
    url: 'https://images.pexels.com/photos/2316904/pexels-photo-2316904.jpeg?auto=compress&cs=tinysrgb&w=600',
  }
];

export interface MerchantOrder {
  id: string;
  restaurantId: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
}

// --- ADDRESSES (persistent storage in Supabase) ---
export async function getAddresses(userId: string) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false }).order('created_at', { ascending: false });
    if (data && !error) {
      // Map DB column names to the UI-friendly shape expected by DeliveryAddressesScreen
      return data.map((d: any) => ({
        id: d.id,
        label: d.label || d.recipient_name || 'Home',
        line1: d.address_line || '',
        line2: d.address_line2 || '',
        area: d.area || '',
        city: d.city || '',
        state: d.state || d.region || '',
        zip: d.postal_code || d.zip || '',
        phone: d.phone || '',
        isDefault: !!d.is_default,
      }));
    }
  } catch (e) {
    console.warn('getAddresses failed:', e);
  }
  return [];
}

export async function createAddress(userId: string, address: any) {
  const id = `addr-${Date.now()}`;
  try {
    const row = { id, user_id: userId, label: address.label || 'Home', recipient_name: address.recipient_name || '', phone: address.phone || '', address_line: address.address_line, city: address.city || '', state: address.state || '', postal_code: address.postal_code || '', latitude: address.latitude || null, longitude: address.longitude || null, is_default: !!address.is_default };
    const { error } = await supabase.from('addresses').insert(row);
    if (error) throw error;
    return row;
  } catch (e) {
    console.warn('createAddress failed:', e);
    throw e;
  }
}

export async function updateAddress(userId: string, id: string, address: any) {
  try {
    const { error } = await supabase.from('addresses').update(address).eq('id', id).eq('user_id', userId);
    if (error) throw error;
    const { data } = await supabase.from('addresses').select('*').eq('id', id).maybeSingle();
    return data;
  } catch (e) {
    console.warn('updateAddress failed:', e);
    throw e;
  }
}

export async function deleteAddress(userId: string, id: string) {
  try {
    console.warn('deleteAddress called for', userId, id, new Error().stack);
    const { error } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('deleteAddress failed:', e);
    return false;
  }
}

// --- NOTIFICATIONS (persistent) ---
export async function getNotifications(userId: string) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data && !error) return data;
  } catch (e) {
    console.warn('getNotifications failed:', e);
  }
  return [];
}

export async function markNotificationRead(userId: string, id: string) {
  try {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('markNotificationRead failed:', e);
    return false;
  }
}

// --- REVIEWS ---
export async function getReviewsForRestaurant(restaurantId: string) {
  try {
    const { data, error } = await supabase.from('reviews').select('*, auth.users(id, email)');
    if (data && !error) {
      const filtered = data.filter((r: any) => r.restaurant_id === restaurantId);
      return filtered;
    }
  } catch (e) {
    console.warn('getReviewsForRestaurant failed:', e);
  }
  return [];
}

export async function createReview(userId: string, restaurantId: string, orderId: string | null, rating: number, comment: string) {
  const id = `rev-${Date.now()}`;
  try {
    const { error } = await supabase.from('reviews').insert({ id, user_id: userId, restaurant_id: restaurantId, order_id: orderId, rating, comment });
    if (error) throw error;

    // Update restaurant aggregates by computing from all reviews (safe, avoids SQL alias issues)
    try {
      const { data: allReviews } = await supabase.from('reviews').select('rating').eq('restaurant_id', restaurantId);
      if (allReviews && allReviews.length > 0) {
        const sum = allReviews.reduce((s: number, r: any) => s + Number(r.rating || 0), 0);
        const avg = (sum / allReviews.length) || 0;
        await supabase.from('restaurants').update({ rating: avg.toFixed(2), review_count: allReviews.length }).eq('id', restaurantId);
      }
    } catch (e) {
      console.warn('Failed to compute aggregates client-side:', e);
    }

    return id;
  } catch (e) {
    console.warn('createReview failed:', e);
    throw e;
  }
}

export async function createNotification(userId: string, payload: any) {
  try {
    const row = {
      id: payload.id || `notif-${Date.now()}`,
      user_id: userId,
      title: payload.title,
      message: payload.message,
      category: payload.category || 'app',
      related_entity: payload.related_entity || null,
      related_id: payload.related_id || null,
      read: false
    };

    const { error } = await supabase.from('notifications').insert(row);
    if (error) {
      throw error;
    }

    return row;
  } catch (e) {
    console.warn('createNotification failed:', e);
    throw e;
  }
}

// --- ANALYTICS for merchant dashboard ---
export async function getMerchantAnalytics(ownerId: string, restaurantId: string) {
  try {
    // verify ownership
    const { data: rest, error: restErr } = await supabase.from('restaurants').select('id').eq('id', restaurantId).eq('owner_id', ownerId).maybeSingle();
    if (restErr || !rest) {
      return null;
    }

    // fetch orders for last 30 days
    const { data: ordersData } = await supabase.from('orders').select('id,total_price,created_at,status').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;
    const deliveredOrders: any[] = [];
    const orderIds: string[] = [];
    if (ordersData && Array.isArray(ordersData)) {
      for (const o of ordersData) {
        const created = new Date(o.created_at);
        if (o.status === 'delivered') {
          deliveredOrders.push(o);
        }
        if (created >= startToday) todayRevenue += Number(o.total_price || 0);
        if (created >= startWeek) weekRevenue += Number(o.total_price || 0);
        if (created >= startMonth) monthRevenue += Number(o.total_price || 0);
        orderIds.push(o.id);
      }
    }

    // best selling items (aggregate locally)
    let bestSelling: { menu_item_id: string; name: string; quantity: number }[] = [];
    if (orderIds.length > 0) {
      const { data: itemsData } = await supabase.from('order_items').select('menu_item_id,name,quantity').in('order_id', orderIds);
      if (itemsData) {
        const agg: Record<string, { name: string; qty: number }> = {};
        for (const it of itemsData) {
          const id = it.menu_item_id || it.name;
          if (!agg[id]) agg[id] = { name: it.name, qty: 0 };
          agg[id].qty += Number(it.quantity || 0);
        }
        bestSelling = Object.keys(agg).map(k => ({ menu_item_id: k, name: agg[k].name, quantity: agg[k].qty })).sort((a, b) => b.quantity - a.quantity).slice(0, 6);
      }
    }

    return {
      todayRevenue,
      weekRevenue,
      monthRevenue,
      deliveredCount: deliveredOrders.length,
      bestSelling
    };
  } catch (e) {
    console.warn('getMerchantAnalytics failed:', e);
    return null;
  }
}

// --- SEARCH ---
export async function searchCatalog(query: string) {
  const q = (query || '').trim();
  if (!q) return { restaurants: [], dishes: [] };
  try {
    // Restaurants: full-text search and ilike fallback
    const { data: restFT } = await supabase.from('restaurants').select('*').textSearch('name, cuisine', q, { config: 'english' }).limit(20);
    let restaurantsRes = restFT || [];
    if (restaurantsRes.length === 0) {
      const { data: restLike } = await supabase.from('restaurants').select('*').ilike('name', `%${q}%`).limit(20);
      restaurantsRes = restLike || [];
    }

    // Dishes: search menu_items and join restaurants for context
    const { data: dishFT } = await supabase.from('menu_items').select('*, restaurants(name)').textSearch('name, description', q, { config: 'english' }).limit(30);
    let dishesRes = dishFT || [];
    if (dishesRes.length === 0) {
      const { data: dishLike } = await supabase.from('menu_items').select('*, restaurants(name)').ilike('name', `%${q}%`).limit(30);
      dishesRes = dishLike || [];
    }

    return { restaurants: restaurantsRes, dishes: dishesRes };
  } catch (e) {
    console.warn('searchCatalog failed:', e);
    return { restaurants: [], dishes: [] };
  }
}


// Get restaurant owned by a user
export async function getOwnedRestaurant(userId: string): Promise<Restaurant | null> {
  try {
    // 1. Try to fetch from local storage first to keep custom registration live
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_RESTAURANT_KEY}${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    }

    // 2. Try Supabase lookup if configured. 
    // Since metadata might save owned restaurant ID, let's look up metadata or table
    // Let's check if the user metadata contains an owned restaurant
    const { data: { user } } = await supabase.auth.getUser();
    const ownedId = user?.user_metadata?.owned_restaurant_id;
    if (ownedId) {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', ownedId)
        .maybeSingle();
      if (data && !error) {
        const mapped: Restaurant = {
          id: data.id,
          name: data.name,
          cuisine: data.cuisine,
          rating: Number(data.rating || 5.0),
          reviewCount: data.review_count || 0,
          deliveryTime: data.delivery_time || 'N/A',
          deliveryFee: Number(data.delivery_fee || 0),
          priceRange: data.price_range || 'Mid Range',
          image: data.image,
          tags: data.tags || [],
          city: data.city,
          featured: data.featured || false,
        };
        return mapped;
      }
    }
  } catch (error) {
    console.warn("getOwnedRestaurant issue:", error);
  }
  return null;
}

// Save or Update owned restaurant
export async function saveOwnedRestaurant(
  userId: string, 
  restaurantData: Omit<Restaurant, 'rating' | 'reviewCount'> & { rating?: number; reviewCount?: number }
): Promise<Restaurant> {
  let resolvedImage = restaurantData.image;

  // If the merchant selected a local file or data URI, upload it to the shared public
  // Supabase Storage bucket and replace the local-only URI with a real URL so the
  // restaurant image persists in the app and can be displayed by all screens.
  if (typeof resolvedImage === 'string' && (resolvedImage.startsWith('data:') || resolvedImage.startsWith('file:') || resolvedImage.startsWith('/'))) {
    const dest = `restaurants/${restaurantData.id}/${Date.now()}-banner.jpg`;
    resolvedImage = await uploadImageToStorage('public', dest, resolvedImage);
  }

  const completeRestaurant: Restaurant = {
    ...restaurantData,
    image: resolvedImage,
    rating: restaurantData.rating ?? 5.0,
    reviewCount: restaurantData.reviewCount ?? 1,
  };

  // 1. Save locally to guarantee instant functionality
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${LOCAL_STORAGE_RESTAURANT_KEY}${userId}`, JSON.stringify(completeRestaurant));
  }

  // 2. Try to upsert into Supabase for real integrations
  try {
    // Check if table column is compatible or try insert
    const row = {
      id: completeRestaurant.id,
      name: completeRestaurant.name,
      cuisine: completeRestaurant.cuisine,
      rating: completeRestaurant.rating,
      review_count: completeRestaurant.reviewCount,
      delivery_time: completeRestaurant.deliveryTime,
      delivery_fee: completeRestaurant.deliveryFee,
      price_range: completeRestaurant.priceRange,
      image: completeRestaurant.image,
      tags: completeRestaurant.tags,
      city: completeRestaurant.city,
      featured: completeRestaurant.featured || false,
      owner_id: userId
    };

    const { error } = await supabase
      .from('restaurants')
      .upsert(row, { onConflict: 'id' });

    if (!error) {
      // If successful, update user metadata to link this restaurant
      await supabase.auth.updateUser({
        data: { owned_restaurant_id: completeRestaurant.id }
      });
    } else {
      console.warn("Supabase upsert failed, using offline mode:", error.message);
    }
  } catch (e) {
    console.warn("Supabase save error, fallback active:", e);
  }

  return completeRestaurant;
}

export async function deleteOwnedRestaurant(userId: string, restaurantId: string): Promise<void> {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(`${LOCAL_STORAGE_RESTAURANT_KEY}${userId}`);
    localStorage.removeItem(`${LOCAL_STORAGE_MENU_ITEMS_KEY}${restaurantId}`);
    localStorage.removeItem(`${LOCAL_STORAGE_ORDERS_KEY}${restaurantId}`);
    localStorage.removeItem(`${LOCAL_STORAGE_OFFERS_KEY}${restaurantId}`);
  }

  const errors: string[] = [];

  const offerDelete = await supabase.from('offers').delete().eq('restaurant_id', restaurantId);
  if (offerDelete.error) errors.push(`offers: ${offerDelete.error.message}`);

  const menuDelete = await supabase.from('menu_items').delete().eq('restaurant_id', restaurantId);
  if (menuDelete.error) errors.push(`menu_items: ${menuDelete.error.message}`);

  // Restaurant deletions cascade to orders and order_items via foreign key constraints.
  const restaurantDelete = await supabase.from('restaurants').delete().eq('id', restaurantId);
  if (restaurantDelete.error) errors.push(`restaurants: ${restaurantDelete.error.message}`);

  const authUpdate = await supabase.auth.updateUser({ data: { owned_restaurant_id: null } });
  if (authUpdate.error) errors.push(`auth: ${authUpdate.error.message}`);

  if (errors.length > 0) {
    const combined = errors.join(' | ');
    console.warn('Supabase deleteOwnedRestaurant encountered errors:', combined);
    throw new Error(combined);
  }
}

// Get menu items for an owned restaurant
export async function getBusinessMenuItems(restaurantId: string): Promise<MenuItem[]> {
  try {
    // 1. Try local storage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_MENU_ITEMS_KEY}${restaurantId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    }

    // 2. Fallback to Supabase query
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (data && !error && data.length > 0) {
      const mapped = data.map((row: any) => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        name: row.name,
        description: row.description || '',
        price: Number(row.price),
        image: row.image,
        category: row.category,
        popular: row.popular || false,
      }));
      return mapped;
    }
  } catch (error) {
    console.warn("getBusinessMenuItems issue:", error);
  }

  // Default seed or empty array
  return [];
}

// Save or add menu item
export async function saveBusinessMenuItem(restaurantId: string, item: MenuItem): Promise<MenuItem[]> {
  const currentItems = await getBusinessMenuItems(restaurantId);
  const existsIdx = currentItems.findIndex(i => i.id === item.id);

  if (existsIdx > -1) {
    currentItems[existsIdx] = item;
  } else {
    currentItems.push(item);
  }

  // Save locally
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${LOCAL_STORAGE_MENU_ITEMS_KEY}${restaurantId}`, JSON.stringify(currentItems));
  }

  // Attempt Supabase
  try {
    const row = {
      id: item.id,
      restaurant_id: item.restaurantId,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category,
      popular: item.popular || false
    };

    await supabase.from('menu_items').upsert(row, { onConflict: 'id' });
  } catch (err) {
    console.warn("Supabase menu save failed:", err);
  }

  return currentItems;
}

// Delete menu item
export async function deleteBusinessMenuItem(restaurantId: string, itemId: string): Promise<MenuItem[]> {
  const currentItems = await getBusinessMenuItems(restaurantId);
  const updated = currentItems.filter(i => i.id !== itemId);

  // Save locally
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${LOCAL_STORAGE_MENU_ITEMS_KEY}${restaurantId}`, JSON.stringify(updated));
  }

  // Attempt Supabase
  try {
    await supabase.from('menu_items').delete().eq('id', itemId);
  } catch (err) {
    console.warn("Supabase menu delete failed:", err);
  }

  return updated;
}

// Get merchant orders
export async function getBusinessOrders(restaurantId: string): Promise<MerchantOrder[]> {
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    if (!ordersData || ordersData.length === 0) {
      return [];
    }

    const orderIds = ordersData.map(o => o.id);
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) {
      throw itemsError;
    }

    const mappedOrders = ordersData.map(o => {
      const associatedItems = (itemsData || [])
        .filter(item => item.order_id === o.id)
        .map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price)
        }));

      return {
        id: o.id,
        restaurantId: o.restaurant_id,
        customerName: o.customer_name,
        items: associatedItems,
        totalPrice: Number(o.total_price),
        status: o.status as any,
        createdAt: o.created_at,
        paymentMethod: o.payment_method || 'COD',
        paymentStatus: o.payment_status || 'pending',
        transactionId: o.transaction_id || ''
      };
    });

    return mappedOrders;
  } catch (err) {
    console.warn('Supabase getBusinessOrders failed:', err);
    return [];
  }
}

// Update order status
export async function updateBusinessOrderStatus(restaurantId: string, orderId: string, status: MerchantOrder['status']): Promise<MerchantOrder[]> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId);

    if (error) {
      throw error;
    }

    try {
      const { data: ord } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
      if (ord && ord.user_id) {
        await createNotification(ord.user_id, {
          id: `notif-${orderId}-status-${Date.now()}`,
          title: `Order ${orderId} is ${status}`,
          message: `Your order ${orderId} status has been updated to ${status}.`,
          category: 'order',
          related_entity: 'orders',
          related_id: orderId
        });
      }
    } catch (nErr) {
      console.warn('Failed to create status-change notification:', nErr);
    }
  } catch (err) {
    console.warn('Supabase updateBusinessOrderStatus failed:', err);
    throw err;
  }

  return getBusinessOrders(restaurantId);
}

// Generate an incoming simulated order
export async function addSimulatedOrder(restaurantId: string): Promise<MerchantOrder[]> {
  const orders = await getBusinessOrders(restaurantId);
  const names = ['Ravi Teja', 'Sonia Reddy', 'Nikhil Gowda', 'Priya Sharma', 'Karthik Raja', 'Deepa Nair'];
  const itemsPool = [
    { name: 'Masala Dosa', price: 120 },
    { name: 'Paneer Tikka', price: 240 },
    { name: 'Mango Lassi', price: 80 },
    { name: 'Chicken Biryani', price: 250 },
    { name: 'Garlic Naan', price: 70 },
    { name: 'Mutton Haleem', price: 280 }
  ];

  const selectedItems = Array.from({ length: Math.floor(Math.random() * 2) + 1 }, () => {
    const item = itemsPool[Math.floor(Math.random() * itemsPool.length)];
    return {
      name: item.name,
      quantity: Math.floor(Math.random() * 2) + 1,
      price: item.price
    };
  });

  const total = selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const newOrder: MerchantOrder = {
    id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
    restaurantId,
    customerName: names[Math.floor(Math.random() * names.length)],
    items: selectedItems,
    totalPrice: total,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  const updated = [newOrder, ...orders];
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${LOCAL_STORAGE_ORDERS_KEY}${restaurantId}`, JSON.stringify(updated));
  }

  // Try inserting simulation into Supabase
  try {
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: newOrder.id,
        restaurant_id: restaurantId,
        user_id: 'simulated_user',
        customer_name: newOrder.customerName,
        total_price: total,
        status: 'pending',
        created_at: newOrder.createdAt
      });

    if (!orderError) {
      const itemRows = selectedItems.map((item, index) => ({
        id: `${newOrder.id}-item-${index}`,
        order_id: newOrder.id,
        menu_item_id: 'm1', // seed fallback MenuItem ID
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));
      await supabase.from('order_items').insert(itemRows);
    }
  } catch (err) {
    console.warn("Simulated order Supabase sync failed:", err);
  }

  return updated;
}

// Customers can place orders
export async function placeOrder(
  userId: string,
  customerName: string,
  restaurantId: string,
  restaurantName: string,
  cartItems: CartItem[],
  totalPrice: number,
  addressId: string | null = null,
  paymentMethod: string = 'COD',
  paymentStatus: string = 'pending',
  transactionId: string = ''
): Promise<string> {
  const orderId = `ord-${Math.floor(1000 + Math.random() * 9000)}`;
  const createdAt = new Date().toISOString();

  const formattedItems = cartItems.map(item => ({
    name: item.menuItem.name,
    quantity: item.quantity,
    price: item.menuItem.price
  }));

  let formattedAddress: string | null = null;
  if (addressId) {
    try {
      const { data: addrData, error: addrErr } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .maybeSingle();
      if (!addrErr && addrData) {
        formattedAddress = `${addrData.address_line || ''}${addrData.address_line2 ? ', ' + addrData.address_line2 : ''}${addrData.area ? ', ' + addrData.area : ''}${addrData.city ? ', ' + addrData.city : ''}${addrData.postal_code ? ' - ' + addrData.postal_code : ''}`;
      }
    } catch (e) {
      console.warn('Failed to fetch attached order address for local write:', e);
    }
  }

  // Create order object for local storage
  const newOrder = {
    id: orderId,
    restaurantId,
    restaurantName,
    customerName,
    items: formattedItems,
    totalPrice,
    status: 'pending' as const,
    createdAt,
    userId,
    paymentMethod,
    paymentStatus,
    transactionId,
    address: formattedAddress || 'Delivery address selected',
    addressId
  };

  // 1. Dual-write to Merchant Orders LOCAL STORAGE
  if (typeof window !== 'undefined') {
    try {
      const existingMerchantOrdersStr = localStorage.getItem(`${LOCAL_STORAGE_ORDERS_KEY}${restaurantId}`);
      const merchantOrders = existingMerchantOrdersStr ? JSON.parse(existingMerchantOrdersStr) : [];
      localStorage.setItem(`${LOCAL_STORAGE_ORDERS_KEY}${restaurantId}`, JSON.stringify([newOrder, ...merchantOrders]));
    } catch (e) {
      console.warn("Merchant order local save failed:", e);
    }

    // 2. Dual-write to Customer Orders LOCAL STORAGE
    try {
      const existingCustomerOrdersStr = localStorage.getItem(`${LOCAL_STORAGE_CUSTOMER_ORDERS_KEY}${userId}`);
      const customerOrders = existingCustomerOrdersStr ? JSON.parse(existingCustomerOrdersStr) : [];
      localStorage.setItem(`${LOCAL_STORAGE_CUSTOMER_ORDERS_KEY}${userId}`, JSON.stringify([newOrder, ...customerOrders]));
    } catch (e) {
      console.warn("Customer order local save failed:", e);
    }
  }

  // 3. Try saving to Supabase for real integrations
  try {
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        restaurant_id: restaurantId,
        user_id: userId,
        customer_name: customerName,
        total_price: totalPrice,
        status: 'pending',
        created_at: createdAt,
        address_id: addressId,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        transaction_id: transactionId
      });

    if (!orderError) {
      const itemRows = cartItems.map((item, index) => ({
        id: `${orderId}-item-${index}`,
        order_id: orderId,
        menu_item_id: item.menuItem.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price
      }));

      await supabase.from('order_items').insert(itemRows);
    } else {
      console.error("Supabase insert order error:", orderError);
    }
    // Create notification records: customer and merchant
    try {
      // Customer notification
      await supabase.from('notifications').insert({
        id: `notif-${orderId}-cust`,
        user_id: userId,
        title: 'Order placed',
        message: `Your order ${orderId} at ${restaurantName} has been placed successfully.`,
        category: 'order',
        related_entity: 'orders',
        related_id: orderId
      });

      // Merchant notification: find owner
      const { data: restData } = await supabase.from('restaurants').select('owner_id').eq('id', restaurantId).maybeSingle();
      if (restData && restData.owner_id) {
        await supabase.from('notifications').insert({
          id: `notif-${orderId}-merch`,
          user_id: restData.owner_id,
          title: 'New order received',
          message: `New order ${orderId} was placed at your restaurant ${restaurantName}.`,
          category: 'order',
          related_entity: 'orders',
          related_id: orderId
        });
      }
    } catch (nErr) {
      console.warn('Failed to create notifications for order:', nErr);
    }
    // Record payment event for server-side verification
    try {
      if (transactionId && transactionId !== 'N/A') {
        await supabase.from('payment_events').insert({
          id: `pe-${orderId}`,
          order_id: orderId,
          provider: paymentMethod,
          transaction_id: transactionId,
          status: paymentStatus,
          verified: false,
          payload: {}
        });
      }
    } catch (pErr) {
      console.warn('Failed to create payment_event record:', pErr);
    }
  } catch (err) {
    console.warn("Supabase placeOrder error (fallback active):", err);
  }

  return orderId;
}

// Customers can get their orders
export async function getCustomerOrders(userId: string): Promise<any[]> {
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*, restaurants(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    if (!ordersData || ordersData.length === 0) {
      return [];
    }

    const orderIds = ordersData.map(o => o.id);
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) {
      throw itemsError;
    }

    const addressIds = Array.from(new Set(ordersData.map((o: any) => o.address_id).filter(Boolean)));
    let addressesMap: Record<string, any> = {};
    if (addressIds.length > 0) {
      try {
        const { data: addrData } = await supabase.from('addresses').select('*').in('id', addressIds);
        if (addrData) {
          addressesMap = addrData.reduce((acc: any, a: any) => ({ ...acc, [a.id]: a }), {});
        }
      } catch (e) {
        console.warn('Failed to fetch order addresses:', e);
      }
    }

    const mappedOrders = ordersData.map(o => {
      const associatedItems = (itemsData || [])
        .filter(item => item.order_id === o.id)
        .map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price)
        }));

      const addr = o.address_id ? addressesMap[o.address_id] : null;
      const formattedAddress = addr ? `${addr.address_line || ''}${addr.address_line2 ? ', ' + addr.address_line2 : ''}${addr.area ? ', ' + addr.area : ''}${addr.city ? ', ' + addr.city : ''}${addr.postal_code ? ' - ' + addr.postal_code : ''}` : null;

      return {
        id: o.id,
        restaurantId: o.restaurant_id,
        restaurantName: o.restaurants?.name || 'Local Restaurant',
        customerName: o.customer_name,
        items: associatedItems,
        totalPrice: Number(o.total_price),
        status: o.status,
        createdAt: o.created_at,
        userId: o.user_id,
        paymentMethod: o.payment_method || 'COD',
        paymentStatus: o.payment_status || 'pending',
        transactionId: o.transaction_id || '',
        address: formattedAddress,
        addressId: o.address_id || null
      };
    });

    return mappedOrders;
  } catch (err) {
    console.warn('Supabase getCustomerOrders failed:', err);
    return [];
  }
}

// --- OFFERS & PROMOTIONS SYSTEM EXPORTS ---
const LOCAL_STORAGE_OFFERS_KEY = 'localeats_offers_';

async function requireRestaurantOwnerForOfferMutation(restaurantId: string) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    throw new Error('Merchant authentication required to manage offers.');
  }

  const { data: restaurant, error: restErr } = await supabase
    .from('restaurants')
    .select('id, owner_id')
    .eq('id', restaurantId)
    .maybeSingle();

  if (restErr || !restaurant) {
    throw new Error('Restaurant ownership record not found.');
  }

  if (restaurant.owner_id !== user.id) {
    throw new Error('Only the authenticated restaurant owner can manage offers.');
  }
}

export async function getOffers(restaurantId: string): Promise<Offer[]> {
  let localOffers: Offer[] | null = null;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`${LOCAL_STORAGE_OFFERS_KEY}${restaurantId}`);
    if (stored) {
      try {
        localOffers = JSON.parse(stored);
      } catch {
        localOffers = null;
      }
    }
  }

  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const mapped = data.map(o => ({
        id: o.id,
        restaurantId: o.restaurant_id,
        title: o.title,
        description: o.description,
        discountPercentage: o.discount_percentage,
        startDate: o.start_date,
        endDate: o.end_date,
        bannerImage: o.banner_image,
        isActive: o.is_active,
        createdAt: o.created_at
      }));

      if (localOffers && localOffers.length > 0) {
        const existingIds = new Set(mapped.map(o => o.id));
        const merged = [...mapped];
        localOffers.forEach(local => {
          if (!existingIds.has(local.id)) {
            merged.push({ ...local, createdAt: local.createdAt ?? new Date().toISOString() });
          }
        });
        if (merged.length > 0) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`${LOCAL_STORAGE_OFFERS_KEY}${restaurantId}`, JSON.stringify(merged));
          }
        }
        return merged;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${LOCAL_STORAGE_OFFERS_KEY}${restaurantId}`, JSON.stringify(mapped));
      }
      return mapped;
    }
  } catch (err) {
    console.warn("Supabase getOffers failed, using local storage:", err);
  }

  if (localOffers) {
    return localOffers;
  }
  return [];
}

export async function createOffer(
  restaurantId: string,
  offerData: Omit<Offer, 'id' | 'restaurantId' | 'isActive'>
): Promise<Offer> {
  await requireRestaurantOwnerForOfferMutation(restaurantId);

  const offerId = `off-${Math.floor(1000 + Math.random() * 9000)}`;
  const newOffer: Offer = {
    id: offerId,
    restaurantId,
    title: offerData.title,
    description: offerData.description,
    discountPercentage: Number(offerData.discountPercentage),
    startDate: offerData.startDate,
    endDate: offerData.endDate,
    bannerImage: offerData.bannerImage || 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=600',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from('offers')
      .insert({
        id: newOffer.id,
        restaurant_id: newOffer.restaurantId,
        title: newOffer.title,
        description: newOffer.description,
        discount_percentage: newOffer.discountPercentage,
        start_date: newOffer.startDate,
        end_date: newOffer.endDate,
        banner_image: newOffer.bannerImage,
        is_active: newOffer.isActive
      });
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase createOffer failed:', err);
    throw err;
  }

  return newOffer;
}

export async function updateOffer(
  restaurantId: string,
  offer: Offer
): Promise<Offer> {
  await requireRestaurantOwnerForOfferMutation(restaurantId);

  try {
    const { error } = await supabase
      .from('offers')
      .update({
        title: offer.title,
        description: offer.description,
        discount_percentage: Number(offer.discountPercentage),
        start_date: offer.startDate,
        end_date: offer.endDate,
        banner_image: offer.bannerImage,
        is_active: offer.isActive
      })
      .eq('id', offer.id)
      .eq('restaurant_id', restaurantId);
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase updateOffer failed:', err);
    throw err;
  }

  return offer;
}

export async function deleteOffer(restaurantId: string, offerId: string): Promise<void> {
  await requireRestaurantOwnerForOfferMutation(restaurantId);

  try {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId)
      .eq('restaurant_id', restaurantId);
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase deleteOffer failed:', err);
    throw err;
  }
}

// Upload image URI to Supabase Storage and return public URL
export async function uploadImageToStorage(bucket: string, destPath: string, fileUri: string): Promise<string> {
  try {
    const res = await fetch(fileUri);
    if (!res.ok) {
      throw new Error(`Failed to fetch image file for upload: ${res.status} ${res.statusText}`);
    }

    const blob = await res.blob();
    const { data, error: upErr } = await supabase.storage.from(bucket).upload(destPath, blob, { upsert: true });
    if (upErr) {
      console.warn('Supabase storage upload failed:', upErr.message || upErr);
      throw upErr;
    }

    const { data: urlData } = await supabase.storage.from(bucket).getPublicUrl(destPath);
    if (urlData && urlData.publicUrl) return urlData.publicUrl;

    throw new Error('Supabase storage did not return a public URL for the uploaded image.');
  } catch (e) {
    console.warn('uploadImageToStorage failed:', e);
    throw e;
  }
}

// Global active offers
export async function getActiveOffersNearYou(): Promise<(Offer & { restaurantName: string })[]> {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*, restaurants(name)')
      .eq('is_active', true);

    if (data && !error) {
      return data.map(o => ({
        id: o.id,
        restaurantId: o.restaurant_id,
        title: o.title,
        description: o.description,
        discountPercentage: o.discount_percentage,
        startDate: o.start_date,
        endDate: o.end_date,
        bannerImage: o.banner_image,
        isActive: o.is_active,
        restaurantName: o.restaurants?.name || 'Local Restaurant'
      }));
    }
  } catch (err) {
    console.warn("Supabase getActiveOffersNearYou failed, querying local storage fallback:", err);
  }

  // Local storage scan
  if (typeof window !== 'undefined') {
    const allOffers: (Offer & { restaurantName: string })[] = [];
    try {
      // Fetch names from restaurants list or assume a name
      const storedJson = localStorage.getItem('localeats_owned_restaurant_');
      let defaultRestaurants: any[] = [];
      if (storedJson) {
        defaultRestaurants = [JSON.parse(storedJson)];
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_STORAGE_OFFERS_KEY)) {
          const resId = key.replace(LOCAL_STORAGE_OFFERS_KEY, '');
          let restName = 'Local Restaurant';
          if (resId === '1') restName = 'Paradise Biryani';
          else if (resId === '2') restName = 'Mehfil';
          else if (resId === '3') restName = 'Sri Kanya';
          else if (resId === '4') restName = 'Bawarchi';
          else {
            const rObj = defaultRestaurants.find(r => r.id === resId);
            if (rObj) restName = rObj.name;
          }

          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored) as Offer[];
            parsed.forEach(o => {
              if (o.isActive) {
                allOffers.push({ ...o, restaurantName: restName });
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn("Local storage scan for offers failed", e);
    }

    if (allOffers.length > 0) {
      return allOffers;
    }
  }

  // Seed offers fallback
  return [
    {
      id: 'o1',
      restaurantId: '1',
      title: 'Super Biryani Feast',
      description: 'Save majorly on authentic chicken & mutton biryanis today!',
      discountPercentage: 20,
      startDate: '2026-06-01',
      endDate: '2026-12-31',
      bannerImage: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=600',
      isActive: true,
      restaurantName: 'Paradise Biryani'
    },
    {
      id: 'o2',
      restaurantId: '2',
      title: 'Mehfil Royal Discount',
      description: 'Flat 15% discount on all Mughlai curries and delicious Naans!',
      discountPercentage: 15,
      startDate: '2026-06-01',
      endDate: '2026-12-31',
      bannerImage: 'https://images.pexels.com/photos/2474660/pexels-photo-2474660.jpeg?auto=compress&cs=tinysrgb&w=600',
      isActive: true,
      restaurantName: 'Mehfil'
    }
  ];
}

