import { Trash2 } from 'lucide-react';
import PortionSlider from './PortionSlider';

const FoodCard = ({ food, onRemove, onPortionChange }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{food.name}</h4>
          <p className="text-sm text-gray-500 mt-1">
            {food.serving} • {food.source || 'Database'}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Nutrition */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
        <div>
          <p className="text-lg font-bold text-primary">{food.calories}</p>
          <p className="text-xs text-gray-500">cal</p>
        </div>
        <div>
          <p className="text-lg font-bold text-blue-600">{food.protein}g</p>
          <p className="text-xs text-gray-500">protein</p>
        </div>
        <div>
          <p className="text-lg font-bold text-yellow-600">{food.carbs}g</p>
          <p className="text-xs text-gray-500">carbs</p>
        </div>
        <div>
          <p className="text-lg font-bold text-green-600">{food.fats}g</p>
          <p className="text-xs text-gray-500">fats</p>
        </div>
      </div>

      <PortionSlider
        portion={food.portion || 1}
        onChange={onPortionChange}
      />
    </div>
  );
};

export default FoodCard;