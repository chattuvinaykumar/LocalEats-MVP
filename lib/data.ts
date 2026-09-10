import { supabase } from './supabase';
import { restaurants as mockRestaurants, menuItems as mockMenuItems } from '../data/mock';
import { Restaurant, MenuItem } from '../types';

function mapRestaurantRow(row: any): Restaurant {
  return {
    id: row.id,
    name: row.name,
    cuisine: row.cuisine,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    deliveryTime: row.delivery_time,
    deliveryFee: Number(row.delivery_fee),
    priceRange: row.price_range,
    image: row.image,
    tags: row.tags ?? [],
    featured: row.featured ?? false,
    city: row.city,
  };
}

function mapMenuItemRow(row: any): MenuItem {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    image: row.image,
    category: row.category,
    popular: row.popular ?? false,
  };
}

export async function fetchRestaurants(): Promise<Restaurant[]> {
  try {
    const { data, error } = await supabase.from('restaurants').select('*');
    if (error || !data || data.length === 0) {
      return mockRestaurants;
    }
    return data.map(mapRestaurantRow);
  } catch {
    return mockRestaurants;
  }
}

export async function fetchRestaurantById(id: string): Promise<Restaurant | null> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) {
      return mockRestaurants.find(r => r.id === id) ?? null;
    }
    return mapRestaurantRow(data);
  } catch {
    return mockRestaurants.find(r => r.id === id) ?? null;
  }
}

export async function fetchMenuItems(restaurantId?: string, category?: string): Promise<MenuItem[]> {
  try {
    let query = supabase.from('menu_items').select('*');
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      const mockItems = restaurantId
        ? mockMenuItems.filter(m => m.restaurantId === restaurantId)
        : mockMenuItems;
      return category
        ? mockItems.filter(m => m.category === category)
        : mockItems;
    }
    return data.map(mapMenuItemRow);
  } catch {
    const mockItems = restaurantId
      ? mockMenuItems.filter(m => m.restaurantId === restaurantId)
      : mockMenuItems;
    return category
      ? mockItems.filter(m => m.category === category)
      : mockItems;
  }
}
