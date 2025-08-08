import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendLoginLink } from '../../src/data/session';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendLoginLink = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await sendLoginLink(email);
      
      if (success) {
        setEmailSent(true);
      } else {
        Alert.alert('Error', 'Failed to send login link. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setEmail('');
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <StatusBar style="light" />
        <View className="flex-1 justify-center px-6">
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-primary rounded-full items-center justify-center mb-4">
              <Text className="text-2xl">📧</Text>
            </View>
            <Text className="text-2xl font-bold text-text-primary mb-2">
              Check your email
            </Text>
            <Text className="text-text-secondary text-center leading-6">
              We've sent a login link to{'\n'}
              <Text className="text-text-primary font-medium">{email}</Text>
            </Text>
          </View>

          <View className="space-y-4">
            <Text className="text-text-secondary text-center text-sm leading-5">
              Click the link in your email to sign in. The link will expire in 1 hour.
            </Text>
            
            <Pressable
              onPress={handleTryAgain}
              className="py-3 px-4 rounded-lg border border-surface-light active:bg-surface-light"
            >
              <Text className="text-text-primary text-center font-medium">
                Use different email
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-text-primary mb-2">
              Welcome to
            </Text>
            <Text className="text-3xl font-bold text-primary mb-4">
              Pace Plan Pro
            </Text>
            <Text className="text-text-secondary leading-6">
              Get personalized running training plans and track your progress with your coach.
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-text-primary font-medium mb-2">
                Email address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                className="bg-surface border border-surface-light rounded-lg px-4 py-3 text-text-primary"
                editable={!isLoading}
              />
            </View>

            <Pressable
              onPress={handleSendLoginLink}
              disabled={isLoading}
              className={`py-4 px-6 rounded-lg ${
                isLoading 
                  ? 'bg-surface-light' 
                  : 'bg-primary active:bg-primary-dark'
              }`}
            >
              <Text className={`text-center font-semibold ${
                isLoading ? 'text-text-secondary' : 'text-white'
              }`}>
                {isLoading ? 'Sending...' : 'Send login link'}
              </Text>
            </Pressable>
          </View>

          <View className="mt-8 pt-6 border-t border-surface-light">
            <Text className="text-text-tertiary text-sm text-center leading-5">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
