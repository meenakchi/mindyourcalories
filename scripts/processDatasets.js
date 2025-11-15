import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import stripBom from 'strip-bom-stream';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanNumber(value) {
  if (!value) return 0;
  // Remove units like 'cal' or 'kJ', and trim whitespace
  const cleaned = value.toString().replace(/\s*(cal|kJ)/gi, '').trim();
  return parseFloat(cleaned) || 0;
}

function processFoodCalories() {
  console.log('📊 Processing Food Calories dataset...');
  
  const csvPath = path.join(__dirname, 'data', 'calories.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ calories.csv not found.');
    return;
  }

  const results = [];

  fs.createReadStream(csvPath)
    .pipe(stripBom())
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
    .on('data', (item) => {
      // Fixed: Use correct column names with underscores
      results.push({
        id: `food_${results.length}`,
        name: (item.FoodItem || '').trim(),
        category: (item.FoodCategory || '').trim(),
        serving: (item.per100grams || '100g').trim(),
        calories: Math.round(cleanNumber(item['Cals_per100grams'])), // Fixed!
        energyKJ: Math.round(cleanNumber(item['KJ_per100grams'])),   // Fixed!
        source: 'local_database',
      });
    })
    .on('end', () => {
      const outputPath = path.join(__dirname, '../client/src/data/foodDatabase.json');
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      
      console.log(`✅ Processed ${results.length} food items`);
      console.log(`📁 Saved to: ${outputPath}`);
      
      // Debug: Show first few items
      console.log('\n🔍 Sample data:');
      console.log(JSON.stringify(results.slice(0, 3), null, 2));
    })
    .on('error', (error) => {
      console.error('❌ Error processing food calories:', error.message);
    });
}

function processDailyNutrition() {
  console.log('📊 Processing Daily Nutrition dataset...');
  
  const csvPath = path.join(__dirname, 'data', 'daily_food_nutrition_dataset.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️ daily_food_nutrition_dataset.csv not found.');
    return;
  }

  const patterns = {
    mealTypes: {},
    avgCaloriesByMeal: {},
  };

  fs.createReadStream(csvPath)
    .pipe(stripBom())
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
    .on('data', (item) => {
      // Fixed: Use correct column name 'Meal_Type'
      const mealType = (item.Meal_Type || item['Meal_Type'] || 'unknown').trim().toLowerCase();
      const calories = parseFloat(item['Calories (kcal)'] || 0); // Fixed: Added parentheses
      
      patterns.mealTypes[mealType] = (patterns.mealTypes[mealType] || 0) + 1;

      if (!patterns.avgCaloriesByMeal[mealType]) {
        patterns.avgCaloriesByMeal[mealType] = { total: 0, count: 0 };
      }
      patterns.avgCaloriesByMeal[mealType].total += calories;
      patterns.avgCaloriesByMeal[mealType].count += 1;
    })
    .on('end', () => {
      Object.keys(patterns.avgCaloriesByMeal).forEach(meal => {
        const data = patterns.avgCaloriesByMeal[meal];
        patterns.avgCaloriesByMeal[meal] = Math.round(data.total / data.count);
      });

      const outputPath = path.join(__dirname, '../client/src/data/nutritionPatterns.json');
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(patterns, null, 2));
      
      console.log(`✅ Processed nutrition records`);
      console.log(`📁 Saved to: ${outputPath}`);
      console.log('\n🔍 Meal patterns:');
      console.log(JSON.stringify(patterns, null, 2));
    })
    .on('error', (error) => {
      console.error('❌ Error processing daily nutrition:', error.message);
    });
}
// Generate badges
function generateBadges() {
  console.log('🏆 Generating achievement badges...');
  
  const badges = [
    {
      id: 'first-log',
      name: 'Getting Started',
      description: 'Log your first meal',
      icon: '🎯',
      requirement: { type: 'meals_logged', value: 1 },
      rarity: 'common'
    },
    {
      id: 'week-streak',
      name: 'Week Warrior',
      description: 'Log meals for 7 days straight',
      icon: '🔥',
      requirement: { type: 'streak_days', value: 7 },
      rarity: 'uncommon'
    },
    {
      id: 'month-streak',
      name: 'Consistency Champion',
      description: 'Log meals for 30 days straight',
      icon: '👑',
      requirement: { type: 'streak_days', value: 30 },
      rarity: 'rare'
    },
    {
      id: 'photo-pro',
      name: 'Photo Pro',
      description: 'Log 50 meals with photos',
      icon: '📸',
      requirement: { type: 'photo_logs', value: 50 },
      rarity: 'uncommon'
    },
    {
      id: 'goal-keeper',
      name: 'Goal Keeper',
      description: 'Stay within calorie goal for 10 days',
      icon: '🎯',
      requirement: { type: 'goal_days', value: 10 },
      rarity: 'rare'
    },
    {
      id: 'protein-lover',
      name: 'Protein Lover',
      description: 'Consume 100g+ protein in a day',
      icon: '💪',
      requirement: { type: 'protein_day', value: 100 },
      rarity: 'uncommon'
    },
    {
      id: 'early-bird',
      name: 'Early Bird',
      description: 'Log breakfast before 8am for 5 days',
      icon: '🌅',
      requirement: { type: 'early_breakfast', value: 5 },
      rarity: 'common'
    },
    {
      id: 'health-guru',
      name: 'Health Guru',
      description: 'Log 100 total meals',
      icon: '⭐',
      requirement: { type: 'meals_logged', value: 100 },
      rarity: 'legendary'
    }
  ];
  
  const outputPath = path.join(__dirname, '../client/src/data/badges.json');
  fs.writeFileSync(outputPath, JSON.stringify(badges, null, 2));
  
  console.log('✅ Generated badges');
}

