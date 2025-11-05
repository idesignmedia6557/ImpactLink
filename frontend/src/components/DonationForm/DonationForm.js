import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import './DonationForm.css';

const DonationForm = ({ projectId, projectName }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid donation amount');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Create payment intent on backend
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/donations/create-payment-intent`,
        {
          amount: parseFloat(amount) * 100, // Convert to cents
          projectId,
        }
      );

      const { clientSecret } = data;

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        setMessage(`Thank you! Your donation of $${amount} to ${projectName} was successful!`);
        setAmount('');
        elements.getElement(CardElement).clear();
        
        // Optional: Trigger a callback or refresh
        setTimeout(() => {
          setMessage('');
        }, 5000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="donation-form-container">
      <h2>Support {projectName}</h2>
      <form onSubmit={handleSubmit} className="donation-form">
        <div className="form-group">
          <label htmlFor="amount">Donation Amount ($)</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            step="0.01"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Card Details</label>
          <div className="card-element-wrapper">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <button
          type="submit"
          className="donate-button"
          disabled={!stripe || loading}
        >
          {loading ? 'Processing...' : `Donate $${amount || '0'}`}
        </button>
      </form>

      <div className="secure-notice">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
        </svg>
        <span>Secure payment powered by Stripe</span>
      </div>
    </div>
  );
};

export default DonationForm;
