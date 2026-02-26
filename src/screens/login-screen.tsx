import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { User, Lock, Eye, EyeOff } from 'lucide-react-native';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const TEST_CREDENTIALS = {
  cnic: '1710110725203',
  password: '1234567',
};

const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  background: '#F1F8E9',
  card: '#FFFFFF',
  text: '#1B5E20',
  textSecondary: '#558B2F',
  border: '#C8E6C9',
};

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (cnic.length !== 13) {
      Alert.alert('Error', 'Please enter a valid 13-digit CNIC');
      return;
    }

    if (password.length === 0) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(cnic, password);
      setIsLoading(false);

      if (result.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        Alert.alert('Error', result.message || 'Login failed');
      }
    } catch {
      setIsLoading(false);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.loginCard}>
        <Text style={styles.loginTitle}>MGCOT</Text>
        <Text style={styles.loginSubtitle}>Educational Observation System</Text>

        <Text style={styles.label}>Enter CNIC</Text>
        <View style={styles.inputContainer}>
          <User
            size={20}
            color={COLORS.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, styles.inputWithIcon]}
            placeholder="CNIC Number"
            placeholderTextColor="#BDBDBD"
            keyboardType="numeric"
            maxLength={13}
            value={cnic}
            onChangeText={setCnic}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputContainer}>
          <Lock
            size={20}
            color={COLORS.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, styles.inputWithIcon]}
            placeholder="Password"
            placeholderTextColor="#BDBDBD"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={COLORS.textSecondary} />
            ) : (
              <Eye size={20} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Enter your CNIC and password to access your dashboard
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loginCard: {
    backgroundColor: COLORS.card,
    margin: 20,
    padding: 30,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    top: 18,
  },
  inputWithIcon: {
    flex: 1,
    paddingLeft: 44,
    paddingRight: 44,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: COLORS.primaryLight,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  dummyCredentials: {
    marginTop: 24,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dummyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  dummyText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
