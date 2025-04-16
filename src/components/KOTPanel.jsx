import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore';

export default function KOTPanel({ selectedItems, onQuantityChange, onRemoveItem }) {
  const [kotId, setKotId] = useState('');
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [quantityInput, setQuantityInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaymentProcessed, setIsPaymentProcessed] = useState(false);

  // Totals calculation
  const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  const handleQuantityUpdate = (index, newQuantity) => {
    onQuantityChange(selectedItems[index].id, Math.max(newQuantity, 1));
  };

  const generateKOTId = async () => {
    const date = new Date();
    const prefix = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear().toString().slice(-2)}`;
    
    const kotQuery = query(collection(db, 'KOT'), orderBy('kot_id', 'desc'), limit(1));
    const snapshot = await getDocs(kotQuery);
    
    let sequence = 1;
    if (!snapshot.empty) {
      const lastId = snapshot.docs[0].data().kot_id;
      sequence = parseInt(lastId.slice(6)) + 1;
    }
    
    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  };

  const handleSaveKOT = async () => {
    if (!isPaymentProcessed) return alert('Complete payment first');
    
    const newKotId = await generateKOTId();
    const kotData = {
      kot_id: newKotId,
      items: selectedItems.map(item => ({
        id: item.id,
        name: item.itemName,
        quantity: item.quantity,
        price: item.price,
        sauce: item.selectedSauce || null
      })),
      total,
      timestamp: Timestamp.now(),
    };

    await setDoc(doc(db, 'KOT', newKotId), kotData);
    setKotId(newKotId);
    printKOT(newKotId);
  };

  const printKOT = (kotNumber) => {
    const printContent = `
      <div style="font-family: Arial; padding: 20px; max-width: 300px;">
        <h2 style="text-align: center; margin-bottom: 15px;">KOT #${kotNumber}</h2>
        <div style="margin-bottom: 15px;">
          ${selectedItems.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>${item.quantity}x ${item.itemName}</span>
              <span>£${(item.quantity * item.price).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <hr style="margin: 15px 0;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>Total:</span>
          <span>£${total.toFixed(2)}</span>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex-1 bg-white rounded-lg shadow-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Current Order</h2>
      
      {/* Order Items */}
      <div className="mb-6 space-y-4">
        {selectedItems.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold">{item.itemName}</h3>
              {item.selectedSauce && (
                <p className="text-sm text-gray-600">Sauce: {item.selectedSauce}</p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuantityUpdate(index, item.quantity - 1)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityUpdate(index, item.quantity + 1)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>
              <span className="w-20 text-right">£{(item.price * item.quantity).toFixed(2)}</span>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between font-semibold">
          <span>Subtotal:</span>
          <span>£{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-2xl font-bold">
          <span>Total:</span>
          <span>£{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowPaymentModal(true)}
          className="py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Process Payment
        </button>
        <button
          onClick={handleSaveKOT}
          disabled={!isPaymentProcessed || selectedItems.length === 0}
          className={`py-3 rounded-lg ${isPaymentProcessed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'} text-white`}
        >
          {kotId ? `Print KOT (${kotId})` : 'Save KOT'}
        </button>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Select Payment Method</h3>
            <div className="space-y-3 mb-6">
              {['Cash', 'Card', 'Mobile'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`w-full p-3 rounded-lg ${paymentMethod === method ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >
                  {method}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (paymentMethod) {
                    setIsPaymentProcessed(true);
                    setShowPaymentModal(false);
                  }
                }}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="py-2 px-4 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}