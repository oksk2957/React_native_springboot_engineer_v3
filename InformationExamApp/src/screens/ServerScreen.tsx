import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export default function ServerScreen() {
  const { darkMode } = useAuthStore();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    if (!query.trim()) {
      Alert.alert('오류', '쿼리를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.get('/problems/execute-query', {
        params: { query },
      });
      
      if (response.data.status === 'success') {
        setResult(response.data.data);
      } else {
        setError(response.data.message || '쿼리 실행 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('쿼리 실행 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = darkMode;

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>서버 테스트</Text>
      </View>

      <View style={[styles.querySection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          SQL 쿼리 실행
        </Text>
        <TextInput
          style={[styles.textInput, isDark && styles.textInputDark]}
          multiline
          numberOfLines={4}
          placeholder="SELECT * FROM problem LIMIT 10;"
          placeholderTextColor={isDark ? '#aaa' : '#666'}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity
          style={[styles.executeButton, isDark && styles.executeButtonDark]}
          onPress={executeQuery}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.executeButtonText}>실행</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={[styles.resultSection, isDark && styles.sectionDark]}>
          <Text style={[styles.errorText, isDark && styles.errorTextDark]}>오류: {error}</Text>
        </View>
      )}

      {result && (
        <View style={[styles.resultSection, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            쿼리 결과
          </Text>
          <ScrollView horizontal>
            <View>
              {result.map((row: any, index: number) => (
                <View key={index} style={styles.resultRow}>
                  <Text style={[styles.resultText, isDark && styles.resultTextDark]}>
                    {JSON.stringify(row)}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    backgroundColor: '#4a90e2',
  },
  headerDark: {
    backgroundColor: '#2d2d2d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  titleDark: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2d3748',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  querySection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionDark: {
    backgroundColor: '#2d2d2d',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  textInputDark: {
    borderColor: '#444',
    color: '#fff',
    backgroundColor: '#333',
  },
  executeButton: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  executeButtonDark: {
    backgroundColor: '#3a7bc8',
  },
  executeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 14,
  },
  errorTextDark: {
    color: '#fc8181',
  },
  resultRow: {
    paddingVertical: 4,
  },
  resultText: {
    fontSize: 12,
    color: '#2d3748',
  },
  resultTextDark: {
    color: '#ddd',
  },
});