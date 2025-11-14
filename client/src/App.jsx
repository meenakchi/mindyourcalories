import React, { useState } from 'react';
import axios from 'axios';

function LogMealTest() {
  const [response, setResponse] = useState(null);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async () => {
    if (!file) return alert('Please select a file');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/ai/test-logmeal`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResponse(res.data);
    } catch (error) {
      console.error('Upload error', error);
      alert('Upload failed');
    }
  };

  return (
    <div>
      <h1>LogMeal Test Upload</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleSubmit}>Upload and Recognize</button>
      {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
    </div>
  );
}

export default LogMealTest;
