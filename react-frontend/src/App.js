import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/subjects')
      .then(response => {
        setSubjects(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching subjects:', err);
        setError('과목 정보를 불러오지 못했습니다.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Information Exam Project</h1>
      <h2>Subjects</h2>
      {error ? <p>{error}</p> : null}
      <ul>
        {subjects.map(subject => (
          <li key={subject.id}>{subject.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