function generateMealSuggestions() {
  console.log('🍽️  Generating meal suggestions...');
  
  const suggestions = {
    breakfast: [
      { name: 'Protein Oatmeal', foods: ['oatmeal', 'greek_yogurt', 'berries'], calories: 320, protein: 18, carbs: 45, fats: 5 },
      { name: 'Egg Breakfast', foods: ['eggs', 'bread', 'banana'], calories: 450, protein: 18, carbs: 55, fats: 14 },
      { name: 'Yogurt Parfait', foods: ['greek_yogurt', 'berries', 'almonds'], calories: 280, protein: 15, carbs: 25, fats: 12 },
    ],
    lunch: [
      { name: 'Chicken & Rice', foods: ['chicken_breast', 'brown_rice', 'broccoli'], calories: 420, protein: 42, carbs: 35, fats: 6 },
      { name: 'Salmon Bowl', foods: ['salmon', 'white_rice', 'spinach'], calories: 480, protein: 32, carbs: 45, fats: 15 },
      { name: 'Protein Salad', foods: ['chicken_breast', 'salad', 'tomatoes'], calories: 250, protein: 35, carbs: 10, fats: 5 },
    ],
    dinner: [
      { name: 'Grilled Chicken Dinner', foods: ['chicken_breast', 'pasta', 'vegetables'], calories: 520, protein: 45, carbs: 48, fats: 10 },
      { name: 'Salmon Dinner', foods: ['salmon', 'brown_rice', 'broccoli'], calories: 550, protein: 35, carbs: 45, fats: 18 },
      { name: 'Tofu Stir Fry', foods: ['tofu', 'white_rice', 'mixed_vegetables'], calories: 380, protein: 18, carbs: 52, fats: 8 },
    ],
    snacks: [
      { name: 'Protein Snack', foods: ['protein_bar'], calories: 200, protein: 20, carbs: 18, fats: 7 },
      { name: 'Fruit & Nuts', foods: ['apple', 'almonds'], calories: 230, protein: 6, carbs: 22, fats: 14 },
      { name: 'Yogurt Snack', foods: ['greek_yogurt', 'berries'], calories: 120, protein: 11, carbs: 18, fats: 0 },
    ]
  };
  
  const outputPath = path.join(__dirname, '../client/src/data/mealSuggestions.json');
  fs.writeFileSync(outputPath, JSON.stringify(suggestions, null, 2));
  
  console.log('✅ Generated meal suggestions');
}

console.log('🚀 Starting dataset processing...\n');

const dataDir = path.join(__dirname, 'data');
const clientDataDir = path.join(__dirname, '../client/src/data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created scripts/data/ folder\n');
}

if (!fs.existsSync(clientDataDir)) {
  fs.mkdirSync(clientDataDir, { recursive: true });
}

processFoodCalories();
processDailyNutrition();
generateBadges();
generateMealSuggestions();