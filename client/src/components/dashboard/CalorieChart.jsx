import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CalorieChart = ({ data }) => {
  // Format data for chart
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    calories: item.calories,
    goal: item.goal || 2000
  }));

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4">📈 Calorie Trend (Last 7 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="calories" 
            stroke="#FF6B6B" 
            strokeWidth={3}
            name="Calories"
          />
          <Line 
            type="monotone" 
            dataKey="goal" 
            stroke="#4ECDC4" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Goal"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CalorieChart;