// Menu Types
export interface MenuCustomizationOption {
  id: string; // e.g., 'spice-level', 'portion-size', 'toppings'
  name: string; // e.g., 'Spice Level', 'Portion Size', 'Toppings'
  type: 'select' | 'radio' | 'checkbox'; // select/dropdown, radio buttons, checkboxes
  required: boolean;
  options: {
    id: string;
    name: string;
    price: number; // Additional price for this option, 0 if no extra charge
  }[];
}

export interface Menu {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category?: string;
  status?: 'AVAILABLE' | 'OUT_OF_STOCK';
  isAvailable?: boolean;
  customizationOptions?: MenuCustomizationOption[];
}

// Order Types
export interface OrderItem {
  menuId: number;
  quantity: number;
  price: number;
  menu?: Menu;
  id?: number;
  customizations?: Record<string, string[]>;
  extraPrice?: number;
}

export interface Order {
  id?: number;
  dailyOrderId?: number;
  tableId: number;
  customerName?: string;
  orderItems: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  isProcessed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Helper function to check if an order can be cancelled by a customer
export const canCustomerCancelOrder = (status: OrderStatus): boolean => {
  // Only PENDING orders can be cancelled by customers
  // Once an order is being processed, completed, or already cancelled, it cannot be cancelled
  return status === OrderStatus.PENDING;
};

// Note: The backend supports PENDING, COMPLETED, and CANCELLED statuses
// isProcessed flag indicates if the kitchen has started preparing the order

// Table Types
export interface Table {
  id: number;
  name: string;
  code: string;
  capacity: number;
  status: TableStatus;
}

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
}

// Cart Types
export interface CartItem extends OrderItem {
  name: string;
  imageUrl: string;
  notes?: string;
  customizations?: Record<string, string[]>;
  extraPrice?: number;
}

export interface Cart {
  tableId: number;
  items: CartItem[];
} 