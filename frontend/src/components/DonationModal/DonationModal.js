import React, { useState } from 'react';
import './DonationModal.css';

const DonationModal = ({ isOpen, onClose, project, charity }) => {
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('MONTHLY');
  const [isProcessing, setIsProcessing] = useState(false);

  const presetAmounts = [10, 25, 50, 100, 250, 500];

  const handleDonation = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const donationAmount = customAmount || amount;
      
      // TODO: Integrate with Stripe payment processing
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: parseFloat(donationAmount),
          charityId: charity.id,
          projectId: project?.id,
          paymentMethod,
          isRecurring,
          frequency: isRecurring ? frequency : null
        })
      });

      if (response.ok) {
        alert('Thank you for your donation!');
        onClose();
        // Refresh page or update state
      } else {
        alert('Donation failed. Please try again.');
      }
    } catch (error) {
      console.error('Donation error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <h2 className="modal-title">Make a Donation</h2>
        <p className="modal-subtitle">
          {project ? `Supporting: ${project.name}` : `Supporting: ${charity.name}`}
        </p>

        <form onSubmit={handleDonation}>
          {/* Preset Amounts */}
          <div className="amount-section">
            <label className="section-label">Select Amount</label>
            <div className="preset-amounts">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`amount-btn ${amount === preset ? 'active' : ''}`}
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount('');
                  }}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="custom-amount">
            <label htmlFor="custom-amount" className="section-label">
              Or Enter Custom Amount
            </label>
            <div className="input-group">
              <span className="input-prefix">$</span>
              <input
                type="number"
                id="custom-amount"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setAmount('');
                }}
                min="1"
                step="0.01"
              />
            </div>
          </div>

          {/* Recurring Donation */}
          <div className="recurring-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <span>Make this a recurring donation</span>
            </label>

            {isRecurring && (
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="frequency-select"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            )}
          </div>

          {/* Payment Method */}
          <div className="payment-section">
            <label className="section-label">Payment Method</label>
            <div className="payment-methods">
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="CARD"
                  checked={paymentMethod === 'CARD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Credit/Debit Card</span>
              </label>
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="PAYPAL"
                  checked={paymentMethod === 'PAYPAL'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>PayPal</span>
              </label>
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Bank Transfer</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="donate-btn"
            disabled={isProcessing || (!amount && !customAmount)}
          >
            {isProcessing ? 'Processing...' : `Donate $${customAmount || amount || '0'}`}
          </button>
        </form>

        <p className="secure-note">
          <svg className="lock-icon" width="12" height="12" viewBox="0 0 12 12">
            <path d="M10 5h-1V3a3 3 0 00-6 0v2H2a1 1 0 00-1 1v5a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1zM4 3a2 2 0 114 0v2H4V3z" fill="currentColor"/>
          </svg>
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
};

export default DonationModal;
