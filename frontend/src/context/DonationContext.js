// DonationContext.js - Context for managing donation flow state

import React, { createContext, useState, useContext, useCallback } from 'react';

const DonationContext = createContext();

export const useDonation = () => {
  const context = useContext(DonationContext);
  if (!context) {
    throw new Error('useDonation must be used within DonationProvider');
  }
  return context;
};

export const DonationProvider = ({ children }) => {
  const [donationData, setDonationData] = useState({
    amount: null,
    charity: null,
    project: null,
    campaign: null,
    paymentMethod: 'CARD',
    isRecurring: false,
    frequency: 'MONTHLY',
    allocations: [],
  });

  const [donationHistory, setDonationHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Set donation amount
   */
  const setAmount = useCallback((amount) => {
    setDonationData(prev => ({ ...prev, amount }));
  }, []);

  /**
   * Set charity for donation
   */
  const setCharity = useCallback((charity) => {
    setDonationData(prev => ({ ...prev, charity }));
  }, []);

  /**
   * Set project for donation
   */
  const setProject = useCallback((project) => {
    setDonationData(prev => ({ ...prev, project }));
  }, []);

  /**
   * Set campaign for donation
   */
  const setCampaign = useCallback((campaign) => {
    setDonationData(prev => ({ ...prev, campaign }));
  }, []);

  /**
   * Set payment method
   */
  const setPaymentMethod = useCallback((method) => {
    setDonationData(prev => ({ ...prev, paymentMethod: method }));
  }, []);

  /**
   * Toggle recurring donation
   */
  const setRecurring = useCallback((isRecurring, frequency = 'MONTHLY') => {
    setDonationData(prev => ({
      ...prev,
      isRecurring,
      frequency: isRecurring ? frequency : 'MONTHLY',
    }));
  }, []);

  /**
   * Set fund allocations
   */
  const setAllocations = useCallback((allocations) => {
    setDonationData(prev => ({ ...prev, allocations }));
  }, []);

  /**
   * Process donation
   */
  const processDonation = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User must be logged in to donate');
      }

      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: donationData.amount,
          charityId: donationData.charity?.id,
          projectId: donationData.project?.id,
          campaignId: donationData.campaign?.id,
          paymentMethod: donationData.paymentMethod,
          isRecurring: donationData.isRecurring,
          frequency: donationData.isRecurring ? donationData.frequency : null,
          allocations: donationData.allocations,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Donation failed');
      }

      const result = await response.json();
      
      // Add to donation history
      setDonationHistory(prev => [result, ...prev]);
      
      // Reset donation data
      resetDonation();
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [donationData]);

  /**
   * Reset donation data
   */
  const resetDonation = useCallback(() => {
    setDonationData({
      amount: null,
      charity: null,
      project: null,
      campaign: null,
      paymentMethod: 'CARD',
      isRecurring: false,
      frequency: 'MONTHLY',
      allocations: [],
    });
    setError(null);
  }, []);

  /**
   * Load donation history
   */
  const loadDonationHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/donations/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDonationHistory(data);
      }
    } catch (err) {
      console.error('Failed to load donation history:', err);
    }
  }, []);

  /**
   * Get total donated amount
   */
  const getTotalDonated = useCallback(() => {
    return donationHistory.reduce((total, donation) => {
      return total + (donation.amount || 0);
    }, 0);
  }, [donationHistory]);

  /**
   * Get donation count
   */
  const getDonationCount = useCallback(() => {
    return donationHistory.length;
  }, [donationHistory]);

  const value = {
    // State
    donationData,
    donationHistory,
    isProcessing,
    error,
    
    // Actions
    setAmount,
    setCharity,
    setProject,
    setCampaign,
    setPaymentMethod,
    setRecurring,
    setAllocations,
    processDonation,
    resetDonation,
    loadDonationHistory,
    
    // Computed
    getTotalDonated,
    getDonationCount,
  };

  return (
    <DonationContext.Provider value={value}>
      {children}
    </DonationContext.Provider>
  );
};

export default DonationContext;
