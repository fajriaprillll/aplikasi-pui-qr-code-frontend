import { create } from 'zustand';
import type { Cart, Menu } from '../types';

// Enhanced CartItem interface with customizations
interface CartItem {
  menuId: number;
  quantity: number;
  price: number;
  menu?: Menu;
  customizations?: Record<string, string[]>;
  extraPrice?: number;
}

interface CartStore {
  cart: Cart;
  addToCart: (menu: Menu, quantity: number, customizations?: Record<string, string[]>, extraPrice?: number) => void;
  removeFromCart: (menuId: number) => void;
  updateQuantity: (menuId: number, quantity: number) => void;
  clearCart: () => void;
  setTableId: (tableId: number) => void;
  getTotal: () => number;
}

const initialCart: Cart = {
  tableId: 0,
  items: [],
};

// Persist cart to local storage
const saveCartToLocalStorage = (cart: Cart) => {
  localStorage.setItem('cart', JSON.stringify(cart));
};

// Load cart from local storage
const loadCartFromLocalStorage = (): Cart => {
  const storedCart = localStorage.getItem('cart');
  if (storedCart) {
    return JSON.parse(storedCart);
  }
  return initialCart;
};

export const useCartStore = create<CartStore>((set, get) => ({
  cart: loadCartFromLocalStorage(),

  addToCart: (menu: Menu, quantity: number, customizations?: Record<string, string[]>, extraPrice: number = 0) => {
    const { cart } = get();
    
    // When we have customizations, we'll treat it as a new item even if the menu is the same
    // This allows users to have multiple versions of the same menu item with different customizations
    const existingItemIndex = customizations 
      ? -1 // Always add as new item if we have customizations
      : cart.items.findIndex(item => item.menuId === menu.id && !item.customizations);

    if (existingItemIndex >= 0) {
      // Update existing item (only for non-customized items)
      const updatedItems = [...cart.items];
      updatedItems[existingItemIndex].quantity += quantity;
      const updatedCart = { ...cart, items: updatedItems };
      saveCartToLocalStorage(updatedCart);
      set({ cart: updatedCart });
      
      // Dispatch custom event for cart animation
      const event = new CustomEvent('cartUpdated', { detail: { action: 'update', menuId: menu.id, quantity } });
      window.dispatchEvent(event);
    } else {
      // Add new item
      console.log(`Adding to cart: ${menu.name}, original price: ${menu.price}, extraPrice: ${extraPrice || 0}`);
      
      // Convert prices to numbers to ensure proper addition
      const numericPrice = Number(menu.price);
      const numericExtraPrice = Number(extraPrice || 0);
      const finalPrice = numericPrice + numericExtraPrice;
      
      console.log(`Price calculation: ${numericPrice} + ${numericExtraPrice} = ${finalPrice}`);
      
      const newItem: CartItem = {
        menuId: menu.id,
        quantity,
        price: finalPrice,
        menu,
        customizations,
        extraPrice: numericExtraPrice,
      };
      
      console.log(`Item added to cart with final price: ${newItem.price}`);
      const updatedCart = { ...cart, items: [...cart.items, newItem] };
      saveCartToLocalStorage(updatedCart);
      set({ cart: updatedCart });
      
      // Dispatch custom event for cart animation
      const event = new CustomEvent('cartUpdated', { detail: { action: 'add', menuId: menu.id, quantity } });
      window.dispatchEvent(event);
    }
  },

  removeFromCart: (menuId: number) => {
    const { cart } = get();
    const updatedCart = { 
      ...cart, 
      items: cart.items.filter(item => item.menuId !== menuId) 
    };
    saveCartToLocalStorage(updatedCart);
    set({ cart: updatedCart });
    
    // Dispatch custom event for cart animation
    const event = new CustomEvent('cartUpdated', { detail: { action: 'remove', menuId } });
    window.dispatchEvent(event);
  },

  updateQuantity: (menuId: number, quantity: number) => {
    const { cart } = get();
    if (quantity <= 0) {
      get().removeFromCart(menuId);
      return;
    }

    const updatedItems = cart.items.map(item =>
      item.menuId === menuId ? { ...item, quantity } : item
    );
    const updatedCart = { ...cart, items: updatedItems };
    saveCartToLocalStorage(updatedCart);
    set({ cart: updatedCart });
  },

  clearCart: () => {
    const { cart } = get();
    const updatedCart = { ...cart, items: [] };
    saveCartToLocalStorage(updatedCart);
    set({ cart: updatedCart });
  },

  setTableId: (tableId: number) => {
    const { cart } = get();
    const updatedCart = { ...cart, tableId };
    saveCartToLocalStorage(updatedCart);
    set({ cart: updatedCart });
  },

  getTotal: () => {
    const { cart } = get();
    // Log the cart items and their prices for debugging
    console.log('Cart items:', cart.items.map(item => ({ 
      name: item.menu?.name, 
      price: item.price, 
      qty: item.quantity, 
      total: Number(item.price) * Number(item.quantity) 
    })));
    return cart.items.reduce((total, item) => total + (Number(item.price) * Number(item.quantity)), 0);
  },
})); 