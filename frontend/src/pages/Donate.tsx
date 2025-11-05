import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Donate.css';

interface DonationFormData {
  amount: string;
  customAmount: string;
  frequency: 'one-time' | 'monthly';
  charityId: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

const Donate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const charityIdParam = searchParams.get('charity');

  const [formData, setFormData] = useState<DonationFormData>({
    amount: '50',
    customAmount: '',
    frequency: 'one-time',
    charityId: charityIdParam || '',
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });

  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const predefinedAmounts = ['25', '50', '100', '250', '500'];

  const handleAmountSelect = (amount: string) => {
    if (amount === 'custom') {
      setShowCustomAmount(true);
      setFormData({ ...formData, amount: '' });
    } else {
      setShowCustomAmount(false);
      setFormData({ ...formData, amount, customAmount: '' });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFrequencyChange = (frequency: 'one-time' | 'monthly') => {
    setFormData({ ...formData, frequency });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Placeholder for payment processing
    // Will integrate with payment gateway (Stripe/PayPal)
    setTimeout(() => {
      setIsProcessing(false);
      // Redirect to success page or dashboard
      navigate('/user/dashboard?donation=success');
    }, 2000);
  };

  const getDonationAmount = () => {
    return showCustomAmount ? formData.customAmount : formData.amount;
  };

  return (
    <div className="donate-container">
      <header className="donate-header">
        <h1>Make a Donation</h1>
        <p>Your contribution makes a real difference</p>
      </header>

      <div className="donate-content">
        <form onSubmit={handleSubmit} className="donation-form">
          {/* Amount Selection */}
          <section className="form-section">
            <h2>Donation Amount</h2>
            <div className="amount-buttons">
              {predefinedAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleAmountSelect(amount)}
                  className={`amount-btn ${
                    formData.amount === amount && !showCustomAmount ? 'active' : ''
                  }`}
                >
                  ${amount}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleAmountSelect('custom')}
                className={`amount-btn ${showCustomAmount ? 'active' : ''}`}
              >
                Custom
              </button>
            </div>

            {showCustomAmount && (
              <div className="custom-amount-input">
                <label htmlFor="customAmount">Enter Amount ($)</label>
                <input
                  type="number"
                  id="customAmount"
                  name="customAmount"
                  value={formData.customAmount}
                  onChange={handleInputChange}
                  placeholder="Enter custom amount"
                  min="1"
                  required
                />
              </div>
            )}
          </section>

          {/* Frequency Selection */}
          <section className="form-section">
            <h2>Donation Frequency</h2>
            <div className="frequency-buttons">
              <button
                type="button"
                onClick={() => handleFrequencyChange('one-time')}
                className={`frequency-btn ${
                  formData.frequency === 'one-time' ? 'active' : ''
                }`}
              >
                One-Time
              </button>
              <button
                type="button"
                onClick={() => handleFrequencyChange('monthly')}
                className={`frequency-btn ${
                  formData.frequency === 'monthly' ? 'active' : ''
                }`}
              >
                Monthly
              </button>
            </div>
          </section>

          {/* Charity Selection */}
          {!charityIdParam && (
            <section className="form-section">
              <label htmlFor="charityId">Select Charity</label>
              <select
                id="charityId"
                name="charityId"
                value={formData.charityId}
                onChange={handleInputChange}
                required
              >
                <option value="">Choose a charity...</option>
                <option value="1">Global Education Fund</option>
                <option value="2">Clean Water Initiative</option>
                <option value="3">Healthcare for All</option>
                {/* More charities will be loaded from API */}
              </select>
            </section>
          )}

          {/* Donor Information */}
          <section className="form-section">
            <h2>Your Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message (Optional)</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                placeholder="Add a message or dedication..."
              />
            </div>
          </section>

          {/* Payment Section Placeholder */}
          <section className="form-section">
            <h2>Payment Information</h2>
            <div className="payment-placeholder">
              <p>🔒 Secure payment processing will be integrated here</p>
              <p>Supported methods: Credit Card, Debit Card, PayPal</p>
            </div>
          </section>

          {/* Submit Button */}
          <div className="form-actions">
            <div className="total-amount">
              <strong>Total: ${getDonationAmount()}</strong>
              {formData.frequency === 'monthly' && <span>/month</span>}
            </div>
            <button
              type="submit"
              className="btn btn-donate"
              disabled={isProcessing || !getDonationAmount()}
            >
              {isProcessing ? 'Processing...' : 'Complete Donation'}
            </button>
          </div>
        </form>

        {/* Donation Impact Sidebar */}
        <aside className="impact-sidebar">
          <h3>Your Impact</h3>
          <div className="impact-info">
            <p>🎓 $50 can provide school supplies for 5 children</p>
            <p>💧 $100 can provide clean water for a family for a year</p>
            <p>🏥 $250 can support a teacher's salary for a month</p>
          </div>
          <div className="security-badges">
            <p>✅ 100% Secure & Encrypted</p>
            <p>🎯 Tax-Deductible Receipts</p>
            <p>📄 Transparent Tracking</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Donate;
