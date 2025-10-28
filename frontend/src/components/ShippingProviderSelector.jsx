import React, { useState, useEffect } from 'react';
import axiosClient from '../services/axiosClient';

const ShippingProviderSelector = ({ selectedProvider, onProviderSelect }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch active shipping providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching shipping providers...');
        const response = await axiosClient.get('/shipping-providers/active');
        console.log('📦 Shipping providers response:', response.data);
        setProviders(response.data.data.providers || []);
      } catch (err) {
        console.error('❌ Error fetching shipping providers:', err);
        setError('Không thể tải danh sách đơn vị vận chuyển');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.shipping-provider-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleProviderSelect = (provider) => {
    onProviderSelect(provider);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Chọn đơn vị vận chuyển</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          <span className="ml-3 text-gray-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Chọn đơn vị vận chuyển</h3>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Chọn đơn vị vận chuyển</h3>
      
      <div className="relative shipping-provider-dropdown">
        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-xl bg-white hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center space-x-3">
            {selectedProvider ? (
              <>
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 text-sm">🚚</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{selectedProvider.name}</div>
                  <div className="text-sm text-gray-500">
                    {selectedProvider.baseFee.toLocaleString('vi-VN')} ₫ • {selectedProvider.estimatedTime}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-sm">🚚</span>
                </div>
                <span className="text-gray-500">Chọn đơn vị vận chuyển</span>
              </>
            )}
          </div>
          
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
            {providers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Không có đơn vị vận chuyển nào
              </div>
            ) : (
              <div className="py-2">
                {providers.map((provider) => (
                  <button
                    key={provider._id}
                    type="button"
                    onClick={() => handleProviderSelect(provider)}
                    className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors ${
                      selectedProvider?._id === provider._id ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 text-sm">🚚</span>
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{provider.name}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {provider.code}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span>💰</span>
                          <span className="font-medium text-amber-600">
                            {provider.baseFee.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <span>⏰</span>
                          <span>{provider.estimatedTime}</span>
                        </div>
                      </div>
                      
                      {provider.description && (
                        <div className="mt-1 text-xs text-gray-500">
                          {provider.description}
                        </div>
                      )}
                    </div>
                    
                    {selectedProvider?._id === provider._id && (
                      <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {selectedProvider && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-amber-600">✅</span>
            <span className="font-medium text-amber-800">
              Đã chọn: {selectedProvider.name}
            </span>
          </div>
          <div className="mt-2 text-sm text-amber-700">
            Phí vận chuyển: {selectedProvider.baseFee.toLocaleString('vi-VN')} ₫ • 
            Thời gian giao: {selectedProvider.estimatedTime}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingProviderSelector;
