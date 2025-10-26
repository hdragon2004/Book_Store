import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const QRTest = () => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      const qrContent = 'momo://transfer?amount=110000&note=Thanh toan don hang ORD-20251026-6048';
      
      const qrDataURL = await QRCode.toDataURL(qrContent, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeDataURL(qrDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">QR Code Test</h2>
      {qrCodeDataURL ? (
        <img src={qrCodeDataURL} alt="QR Code" className="w-48 h-48" />
      ) : (
        <div>Loading QR code...</div>
      )}
    </div>
  );
};

export default QRTest;
