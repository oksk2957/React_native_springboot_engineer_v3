import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/subjects')
      .then(response => {
        setSubjects(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching subjects:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Information Exam Project</h1>
      <h2>Subjects</h2>
      <ul>
        {subjects.map(subject => (
          <li key={subject.id}>{subject.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
