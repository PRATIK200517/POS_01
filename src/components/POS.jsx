import { useState } from 'react';
import Header from './Header';
import MenuGrid from './MenuGrid';
import KOTPanel from './KOTPanel';

export default function POS() {
  const [selectedItems, setSelectedItems] = useState([]);

  const handleAddToKOT = (item) => {
    setSelectedItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    setSelectedItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems((prevItems) =>
      prevItems.filter((item) => item.id !== itemId)
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex gap-4 p-4">
        <MenuGrid onAddToKOT={handleAddToKOT} />
        <KOTPanel
          selectedItems={selectedItems}
          onQuantityChange={handleQuantityChange}
          onRemoveItem={handleRemoveItem}
        />
      </div>
    </div>
  );
}