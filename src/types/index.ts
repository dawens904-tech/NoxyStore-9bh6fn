export interface Product {
  id: string;
  name: string;
  nameColor?: string;
  category: 'top-up' | 'gift-card' | 'game-items' | 'cdkey' | 'game-coins';
  image: string;
  discount: number;
  rating: number;
  reviewCount: number;
  soldCount: string;
  originalPrice: number;
  salePrice: number;
  sku: string;
  isInstant: boolean;
  shortDescription: string;
  fullDescription: string;
  howToUse: string;
  howToUseLong?: string;
  
  // Product Info Modal
  infoModalContent?: InfoModalContent;
  
  // Advanced Description System
  descriptionBlocks?: DescriptionBlock[];
  
  // ID/Server System
  requiresPlayerId: boolean;
  playerIdLabel?: string;
  requiresServer: boolean;
  pricingType: 'quantity' | 'server';
  
  // NEW: Product Denominations/Variants System
  denominations?: ProductDenomination[];
  
  // Quantity-based pricing (ID only)
  quantityOptions?: QuantityOption[];
  
  // Server-based pricing (ID + Server)
  servers?: ProductServer[];
  
  // NEW: Multi-Region System
  requiresRegion: boolean;
  availableRegions?: ProductRegion[];
  regionalPricing?: RegionalPricing[];
  
  // Price Adjustment
  priceAdjustment?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  
  isActive: boolean;
  regions?: string[];
  variants?: ProductVariant[];
  similarProducts?: string[];
  visibilityTags: ('top-selling' | 'best-seller' | 'new-product' | 'home-page' | 'gift-card-page')[];
  verifyEndpoint?: string;
  
  reviews?: Review[];
  
  createdAt: string;
  updatedAt: string;
}

// NEW: Product Denomination (e.g., 100 Diamonds, 200 Diamonds)
export interface ProductDenomination {
  id: string;
  name: string; // e.g., "LEGENDARY DREAMSPACE 50 PULLS"
  image: string; // Unique image for this denomination
  quantity?: number;
  originalPrice: number;
  salePrice: number;
  discount: number;
  sku?: string;
  isAvailable: boolean;
  order: number; // Display order
}

// NEW: Info Modal Content
export interface InfoModalContent {
  title?: string;
  description: string;
  image?: string;
  steps?: string[];
}

// NEW: Product Region
export interface ProductRegion {
  id: string;
  name: string; // e.g., "USA&Latam", "Brazil", "Malaysia/Singapore"
  code: string; // e.g., "usa", "brazil", "malaysia"
  isAvailable: boolean;
}

export interface DescriptionBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'text-block' | 'image' | 'image-with-instruction';
  content: string;
  imageUrl?: string;
  instruction?: string;
}

export interface RegionalPricing {
  region: string;
  products: RegionalProduct[];
}

export interface RegionalProduct {
  id: string;
  name: string; // e.g., "100 Diamonds", "200 Diamonds"
  quantity: number;
  originalPrice: number;
  salePrice: number;
  isAvailable: boolean;
}

export interface QuantityOption {
  id: string;
  name: string; // e.g., "100 Diamonds"
  quantity: number;
  price: number;
}

export interface ProductServer {
  id: string;
  name: string;
  price: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  image?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  fullName?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  balance: number;
  points: number;
  coupons: number;
}

export interface Order {
  id: string;
  reference_id: string;
  order_id?: string;
  game_id: string;
  game_name: string;
  sku_id: string;
  sku_name: string;
  quantity: number;
  price: number;
  state: 1 | 2 | 3 | 4;
  extra_info?: Record<string, unknown>;
  user_email?: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface VIPLevel {
  level: number;
  name: string;
  spendRequired: number;
  benefits: {
    pointsCoupon: boolean;
    pointsItem: boolean;
    fastDelivery: boolean;
    birthdayGift: boolean;
    pointAsMoney: boolean;
    vipService: boolean;
    higherDiscount: boolean;
    morePoints: boolean;
    exclusiveService: boolean;
    priorityDelivery: boolean;
  };
  rewards: {
    freeProducts?: number;
    bonusCoins?: number;
  };
}

// ── Payment Method IDs ──────────────────────────────────────────────────────
export type PaymentMethodId =
  | "stripe_card"
  | "apple_pay"
  | "google_pay"
  | "haiti_moncash"
  | "haiti_natcash"
  | "crypto"
  | "balance"
  | "jcb_group"
  | "paypal"
  | "paylater"
  | "cashapp";

export const ORDER_STATE_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Pending', color: 'text-yellow-600' },
  2: { label: 'Processing', color: 'text-blue-600' },
  3: { label: 'Completed', color: 'text-green-600' },
  4: { label: 'Failed', color: 'text-red-600' },
};

export interface PlayerObject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  patchVersion: string;
}

// ── Lootbar / API types ──────────────────────────────────────────────────────
export interface LootbarGame {
  game_id: string;
  game_name: string;
  game_image: string;
  category: string;
  rating: number | null;
  sold_count: string | null;
  is_hot: boolean;
  discount: number;
  min_price: number | null;
  short_description?: string;
  full_description?: string;
  requires_server?: boolean;
  requires_player_id?: boolean;
}

export interface SkuItem {
  sku_id: string | number;
  sku_name: string;
  price: number;
  original_price?: number | null;
  discount_amount?: number | null;
  image?: string | null;
  attribute?: unknown[];
  extra_info?: unknown[];
}