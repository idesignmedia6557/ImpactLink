// Progressive Registration Component - Step 13
// Multi-step registration process for ImpactLink MVP

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface RegistrationData {
  // Step 1
  email?: string;
  userRole?: 'donor' | 'charity_admin' | 'corporate_admin';
  // Step 2
  name?: string;
  organization?: string;
  phone?: string;
  // Step 3
  password?: string;
  confirmPassword?: string;
  marketingOptIn?: boolean;
  notificationsEnabled?: boolean;
}

const ProgressiveRegistration: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegistrationData>();

  const handleStep1Submit = async (data: RegistrationData) => {
    try {
      setLoading(true);
      // Validate email doesn't exist
      const response = await axios.post('/api/auth/register/step1', {
        email: data.email,
        userRole: data.userRole,
      });
      
      if (response.data.success) {
        setRegistrationData({ ...registrationData, ...data });
        setCurrentStep(2);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (data: RegistrationData) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/register/step2', {
        email: registrationData.email,
        name: data.name,
        organization: data.organization,
        phone: data.phone,
      });
      
      if (response.data.success) {
        setRegistrationData({ ...registrationData, ...data });
        setCurrentStep(3);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Personal details validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (data: RegistrationData) => {
    try {
      setLoading(true);
      if (data.password !== data.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const completeData = { ...registrationData, ...data };
      const response = await axios.post('/api/auth/register/complete', {
        email: completeData.email,
        password: completeData.password,
        name: completeData.name,
        userRole: completeData.userRole,
        organization: completeData.organization,
        phone: completeData.phone,
        marketingOptIn: completeData.marketingOptIn,
        notificationsEnabled: completeData.notificationsEnabled,
      });

      if (response.data.success) {
        // Store auth token
        localStorage.setItem('authToken', response.data.token);
        // Send welcome email
        await axios.post('/api/email/send-welcome', { userId: response.data.userId });
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Progress Indicator */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">Join ImpactLink</h1>
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= step ? 'bg-white text-blue-600' : 'bg-blue-400 text-white'
                }`}>
                  {step}
                </div>
                <span className="text-xs mt-2">{['Email', 'Details', 'Password'][step - 1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form className="p-8" onSubmit={currentStep === 1 ? handleSubmit(handleStep1Submit) : currentStep === 2 ? handleSubmit(handleStep2Submit) : handleSubmit(handleStep3Submit)}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Step 1: Email & Role */}
          {currentStep === 1 && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">I am a...</label>
                <div className="space-y-2">
                  {['donor', 'charity_admin', 'corporate_admin'].map((role) => (
                    <label key={role} className="flex items-center">
                      <input
                        type="radio"
                        value={role}
                        {...register('userRole', { required: 'Please select a role' })}
                        className="mr-3"
                      />
                      <span className="text-gray-700">
                        {role === 'donor' ? 'Donor' : role === 'charity_admin' ? 'Charity Manager' : 'Corporate Admin'}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.userRole && <span className="text-red-500 text-sm">{errors.userRole.message}</span>}
              </div>
            </>
          )}

          {/* Step 2: Personal Details */}
          {currentStep === 2 && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Organization (Optional)</label>
                <input
                  type="text"
                  placeholder="Your Company/Charity"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('organization')}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('phone', { required: 'Phone is required' })}
                />
                {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
              </div>
            </>
          )}

          {/* Step 3: Password & Preferences */}
          {currentStep === 3 && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                />
                {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('confirmPassword', { required: 'Please confirm password' })}
                />
              </div>

              <div className="mb-4 space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" {...register('marketingOptIn')} className="mr-3" />
                  <span className="text-sm text-gray-700">Send me tips and updates</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" {...register('notificationsEnabled')} defaultChecked className="mr-3" />
                  <span className="text-sm text-gray-700">Enable notifications</span>
                </label>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : currentStep === 3 ? 'Create Account' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressiveRegistration;
