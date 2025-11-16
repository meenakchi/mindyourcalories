import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const MacrosPieChart = ({ protein, carbs, fats }) => {
  const data = [
    { name: 'Protein', value: protein, color: '#3B82F6' },
    { name: 'Carbs', value: carbs, color: '#FBBF24' },
    { name: 'Fats', value: fats, color: '#10B981' }
  ];

  const COLORS = data.map(item => item.color);

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4">🥗 Today's Macros</h3>
      {protein + carbs + fats === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Log a meal to see your macro breakdown</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{protein}g</p>
          <p className="text-xs text-gray-600">Protein</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{carbs}g</p>
          <p className="text-xs text-gray-600">Carbs</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{fats}g</p>
          <p className="text-xs text-gray-600">Fats</p>
        </div>
      </div>
    </div>
  );
};

export default MacrosPieChart;