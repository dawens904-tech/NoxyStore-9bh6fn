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
  fullName: string;
  nickname?: string;
  nicknameLastChanged?: string;
  birthday?: string;
  emailVerified?: boolean;
  role: 'user' | 'admin' | 'owner' | 'chat-agent' | 'settings-manager';
  permissions?: UserPermissions;
  balance: number;
  pendingBalance: number;
  points: number;
  coupons: number;
  vipLevel: number;
  totalSpent: number;
  createdAt: string;
  bindings?: {
    google?: string;
    facebook?: string;
    apple?: string;
    vk?: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  variantName?: string;
  serverId?: string;
  serverName?: string;
  region?: string;
  quantity: number;
  totalAmount: number;
  playerId?: string;
  characterName?: string;
  status: 'pending' | 'processing' | 'completed' | 'refund' | 'failed';
  createdAt: string;
  updatedAt: string;
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

export interface PlayerObject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  patchVersion: string;
}