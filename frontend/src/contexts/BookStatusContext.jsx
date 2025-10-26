import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { favoriteAPI, cartAPI } from '../services/apiService';

const BookStatusContext = createContext();

export const useBookStatus = () => {
  const context = useContext(BookStatusContext);
  if (!context) {
    throw new Error('useBookStatus must be used within a BookStatusProvider');
  }
  return context;
};

export const BookStatusProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load user's favorites và cart khi login
  useEffect(() => {
    if (user && !initialized) {
      loadUserData();
    } else if (!user) {
      // Clear data khi logout
      setFavorites(new Set());
      setCartItems(new Map());
      setInitialized(false);
    }
  }, [user, initialized]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load favorites
      const favoritesResponse = await favoriteAPI.getFavorites();
      const favoritesData = favoritesResponse.data.data?.favorites || [];
      const favoritesSet = new Set(favoritesData.map(fav => fav.bookId._id));
      setFavorites(favoritesSet);

      // Load cart
      const cartResponse = await cartAPI.getCart();
      const cartData = cartResponse.data.data?.cart?.items || [];
      const cartMap = new Map();
      cartData.forEach(item => {
        cartMap.set(item.bookId._id, {
          quantity: item.quantity,
          inCart: true
        });
      });
      setCartItems(cartMap);

      setInitialized(true);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if book is favorite
  const isFavorite = (bookId) => {
    return favorites.has(bookId);
  };

  // Check if book is in cart
  const isInCart = (bookId) => {
    return cartItems.has(bookId);
  };

  // Get cart quantity
  const getCartQuantity = (bookId) => {
    const item = cartItems.get(bookId);
    return item ? item.quantity : 0;
  };

  // Update favorite status
  const updateFavorite = (bookId, isFavorite) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (isFavorite) {
        newSet.add(bookId);
      } else {
        newSet.delete(bookId);
      }
      return newSet;
    });
  };

  // Update cart status
  const updateCartItem = (bookId, quantity, inCart) => {
    setCartItems(prev => {
      const newMap = new Map(prev);
      if (inCart && quantity > 0) {
        newMap.set(bookId, { quantity, inCart: true });
      } else {
        newMap.delete(bookId);
      }
      return newMap;
    });
  };

  // Refresh data (sau khi user thực hiện action)
  const refreshData = async () => {
    if (user) {
      setLoading(true);
      try {
        // Load favorites
        const favoritesResponse = await favoriteAPI.getFavorites();
        const favoritesData = favoritesResponse.data.data?.favorites || [];
        const favoritesSet = new Set(favoritesData.map(fav => fav.bookId._id));
        setFavorites(favoritesSet);

        // Load cart
        const cartResponse = await cartAPI.getCart();
        const cartData = cartResponse.data.data?.cart?.items || [];
        const cartMap = new Map();
        cartData.forEach(item => {
          cartMap.set(item.bookId._id, {
            quantity: item.quantity,
            inCart: true
          });
        });
        setCartItems(cartMap);
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const value = {
    isFavorite,
    isInCart,
    getCartQuantity,
    updateFavorite,
    updateCartItem,
    refreshData,
    loading,
    initialized
  };

  return (
    <BookStatusContext.Provider value={value}>
      {children}
    </BookStatusContext.Provider>
  );
};
