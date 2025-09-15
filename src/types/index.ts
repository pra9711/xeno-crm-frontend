// User and Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  googleId?: string | null;
  avatar?: string;
  createdAt: string;
}

// Customer types
export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  totalSpending: number;
  visitCount: number;
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
  communicationLogs?: CommunicationLog[];
  _count?: {
    orders: number;
    communicationLogs: number;
  };
}

// Order types
export interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    totalSpending: number;
    audienceId?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Campaign types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  rules: SegmentationRules;
  audienceSize: number;
  status: CampaignStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
  communicationLogs?: CommunicationLog[];
  deliveryStats?: DeliveryStats;
  _count?: {
    communicationLogs: number;
  };
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Segmentation types
export interface SegmentationRules {
  logic: 'AND' | 'OR';
  conditions: SegmentationCondition[];
  connectors?: ('AND' | 'OR')[];
}

export interface SegmentationCondition {
  field: 'totalSpending' | 'visitCount' | 'emailCount' | 'lastVisit' | 'email';
  operator: '>' | '<' | '>=' | '<=' | '=' | 'contains' | 'before' | 'after';
  value: string | number;
}

// Communication Log types
export interface CommunicationLog {
  id: string;
  campaignId: string;
  customerId: string;
  message: string;
  status: MessageStatus;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED'
}

// Analytics types
export interface DeliveryStats {
  sent: number;
  delivered: number;
  failed: number;
  total: number;
}

export interface DashboardAnalytics {
  summary: {
    totalCustomers: number;
    newCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    activeCampaigns: number;
    avgOrderValue: number;
  };
  campaignStats: {
    totalCampaigns: number;
    totalMessages: number;
    deliveredMessages: number;
    deliveryRate: number;
  };
  topCustomers: Customer[];
  recentActivity: {
    orders: Order[];
    campaigns: Campaign[];
  };
  timeframe: string;
}

// AI types
export interface MessageSuggestion {
  id: number;
  message: string;
  tone: string;
  estimatedEngagement: number;
  recommendation: string;
}

export interface SchedulingSuggestion {
  bestTime: {
    hour: number;
    minute: number;
  };
  bestDay: string;
  timezone: string;
  reasoning: string;
  alternatives: Array<{
    day: string;
    time: string;
    expectedEngagement: string;
  }>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface CustomerFormData {
  email: string;
  name: string;
  phone?: string;
  totalSpending?: number;
  visitCount?: number;
}

export interface OrderFormData {
  amount: number;
  status: OrderStatus;
  customerId: string;
}

export interface CampaignFormData {
  name: string;
  description?: string;
  rules: SegmentationRules;
}

// Component prop types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

// Utility types
export interface SelectOption {
  label: string;
  value: string | number;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<Record<string, unknown>>;
  content?: React.ReactNode;
}
