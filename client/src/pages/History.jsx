import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Trash2, Filter } from 'lucide-react';
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
  const [filter, setFilter] = useState('all'); // all, week, month
  const [weeklyAvg, setWeeklyAvg] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      let allMeals = await getAllUserMeals(200);

      // Apply filter
      if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        allMeals = allMeals.filter(
          meal => new Date(meal.timestamp) >= weekAgo
        );
      } else if (filter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        allMeals = allMeals.filter(
          meal => new Date(meal.timestamp) >= monthAgo
        );
      }

      setMeals(allMeals);
      setGroupedMeals(groupMealsByDate(allMeals));

      // Weekly average
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
    if (!confirm('Are you sure you want to delete this meal?')) return;

    try {
      await deleteMeal(mealId);
      toast.success('Meal deleted');
      loadHistory();
    } catch (error) {
      toast.error('Failed to delete meal');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <Loading message="Loading your history..." />;
  }

  const sortedDates = Object.keys(groupedMeals).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      
      {/* HEADER */}
      <div className="bg-white shadow-sm">
        <div className="container-custom py-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={28} />
            History
          </h1>
          <p className="text-gray-600 mt-1">
            {meals.length} meal{meals.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="container-custom py-6 space-y-6">

        {/* WEEKLY AVERAGE */}
        {weeklyAvg && (
          <div className="card bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-purple-600" size={24} />
              <h3 className="text-lg font-bold">Weekly Average</h3>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {weeklyAvg.calories}
                </p>
                <p className="text-xs text-gray-600">cal/day</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {weeklyAvg.protein}g
                </p>
                <p className="text-xs text-gray-600">protein/day</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {weeklyAvg.carbs}g
                </p>
                <p className="text-xs text-gray-600">carbs/day</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {weeklyAvg.fats}g
                </p>
                <p className="text-xs text-gray-600">fats/day</p>
              </div>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={20} />
            <span className="font-semibold">Filter:</span>
          </div>

          <div className="flex gap-2">
            {['all', 'week', 'month'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All Time' : `Last ${f}`}
              </button>
            ))}
          </div>
        </div>

        {/* NO MEALS */}
        {meals.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-6xl mb-4 block">📊</span>
            <p className="text-gray-600 text-lg mb-2">No meals found</p>
            <p className="text-gray-500 text-sm">
              {filter !== 'all'
                ? 'No meals in this period.'
                : 'Start logging meals to see your history.'}
            </p>
          </div>
        ) : (
          // RENDER MEALS GROUPED BY DATE
          sortedDates.map((dateKey) => {
            const dayMeals = groupedMeals[dateKey];
            const dayTotals = calculateDailyTotals(dayMeals);

            return (
              <div key={dateKey} className="card">

                {/* DATE HEADER */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <div>
                    <h3 className="text-xl font-bold">{formatDate(dateKey)}</h3>
                    <p className="text-sm text-gray-600">
                      {dayMeals.length} meal{dayMeals.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {dayTotals.calories}
                    </p>
                    <p className="text-xs text-gray-600">total calories</p>
                  </div>
                </div>

                {/* DAILY TOTALS */}
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">
                      {dayTotals.protein}g
                    </p>
                    <p className="text-xs text-gray-600">Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-yellow-600">
                      {dayTotals.carbs}g
                    </p>
                    <p className="text-xs text-gray-600">Carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {dayTotals.fats}g
                    </p>
                    <p className="text-xs text-gray-600">Fats</p>
                  </div>
                </div>

                {/* MEAL CARDS */}
                <div className="space-y-3">
                  {dayMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {meal.mealType === 'breakfast' && '🍳'}
                            {meal.mealType === 'lunch' && '🍔'}
                            {meal.mealType === 'dinner' && '🍽️'}
                            {meal.mealType === 'snack' && '🍎'}
                          </span>

                          <div>
                            <span className="font-semibold capitalize">
                              {meal.mealType}
                            </span>

                            <p className="text-xs text-gray-500">
                              {new Date(meal.timestamp).toLocaleTimeString(
                                'en-US',
                                { hour: 'numeric', minute: '2-digit' }
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-xs mb-2">
                        <div>
                          <p className="font-bold text-primary">
                            {meal.totals.calories}
                          </p>
                          <p className="text-gray-600">cal</p>
                        </div>
                        <div>
                          <p className="font-bold text-blue-600">
                            {meal.totals.protein}g
                          </p>
                          <p className="text-gray-600">pro</p>
                        </div>
                        <div>
                          <p className="font-bold text-yellow-600">
                            {meal.totals.carbs}g
                          </p>
                          <p className="text-gray-600">carbs</p>
                        </div>
                        <div>
                          <p className="font-bold text-green-600">
                            {meal.totals.fats}g
                          </p>
                          <p className="text-gray-600">fats</p>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600">
                        {meal.foods?.map(f => f.name).join(', ')}
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default History;
