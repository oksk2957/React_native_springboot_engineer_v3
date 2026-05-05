import React from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";

export default function GoogleLogin() {
  return (
    <TouchableOpacity 
      style={styles.googleButton} 
      onPress={() => Alert.alert("테스트", "버튼이 작동합니다!")}
    >
      <Text style={styles.googleButtonText}>Google 로그인 테스트</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: "#4285F4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  googleButtonText: { color: "#fff", fontSize: 16 },
});
