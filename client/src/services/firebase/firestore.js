import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';
import { getAuth } from 'firebase/auth';

// Save meal to Firestore
export const saveMealToFirestore = async (mealData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const mealRef = collection(db, 'meals');
    
    const docData = {
      userId: user.uid,
      foods: mealData.foods,
      mealType: mealData.mealType,
      totals: mealData.totals,
      timestamp: Timestamp.fromDate(mealData.timestamp),
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(mealRef, docData);
    console.log('✅ Meal saved with ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error saving meal:', error);
    throw error;
  }
};

// Get today's meals
export const getTodaysMeals = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mealsRef = collection(db, 'meals');
    const q = query(
      mealsRef,
      where('userId', '==', user.uid),
      where('timestamp', '>=', Timestamp.fromDate(today)),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const meals = [];

    snapshot.forEach(doc => {
      meals.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });

    console.log('✅ Fetched', meals.length, 'meals for today');
    return meals;
    
  } catch (error) {
    console.error('❌ Error fetching meals:', error);
    return [];
  }
};

// Calculate daily totals
export const calculateDailyTotals = (meals) => {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.totals?.calories || 0),
      protein: acc.protein + (meal.totals?.protein || 0),
      carbs: acc.carbs + (meal.totals?.carbs || 0),
      fats: acc.fats + (meal.totals?.fats || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
};

// Delete meal
export const deleteMeal = async (mealId) => {
  try {
    const mealRef = doc(db, 'meals', mealId);
    await deleteDoc(mealRef);
    console.log('✅ Meal deleted');
  } catch (error) {
    console.error('❌ Error deleting meal:', error);
    throw error;
  }
};