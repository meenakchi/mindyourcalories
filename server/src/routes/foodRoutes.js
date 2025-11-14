import express from 'express';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Test Clarifai
router.get('/test-clarifai', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.clarifai.com/v2/models/food-item-recognition/outputs',
      {
        inputs: [{
          data: {
            image: {
              url: 'https://samples.clarifai.com/food.jpg'
            }
          }
        }]
      },
      {
        headers: {
          'Authorization': `Key ${process.env.CLARIFAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const concepts = response.data.outputs[0].data.concepts.slice(0, 3);

    res.json({
      success: true,
      message: 'Clarifai API is working! ✅',
      sample: concepts.map(c => c.name)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Clarifai API test failed ❌',
      error: error.response?.data || error.message
    });
  }
});

// Test USDA
router.get('/test-usda', async (req, res) => {
  try {
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
    res.status(500).json({
      success: false,
      message: 'USDA API test failed ❌',
      error: error.response?.data || error.message
    });
  }
});

// Analyze meal (image → recognition → nutrition)
router.post('/analyze-meal', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    console.log('📸 Processing image...');

    // Step 1: Read image as base64
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    // Step 2: Recognize with Clarifai
    const clarifaiResponse = await axios.post(
      'https://api.clarifai.com/v2/models/food-item-recognition/outputs',
      {
        inputs: [{ data: { image: { base64: base64Image } } }]
      },
      {
        headers: {
          'Authorization': `Key ${process.env.CLARIFAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const concepts = clarifaiResponse.data.outputs[0].data.concepts.slice(0, 5);
    console.log('✅ Recognized:', concepts.length, 'foods');

    // Step 3: Get nutrition for each
    const foodsWithNutrition = await Promise.all(
      concepts.map(async (concept) => {
        try {
          const nutritionResponse = await axios.get(
            'https://api.nal.usda.gov/fdc/v1/foods/search',
            {
              params: {
                query: concept.name,
                api_key: process.env.USDA_API_KEY,
                pageSize: 1
              }
            }
          );

          const foods = nutritionResponse.data.foods;
          
          if (foods.length > 0) {
            const food = foods[0];
            const nutrients = food.foodNutrients;

            const getNutrient = (name) => {
              const nutrient = nutrients.find(n => n.nutrientName.includes(name));
              return nutrient ? Math.round(nutrient.value) : 0;
            };

            return {
              name: concept.name,
              confidence: (concept.value * 100).toFixed(1),
              calories: getNutrient('Energy'),
              protein: getNutrient('Protein'),
              carbs: getNutrient('Carbohydrate'),
              fats: getNutrient('Total lipid'),
              serving: '100g',
              source: 'USDA'
            };
          }

          return {
            name: concept.name,
            confidence: (concept.value * 100).toFixed(1),
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            serving: '100g',
            source: 'manual',
            needsManualEntry: true
          };

        } catch (error) {
          console.error(`Error for ${concept.name}:`, error.message);
          return null;
        }
      })
    );

    // Clean up
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    const validFoods = foodsWithNutrition.filter(f => f !== null);
    console.log('✅ Completed analysis');

    res.json({
      success: true,
      message: 'Meal analyzed successfully',
      foods: validFoods
    });

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
    
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      message: 'Failed to analyze meal',
      error: error.message
    });
  }
});

// Search food manually
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Query required' });
    }

    console.log('🔍 Searching for:', q);

    const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
      params: {
        query: q,
        api_key: process.env.USDA_API_KEY,
        pageSize: limit
      }
    });

    const results = response.data.foods.map(food => {
      const nutrients = food.foodNutrients;
      
      const getNutrient = (name) => {
        const nutrient = nutrients.find(n => n.nutrientName.includes(name));
        return nutrient ? Math.round(nutrient.value) : 0;
      };

      return {
        id: food.fdcId,
        name: food.description,
        calories: getNutrient('Energy'),
        protein: getNutrient('Protein'),
        carbs: getNutrient('Carbohydrate'),
        fats: getNutrient('Total lipid'),
        serving: '100g'
      };
    });

    console.log('✅ Found:', results.length, 'results');

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('❌ Search error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

export default router;