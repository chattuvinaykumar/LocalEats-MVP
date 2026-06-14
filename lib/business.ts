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
  const completeRestaurant: Restaurant = {
    ...restaurantData,
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
  let localOrders: MerchantOrder[] | null = null;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`${LOCAL_STORAGE_ORDERS_KEY}${restaurantId}`);
    if (stored) {
      try {
        localOrders = JSON.parse(stored);
      } catch {
        localOrders = null;
      }
    }
  }

  try {
    // 1. Try querying Supabase first
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (ordersData && !ordersError) {
      if (ordersData.length === 0 && localOrders) {
        return localOrders;
      }

      const orderIds = ordersData.map(o => o.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsData && !itemsError) {
        const mappedOrders = ordersData.map(o => {
          const associatedItems = itemsData
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
      }
    }
  } catch (err) {
    console.warn("Supabase getBusinessOrders failed, trying local storage:", err);
  }

  if (localOrders) {
    return localOrders;
  }

  // Seed default orders to make empty state feel interactive & gorgeous!
  const defaultOrders: MerchantOrder[] = [
    {
      id: 'ord-3021',
      restaurantId,
      customerName: 'Vinay Kumar',
      items: [
        { name: 'Special Chicken Biryani', quantity: 2, price: 250 },
        { name: 'Cold Beverage', quantity: 2, price: 40 }
      ],
      totalPrice: 580,
      status: 'pending',
      createdAt: new Date(Date.now() - 5 * 60000).toISOString() // 5 mins ago
    },
    {
      id: 'ord-2984',
      restaurantId,
      customerName: 'Aishwarya Sen',
      items: [
        { name: 'Paneer Butter Masala', quantity: 1, price: 280 },
        { name: 'Butter Naan', quantity: 3, price: 60 }
      ],
      totalPrice: 460,
      status: 'preparing',
      createdAt: new Date(Date.now() - 22 * 60000).toISOString() // 22 mins ago
    },
    {
      id: 'ord-2891',
      restaurantId,
      customerName: 'Mohammed Ali',
      items: [
        { name: 'Double Ka Meetha', quantity: 2, price: 120 }
      ],
      totalPrice: 240,
      status: 'delivered',
      createdAt: new Date(Date.now() - 120 * 60000).toISOString() // 2 hours ago
    }
  ];

  if (typeof window !== 'undefined') {
    localStorage.setItem(`${LOCAL_STORAGE_ORDERS_KEY}${restaurantId}`, JSON.stringify(defaultOrders));
  }

  return defaultOrders;
}

// Update order status
export async function updateBusinessOrderStatus(restaurantId: string, orderId: string, status: MerchantOrder['status']): Promise<MerchantOrder[]> {
  // Update in local storage
  if (typeof window !== 'undefined') {
    // Update merchant order key
    const merchantStored = localStorage.getItem(`${LOCAL_STORAGE_ORDERS_KEY}${restaurantId}`);
    if (merchantStored) {
      const orders = JSON.parse(merchantStored) as MerchantOrder[];
      const exists = orders.find(o => o.id === orderId);
      if (exists) {
        exists.status = status;
        localStorage.setItem(`${LOCAL_STORAGE_ORDERS_KEY}${restaurantId}`, JSON.stringify(orders));
      }
    }

    // Also update in ALL customer order keys if possible, or just update the current active user key!
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_STORAGE_CUSTOMER_ORDERS_KEY)) {
          const custStored = localStorage.getItem(key);
          if (custStored) {
            const custOrders = JSON.parse(custStored);
            const foundIdx = custOrders.findIndex((o: any) => o.id === orderId);
            if (foundIdx > -1) {
              custOrders[foundIdx].status = status;
              localStorage.setItem(key, JSON.stringify(custOrders));
            }
          }
        }
      }
    } catch (e) {
      console.warn("Scan adjust customer orders status failed:", e);
    }
  }

  // Update in Supabase
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: status })
      .eq('id', orderId);

    if (error) {
      console.warn("Supabase order update failed:", error.message);
    }
  } catch (err) {
    console.warn("Supabase updateBusinessOrderStatus failed (fallback active):", err);
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
    transactionId
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
  } catch (err) {
    console.warn("Supabase placeOrder error (fallback active):", err);
  }

  return orderId;
}

// Customers can get their orders
export async function getCustomerOrders(userId: string): Promise<any[]> {
  let localOrders: any[] | null = null;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`${LOCAL_STORAGE_CUSTOMER_ORDERS_KEY}${userId}`);
    if (stored) {
      try {
        localOrders = JSON.parse(stored);
      } catch {
        localOrders = null;
      }
    }
  }

  try {
    // Try fetching from Supabase
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*, restaurants(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersData && !ordersError) {
      if (ordersData.length === 0 && localOrders) {
        return localOrders;
      }

      const orderIds = ordersData.map(o => o.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsData && !itemsError) {
        const mappedOrders = ordersData.map(o => {
          const associatedItems = itemsData
            .filter(item => item.order_id === o.id)
            .map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: Number(item.price)
            }));

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
            transactionId: o.transaction_id || ''
          };
        });
        return mappedOrders;
      }
    }
  } catch (err) {
    console.warn("Supabase getCustomerOrders failed, trying local storage:", err);
  }

  if (localOrders) {
    return localOrders;
  }

  return [];
}

// --- OFFERS & PROMOTIONS SYSTEM EXPORTS ---
const LOCAL_STORAGE_OFFERS_KEY = 'localeats_offers_';

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

  // write to local storage first
  if (typeof window !== 'undefined') {
    const existing = await getOffers(restaurantId);
    localStorage.setItem(`${LOCAL_STORAGE_OFFERS_KEY}${restaurantId}`, JSON.stringify([newOffer, ...existing]));
  }

  // try saving to Supabase
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
    if (error) console.error("Supabase createOffer failed:", error.message);
  } catch (err) {
    console.warn("Supabase createOffer exception, local storage saved:", err);
  }

  return newOffer;
}

export async function updateOffer(
  restaurantId: string,
  offer: Offer
): Promise<Offer> {
  // edit local storage
  if (typeof window !== 'undefined') {
    const currentList = await getOffers(restaurantId);
    const updated = currentList.map(o => o.id === offer.id ? offer : o);
    localStorage.setItem(`${LOCAL_STORAGE_OFFERS_KEY}${restaurantId}`, JSON.stringify(updated));
  }

  // try saving to Supabase
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
      .eq('id', offer.id);
    if (error) console.error("Supabase updateOffer failed:", error.message);
  } catch (err) {
    console.warn("Supabase updateOffer exception:", err);
  }

  return offer;
}

export async function deleteOffer(restaurantId: string, offerId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    const currentList = await getOffers(restaurantId);
    const updated = currentList.filter(o => o.id !== offerId);
    localStorage.setItem(`${LOCAL_STORAGE_OFFERS_KEY}${restaurantId}`, JSON.stringify(updated));
  }

  try {
    const { error } = await supabase.from('offers').delete().eq('id', offerId);
    if (error) {
      console.warn('Supabase deleteOffer failed:', error.message);
    }
  } catch (err) {
    console.warn('Supabase deleteOffer failed:', err);
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

