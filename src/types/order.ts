export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// For creating new orders
export interface CreateOrderItem {
  menuId: number;
  quantity: number;
  price: number;
  customizations?: {
    optionId: string;
    selections: string[]; // Array of selected option IDs
  }[];
}

// For received orders from API
export interface OrderItem extends CreateOrderItem {
  id?: number;
  menu?: {
    name: string;
    price: number;
  };
}

// For creating new orders
export interface CreateOrder {
  tableId: number;
  customerName: string;
  orderItems: CreateOrderItem[];
  totalPrice: number;
  status: OrderStatus;
}

// For received orders from API
export interface Order {
  id: number;
  dailyOrderId: number;
  tableId: number;
  customerName?: string;
  orderItems: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderHistory {
  id: number;
  orderId: number;
  dailyOrderId: number;
  orderDate: string; // Format: YYYY-MM-DD
  tableId: number;
  tableCode: string;
  tableName: string;
  totalPrice: string;
  items: {
    menuId: number;
    menuName: string;
    quantity: number;
    price: number;
  }[];
  status: 'COMPLETED';
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyOrderCounter {
  date: string; // Format: YYYY-MM-DD
  counter: number;
} 