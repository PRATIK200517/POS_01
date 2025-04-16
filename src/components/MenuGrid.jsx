import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export default function MenuGrid({ onAddToKOT }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [error, setError] = useState(null);
  const [sauceOptions, setSauces] = useState([]);
  const [showSaucePopup, setShowSaucePopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categorySnap, itemsSnap] = await Promise.all([
          getDocs(collection(db, "category")),
          getDocs(collection(db, "items")),
        ]);

        setCategories(categorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const itemData = itemsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            categoryId: data.categoryId?.id || data.categoryId?.split("/").pop(),
          };
        });
        setItems(itemData);
      } catch (err) {
        setError("Failed to load menu data");
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const filteredItems = useMemo(() => 
    items.filter(item => item.categoryId === selectedCategoryId),
    [items, selectedCategoryId]
  );

  const handleItemClick = async (item) => {
    setSelectedItem(item);
    try {
      if (item.sauces) {
        const sauceSnap = await getDoc(item.sauces);
        setSauces(sauceSnap.exists() ? sauceSnap.data().sauces : []);
      }
      setShowSaucePopup(true);
    } catch (err) {
      console.error("Error loading sauces:", err);
      setSauces([]);
      setShowSaucePopup(true);
    }
  };

  const handleSelectSauce = (sauce) => {
    onAddToKOT({ ...selectedItem, selectedSauce: sauce });
    setShowSaucePopup(false);
  };

  return (
    <div className="flex-1 flex bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Categories Panel */}
      <div className="w-48 bg-purple-800 p-4 space-y-2 overflow-y-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`w-full p-3 text-left rounded-lg transition-colors
              ${selectedCategoryId === cat.id 
                ? 'bg-white text-purple-800' 
                : 'text-white hover:bg-purple-700'}`}
          >
            {cat.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        {error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : selectedCategoryId ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="p-4 rounded-lg shadow-md text-white flex flex-col items-center justify-center"
                style={{ backgroundColor: getItemColor(item.itemName) }}
              >
                <span className="font-semibold">{item.itemName.toUpperCase()}</span>
                <span className="text-xl mt-2">£{item.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-8">
            Select a category to view items
          </div>
        )}
      </div>

      {/* Sauce Selection Modal */}
      {showSaucePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-xl font-bold mb-4">
              Select Sauce for {selectedItem?.itemName}
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {sauceOptions.map((sauce, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSauce(sauce)}
                  className="px-4 py-2 bg-blue-100 rounded-full hover:bg-blue-200"
                >
                  {sauce}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectSauce(null)}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                No Sauce
              </button>
              <button
                onClick={() => setShowSaucePopup(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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

function getItemColor(itemName) {
  const lowerName = itemName.toLowerCase();
  if (lowerName.includes('chicken')) return '#dc2626';
  if (lowerName.includes('paneer')) return '#2563eb';
  return '#059669';
}