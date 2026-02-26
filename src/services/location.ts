import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_KEY = 'user_location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
}

export async function getAndSaveUserLocation(): Promise<UserLocation | null> {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    console.log('Location permission denied');
    Alert.alert('Permission Denied', 'Location permission is required');
    return null;
  }

  // console.log('📍 Getting current position...');

  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      async position => {
        // console.log('📍 Position received:', position.coords); 
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        };

        try {
          await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(location));
          // console.log('📍 Location saved:', location);
        } catch (error) {
          console.error('Error saving location:', error);
        }

        resolve(location);
      },
      error => {
        // console.error('📍 Error getting location:', error.code, error.message);
        if (error.code === 1) {
          Alert.alert(
            'Permission Denied',
            'Please enable location permission in Settings',
          );
        } else {
          Alert.alert('Location Error', error.message);
        }
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  });
}

export async function getSavedLocation(): Promise<UserLocation | null> {
  try {
    const locationStr = await AsyncStorage.getItem(LOCATION_KEY);
    if (locationStr) {
      return JSON.parse(locationStr);
    }
    return null;
  } catch (error) {
    console.error('Error getting saved location:', error);
    return null;
  }
}
