import express from 'express';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Clarifai configuration
const CLARIFAI_CONFIG = {
  user_id: 'clarifai',
  app_id: 'main',
  model_id: 'food-item-recognition',
  api_key: process.env.CLARIFAI_API_KEY
};

// -------------------------------------------
// TEST CLARIFAI
// -------------------------------------------
router.get('/test-clarifai', async (req, res) => {
  try {
    console.log('🔑 Testing Clarifai API...');
    
    const response = await axios.post(
      `https://api.clarifai.com/v2/users/${CLARIFAI_CONFIG.user_id}/apps/${CLARIFAI_CONFIG.app_id}/models/${CLARIFAI_CONFIG.model_id}/outputs`,
      {
        user_app_id: {
          user_id: CLARIFAI_CONFIG.user_id,
          app_id: CLARIFAI_CONFIG.app_id
        },
        inputs: [
          {
            data: {
              image: {
                url: 'https://samples.clarifai.com/food.jpg'
              }
            }
          }
        ]
      },
      {
        headers: {
          'Authorization': `Key ${CLARIFAI_CONFIG.api_key}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const concepts = response.data.outputs[0].data.concepts.slice(0, 3);

    res.json({
      success: true,
      message: 'Clarifai API is working! ✅',
      sample: concepts.map(c => ({
        name: c.name,
        confidence: (c.value * 100).toFixed(1) + '%'
      }))
    });

  } catch (error) {
    console.error('❌ Clarifai error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Clarifai API test failed ❌',
      error: error.response?.data || error.message
    });
  }
});

// -------------------------------------------
// TEST USDA API
// -------------------------------------------
router.get('/test-usda', async (req, res) => {
  try {
    console.log('🔑 Testing USDA API...');
    
    const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
      params: {
        query: 'apple',
        api_key: process.env.USDA_API_KEY,
        pageSize: 1
      }
    });

    res.json({
      success: true,
      message: 'USDA API is working! ✅',
      sample: response.data.foods[0]?.description
    });

  } catch (error) {
    console.error('❌ USDA error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'USDA API test failed ❌',
      error: error.response?.data || error.message
    });
  }
});

// -------------------------------------------
// ANALYZE MEAL 
// -------------------------------------------
router.post('/analyze-meal', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    console.log('📸 Analyzing meal image...');

    const base64Image = fs.readFileSync(req.file.path).toString('base64');

    console.log('🔍 Calling Clarifai API...');
    const clarifaiResponse = await axios.post(
      `https://api.clarifai.com/v2/users/${CLARIFAI_CONFIG.user_id}/apps/${CLARIFAI_CONFIG.app_id}/models/${CLARIFAI_CONFIG.model_id}/outputs`,
      {
        user_app_id: {
          user_id: CLARIFAI_CONFIG.user_id,
          app_id: CLARIFAI_CONFIG.app_id
        },
        inputs: [{ data: { image: { base64: base64Image }}}]
      },
      {
        headers: {
          'Authorization': `Key ${CLARIFAI_CONFIG.api_key}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const concepts = clarifaiResponse.data.outputs[0].data.concepts.slice(0, 5);

    console.log('🔍 Fetching nutrition data...');
    const foodsWithNutrition = await Promise.all(
      concepts.map(async (concept) => {
        try {
          const nutritionResponse = await axios.get(
            'https://api.nal.usda.gov/fdc/v1/foods/search',
            {
              params: {
                query: concept.name,
                api_key: process.env.USDA_API_KEY,
                pageSize: 1,
                dataType: 'Foundation,SR Legacy' // FIXED
              }
            }
          );

          const foods = nutritionResponse.data.foods;
          if (!foods || foods.length === 0) {
            throw new Error("No USDA match");
          }

          const nutrients = foods[0].foodNutrients;

          const getNutrient = (name) => {
            const n = nutrients.find(n => n.nutrientName.includes(name));
            return n ? Math.round(n.value) : 0;
          };

          return {
            name: concept.name,
            confidence: (concept.value * 100).toFixed(1),
            calories: getNutrient("Energy"),
            protein: getNutrient("Protein"),
            carbs: getNutrient("Carbohydrate"),
            fats: getNutrient("Total lipid"),
            serving: "100g",
            source: "USDA"
          };

        } catch (err) {
          return {
            name: concept.name,
            confidence: (concept.value * 100).toFixed(1),
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            serving: "100g",
            needsManualEntry: true
          };
        }
      })
    );

    fs.unlink(req.file.path, () => {});

    res.json({
      success: true,
      message: 'Meal analyzed successfully',
      foods: foodsWithNutrition,
      totalRecognized: concepts.length
    });

  } catch (error) {
    console.error('❌ Meal analysis error:', error.message);

    if (req.file) fs.unlink(req.file.path, () => {});

    res.status(500).json({
      success: false,
      message: 'Failed to analyze meal',
      error: error.message
    });
  }
});

// -------------------------------------------
// FIXED USDA SEARCH ROUTE
// -------------------------------------------
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
    }

    console.log('🔍 Searching USDA for:', q);

    const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
      params: {
        query: q,
        api_key: process.env.USDA_API_KEY,
        pageSize: Number(limit),                 // FIXED
        dataType: 'Foundation,SR Legacy,Branded' // FIXED
      }
    });

    const results = response.data.foods.map(food => {
      const nutrients = food.foodNutrients;

      const getNutrient = (name) => {
        const n = nutrients.find(n => n.nutrientName.includes(name));
        return n ? Math.round(n.value) : 0;
      };

      return {
        id: food.fdcId,
        name: food.description,
        calories: getNutrient("Energy"),
        protein: getNutrient("Protein"),
        carbs: getNutrient("Carbohydrate"),
        fats: getNutrient("Total lipid"),
        serving: "100g",
        dataType: food.dataType
      };
    });

    res.json({
      success: true,
      query: q,
      results,
      totalResults: response.data.totalHits
    });

  } catch (error) {
    console.error('❌ Search error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// -------------------------------------------
// FIXED USDA NUTRITION BY FDC ID
// -------------------------------------------
router.get('/nutrition/:fdcId', async (req, res) => {
  try {
    const { fdcId } = req.params;

    console.log('🔍 Fetching nutrition for FDC ID:', fdcId);

    const response = await axios.get(
      `https://api.nal.usda.gov/fdc/v1/food/${fdcId}`,
      {
        params: { api_key: process.env.USDA_API_KEY }
      }
    );

    const nutrients = response.data.foodNutrients;

    const getNutrient = (name) => {
      const n = nutrients.find(n => n.nutrient.name.includes(name)); // FIXED
      return n ? Math.round(n.amount) : 0;                           // FIXED
    };

    const data = {
      id: response.data.fdcId,
      name: response.data.description,
      calories: getNutrient("Energy"),
      protein: getNutrient("Protein"),
      carbs: getNutrient("Carbohydrate"),
      fats: getNutrient("Total lipid"),
      fiber: getNutrient("Fiber"),
      sugar: getNutrient("Sugars"),
      serving: "100g",
      dataType: response.data.dataType
    };

    res.json({ success: true, data });

  } catch (error) {
    console.error('❌ Nutrition fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nutrition data',
      error: error.message
    });
  }
});

export default router;
