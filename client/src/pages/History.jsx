import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Trash2, Filter, Search, Download } from 'lucide-react';
import { 
  getAllUserMeals, 
  groupMealsByDate, 
  calculateDailyTotals,
  deleteMeal,
  calculateWeeklyAverage
} from '../services/firebase/firestore';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const History = () => {
  const [meals, setMeals] = useState([]);
  const [groupedMeals, setGroupedMeals] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [weeklyAvg, setWeeklyAvg] = useState(null);
  const [mealTypeFilter, setMealTypeFilter] = useState('all');

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      let allMeals = await getAllUserMeals(200);
      
      if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        allMeals = allMeals.filter(meal => new Date(meal.timestamp) >= weekAgo);
      } else if (filter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        allMeals = allMeals.filter(meal => new Date(meal.timestamp) >= monthAgo);
      }
      
      setMeals(allMeals);
      setGroupedMeals(groupMealsByDate(allMeals));

      const avg = calculateWeeklyAverage(allMeals);
      setWeeklyAvg(avg);
      
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!confirm('Delete this meal?')) return;
    
    try {
      await deleteMeal(mealId);
      toast.success('Meal deleted');
      loadHistory();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const exportToCSV = () => {
    const csv = ['Date,Meal Type,Calories,Protein,Carbs,Fats,Foods'];
    meals.forEach(meal => {
      csv.push([
        new Date(meal.timestamp).toLocaleDateString(),
        meal.mealType,
        meal.totals.calories,
        meal.totals.protein,
        meal.totals.carbs,
        meal.totals.fats,
        meal.foods.map(f => f.name).join('; ')
      ].join(','));
    });
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meal-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported to CSV!');
  };

  const filteredGroupedMeals = {};
  Object.keys(groupedMeals).forEach(date => {
    const dayMeals = groupedMeals[date].filter(meal => {
      const matchesSearch = !searchQuery || 
        meal.foods.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesMealType = mealTypeFilter === 'all' || meal.mealType === mealTypeFilter;
      return matchesSearch && matchesMealType;
    });
    
    if (dayMeals.length > 0) {
      filteredGroupedMeals[date] = dayMeals;
    }
  });

  const sortedDates = Object.keys(filteredGroupedMeals).sort((a, b) => 
    new Date(b) - new Date(a)
  );

  if (isLoading) {
    return <Loading message="Loading history..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">

      {/* HEADER */}
      <div className="bg-gradient-primary text-white mb-6">
        <div className="container-custom py-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            
            History
          </h1>
          <p className="opacity-90 mt-2">
            {meals.length} meal{meals.length !== 1 ? 's' : ''} logged
          </p>
        </div>
      </div>

      <div className="container-custom py-6 space-y-6">

        {weeklyAvg && (
          <div className="card text-black">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-purple-600" size={24} />
              <h3 className="text-lg font-bold">Weekly Average</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{weeklyAvg.calories}</p>
                <p className="text-xs text-gray-600">cal/day</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{weeklyAvg.protein}g</p>
                <p className="text-xs text-gray-600">protein/day</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{weeklyAvg.carbs}g</p>
                <p className="text-xs text-gray-600">carbs/day</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-2xl font-bold text-green-600">{weeklyAvg.fats}g</p>
                <p className="text-xs text-gray-600">fats/day</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter size={20} />
              <span className="font-semibold">Time Period:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'week', 'month'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                    filter === f
                      ? 'bg-primary text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'All Time' : `Last ${f}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold">Meal Type:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMealTypeFilter(type)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                    mealTypeFilter === type
                      ? 'bg-secondary text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Search size={20} />
              <span className="font-semibold">Search Foods:</span>
            </div>
            <input
              type="text"
              placeholder="Search for a food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button onClick={exportToCSV} variant="outline" className="w-full md:w-auto">
            <Download size={18} />
            Export to CSV
          </Button>
        </div>

        {/* No Results */}
        {sortedDates.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-6xl mb-4 block">📊</span>
            <p className="text-gray-600 text-lg mb-2">No meals found</p>
            <p className="text-gray-500 text-sm">
              {searchQuery || mealTypeFilter !== 'all'
                ? 'Try adjusting your filters'
                : filter !== 'all'
                ? `No meals logged in the last ${filter}`
                : 'Start logging to see your history!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              const dayMeals = filteredGroupedMeals[date];
              const dayTotals = calculateDailyTotals(dayMeals);

              return (
                <div key={date} className="card">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <div>
                      <h3 className="text-xl font-bold">{formatDate(date)}</h3>
                      <p className="text-sm text-gray-600">
                        {dayMeals.length} meal{dayMeals.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {dayTotals.calories} cal
                      </p>
                      <p className="text-xs text-gray-600">
                        {dayTotals.protein}g protein
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {dayMeals.map((meal) => (
                      <div
                        key={meal.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">
                                {meal.mealType === 'breakfast' && '🍳'}
                                {meal.mealType === 'lunch' && '🍔'}
                                {meal.mealType === 'dinner' && '🍽️'}
                                {meal.mealType === 'snack' && '🍎'}
                              </span>
                              <div>
                                <p className="font-semibold capitalize">{meal.mealType}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(meal.timestamp).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-center text-sm mb-2">
                              <div className="p-2 bg-white rounded">
                                <p className="font-bold text-primary">{meal.totals.calories}</p>
                                <p className="text-xs text-gray-600">cal</p>
                              </div>
                              <div className="p-2 bg-white rounded">
                                <p className="font-bold text-blue-600">{meal.totals.protein}g</p>
                                <p className="text-xs text-gray-600">protein</p>
                              </div>
                              <div className="p-2 bg-white rounded">
                                <p className="font-bold text-yellow-600">{meal.totals.carbs}g</p>
                                <p className="text-xs text-gray-600">carbs</p>
                              </div>
                              <div className="p-2 bg-white rounded">
                                <p className="font-bold text-green-600">{meal.totals.fats}g</p>
                                <p className="text-xs text-gray-600">fats</p>
                              </div>
                            </div>

                            <div className="text-sm text-gray-700">
                              <strong>Foods:</strong> {meal.foods?.map(f => f.name).join(', ')}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition ml-4"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
