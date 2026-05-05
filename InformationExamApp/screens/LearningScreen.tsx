import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import axios from 'axios';

const LearningScreen = () => {
  const [problems, setProblems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    axios.get('/api/problems/random')
      .then(response => setProblems(response.data))
      .catch(error => console.error(error));
  }, []);

  const handleNext = () => {
    if (currentIndex < problems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      alert('학습 완료!');
    }
  };

  return (
    <View>
      {problems.length > 0 && (
        <Text>{problems[currentIndex].question}</Text>
      )}
      <Button title="다음" onPress={handleNext} />
    </View>
  );
};

export default LearningScreen;