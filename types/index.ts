export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  priceRange: string;
  image: string;
  tags: string[];
  featured?: boolean;
  city: 'Hyderabad' | 'Bengaluru' | 'Chennai' | 'Mumbai';
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  image: string;
}

export interface Offer {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  bannerImage: string;
  isActive: boolean;
  createdAt?: string;
}

