import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const WeeklyProgress = ({ weekData }) => {
  const chartData = weekData.map(day => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    calories: day.calories,
    protein: day.protein
  }));

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4">📅 Weekly Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="calories" fill="#FF6B6B" name="Calories" />
          <Bar dataKey="protein" fill="#3B82F6" name="Protein (g)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyProgress;