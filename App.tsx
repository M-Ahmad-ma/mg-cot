import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BookOpen } from 'lucide-react-native';
import {
  LoginScreen,
  GradeSelectionScreen,
  GradeTypeSelectionScreen,
  MultiGradeSelectionScreen,
  ClassroomSelectionScreen,
  ObservationScoreScreen,
  DiscussionChecklistScreen,
  AdditionalObservationScreen,
  ObservationScreen,
  SingleGradeDetailsScreen,
  MultiGradeFormScreen,
} from './src/screens';
import {
  ObservationProvider,
  AuthProvider,
  useAuth,
  TimerProvider,
} from './src/context';
import { ObservationTimer } from './src/components/ObservationTimer';
import { getAndSaveUserLocation } from './src/services/location';

export type RootStackParamList = {
  Login: undefined;
  Setup: undefined;
  GradeTypeSelection: undefined;
  GradeSelection: undefined;
  MultiGradeSelection: undefined;
  ClassroomSelection: undefined;
  SingleGradeDetails: undefined;
  MultiGradeForm: undefined;
  ObservationScreen: undefined;
  Observation: undefined;
  ObservationScore: undefined;
  DiscussionChecklist: {
    noQuestions?: { id: number; question: string; category?: string }[];
    answers?: { [key: number]: boolean | null };
  };
  AdditionalObservation: undefined;
  Main: undefined;
  ObservationFlow: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

function SetupStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackVisible: false,
        gestureEnabled: false,
        headerBackButtonMenuEnabled: false,
        headerRight: () => <ObservationTimer />,
      }}
    >
      <Stack.Screen
        name="ClassroomSelection"
        component={ClassroomSelectionScreen}
        options={{
          title: 'Classroom Details',
          headerBackVisible: false,
          gestureEnabled: false,
          headerBackButtonMenuEnabled: false,
        }}
      />
      <Stack.Screen
        name="GradeTypeSelection"
        component={GradeTypeSelectionScreen}
        options={{
          title: 'Grade Selection',
          headerBackVisible: false,
          gestureEnabled: false,
          headerBackButtonMenuEnabled: false,
        }}
      />
      <Stack.Screen
        name="GradeSelection"
        component={GradeSelectionScreen}
        options={{
          title: 'Select Grade',
          headerBackVisible: false,
          gestureEnabled: false,
          headerBackButtonMenuEnabled: false,
        }}
      />
      <Stack.Screen
        name="SingleGradeDetails"
        component={SingleGradeDetailsScreen}
        options={{
          title: 'Grade Details',
          headerBackVisible: false,
          gestureEnabled: false,
          headerBackButtonMenuEnabled: false,
        }}
      />
      <Stack.Screen
        name="MultiGradeSelection"
        component={MultiGradeSelectionScreen}
        options={{
          title: 'Multi-Grade Selection',
          headerBackVisible: false,
          gestureEnabled: false,
          headerBackButtonMenuEnabled: false,
        }}
      />
      <Stack.Screen
        name="MultiGradeForm"
        component={MultiGradeFormScreen}
        options={{
          title: 'MGT Observation Form',
          headerBackVisible: false,
          gestureEnabled: false,
          headerBackButtonMenuEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

function ObservationFlowStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackVisible: false,
        gestureEnabled: false,
        headerBackButtonMenuEnabled: false,
        headerRight: () => <ObservationTimer />,
      }}
    >
      <Stack.Screen
        name="ObservationScreen"
        component={ObservationScreen}
        options={{
          title: 'Observation',
          headerBackVisible: false,
          gestureEnabled: false,
          headerBackButtonMenuEnabled: false,
        }}
      />
      <Stack.Screen
        name="ObservationScore"
        component={ObservationScoreScreen}
        options={{
          title: 'Observation Score',
          headerBackVisible: false,
          gestureEnabled: false,
          headerBackButtonMenuEnabled: false,
        }}
      />
      <Stack.Screen
        name="DiscussionChecklist"
        component={DiscussionChecklistScreen}
        options={{
          title: 'Discussion Checklist',
          headerBackVisible: false,
          gestureEnabled: false,
          headerBackButtonMenuEnabled: false,
        }}
      />

      <Stack.Screen
        name="AdditionalObservation"
        component={AdditionalObservationScreen}
        options={{
          title: 'Additional Observations',
          headerBackVisible: false,
          gestureEnabled: false,
          headerBackButtonMenuEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { observationStarted } = useAuth();

  const renderTabIcon = (routeName: string, color: string, _size: number) => {
    const iconSize = 24;
    let IconComponent: React.ComponentType<any> = BookOpen;

    switch (routeName) {
      case 'Setup':
        IconComponent = BookOpen;
        break;
    }

    return (
      <View style={styles.iconContainer}>
        <IconComponent size={iconSize} color={color} />
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          return renderTabIcon(route.name, color, size);
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#fff',
        tabBarItemStyle: observationStarted ? { display: 'none' } : {},
        tabBarVisibilityVisible: !observationStarted,
      })}
    >
      <Tab.Screen
        name="Setup"
        component={SetupStack}
        options={{ headerShown: false, tabBarLabel: 'Setup' }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={
          useColorScheme() === 'dark' ? 'light-content' : 'dark-content'
        }
      />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="ObservationFlow"
              component={ObservationFlowStack}
              options={{ headerShown: false, presentation: 'fullScreenModal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  const [locationLoaded, setLocationLoaded] = useState(false);

  useEffect(() => {
    getAndSaveUserLocation().then(() => {
      setLocationLoaded(true);
    });
  }, []);

  if (!locationLoaded) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ObservationProvider>
        <TimerProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </TimerProvider>
      </ObservationProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default App;
