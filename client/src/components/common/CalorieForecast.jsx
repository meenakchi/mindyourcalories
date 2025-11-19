import React from 'react';

const CalorieForecast = ({ pastTotals, userProfile }) => {

  if (!pastTotals || pastTotals.length === 0 || !userProfile) {
    return <p className="text-gray-500 text-sm">Prediction not available</p>;
  }

  // --- Group calories by day ---
  const days = {};

  pastTotals.forEach(meal => {
    // use meal.timestamp, not createdAt
    const ts = meal.timestamp?.toDate ? meal.timestamp.toDate() : new Date(meal.timestamp);
    const dayKey = ts.toISOString().split("T")[0]; // YYYY-MM-DD

    if (!days[dayKey]) days[dayKey] = 0;
    days[dayKey] += meal.totals?.calories || 0;
  });

  const dayCalories = Object.values(days);

  if (dayCalories.length === 0) {
    return <p className="text-gray-500 text-sm">Prediction not available</p>;
  }

  // --- Daily average ---
  const dailyAvg = Math.round(
    dayCalories.reduce((a, b) => a + b, 0) / dayCalories.length
  );

  // --- Meal calorie tendencies ---
  const mealSums = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };

  pastTotals.forEach(meal => {
    const type = meal.mealType || "other";
    if (mealSums[type] !== undefined) {
      mealSums[type] += meal.totals?.calories || 0;
    }
  });

  let maxMeal = "lunch";
  let maxCalories = 0;

  Object.keys(mealSums).forEach(type => {
    if (mealSums[type] > maxCalories) {
      maxCalories = mealSums[type];
      maxMeal = type;
    }
  });

  // --- Overeating Chance ---
  const goal = userProfile.calorieGoal || 2000; // 2000 is fallback value

  const chance = Math.min(
    98,
    Math.max(5, Math.round((dailyAvg / goal) * 100))
  );

  return (
    <div className="text-sm text-gray-700 leading-relaxed">
      <p>
        Based on your recent eating patterns, there is a{' '}
        <strong>{chance}%</strong> chance you will exceed your calorie goal today.
      </p>

      <p className="mt-1">
        You tend to eat the most calories during{' '}
        <strong>{maxMeal}</strong>.
      </p>

      <p className="mt-1 text-gray-500">
        (Daily average: {dailyAvg} kcal · Goal: {goal} kcal)
      </p>
    </div>
  );
};

export default CalorieForecast;
