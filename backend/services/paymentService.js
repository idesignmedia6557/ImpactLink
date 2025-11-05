const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Payment Service for Stripe Integration
 * Handles customer management, payment intents, refunds, webhooks, and payment methods
 */

/**
 * Create a new Stripe customer
 * @param {Object} customerData - Customer information
 * @returns {Promise<Object>} Stripe customer object
 */
const createCustomer = async (customerData) => {
  try {
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      metadata: customerData.metadata || {}
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create customer');
  }
};

/**
 * Retrieve a Stripe customer
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} Stripe customer object
 */
const getCustomer = async (customerId) => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
    throw new Error('Failed to retrieve customer');
  }
};

/**
 * Update a Stripe customer
 * @param {string} customerId - Stripe customer ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated Stripe customer object
 */
const updateCustomer = async (customerId, updateData) => {
  try {
    const customer = await stripe.customers.update(customerId, updateData);
    return customer;
  } catch (error) {
    console.error('Error updating Stripe customer:', error);
    throw new Error('Failed to update customer');
  }
};

/**
 * Create a payment intent
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} Payment intent object
 */
const createPaymentIntent = async (paymentData) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(paymentData.amount * 100), // Convert to cents
      currency: paymentData.currency || 'usd',
      customer: paymentData.customerId,
      description: paymentData.description,
      metadata: paymentData.metadata || {},
      payment_method_types: paymentData.paymentMethodTypes || ['card'],
      receipt_email: paymentData.receiptEmail
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

/**
 * Retrieve a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} Payment intent object
 */
const getPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw new Error('Failed to retrieve payment intent');
  }
};

/**
 * Confirm a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @param {Object} confirmData - Confirmation data
 * @returns {Promise<Object>} Confirmed payment intent
 */
const confirmPaymentIntent = async (paymentIntentId, confirmData = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, confirmData);
    return paymentIntent;
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    throw new Error('Failed to confirm payment intent');
  }
};

/**
 * Cancel a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} Cancelled payment intent
 */
const cancelPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error canceling payment intent:', error);
    throw new Error('Failed to cancel payment intent');
  }
};

/**
 * Create a refund
 * @param {Object} refundData - Refund information
 * @returns {Promise<Object>} Refund object
 */
const createRefund = async (refundData) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: refundData.paymentIntentId,
      amount: refundData.amount ? Math.round(refundData.amount * 100) : undefined, // Partial refund if amount specified
      reason: refundData.reason || 'requested_by_customer',
      metadata: refundData.metadata || {}
    });
    return refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw new Error('Failed to create refund');
  }
};

/**
 * Retrieve a refund
 * @param {string} refundId - Refund ID
 * @returns {Promise<Object>} Refund object
 */
const getRefund = async (refundId) => {
  try {
    const refund = await stripe.refunds.retrieve(refundId);
    return refund;
  } catch (error) {
    console.error('Error retrieving refund:', error);
    throw new Error('Failed to retrieve refund');
  }
};

/**
 * List all refunds for a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Array>} Array of refund objects
 */
const listRefunds = async (paymentIntentId) => {
  try {
    const refunds = await stripe.refunds.list({
      payment_intent: paymentIntentId,
      limit: 100
    });
    return refunds.data;
  } catch (error) {
    console.error('Error listing refunds:', error);
    throw new Error('Failed to list refunds');
  }
};

/**
 * Verify webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} Verified event object
 */
const verifyWebhookSignature = (payload, signature) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    throw new Error('Webhook signature verification failed');
  }
};

/**
 * Attach a payment method to a customer
 * @param {string} paymentMethodId - Payment method ID
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Payment method object
 */
const attachPaymentMethod = async (paymentMethodId, customerId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });
    return paymentMethod;
  } catch (error) {
    console.error('Error attaching payment method:', error);
    throw new Error('Failed to attach payment method');
  }
};

/**
 * Detach a payment method from a customer
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} Payment method object
 */
const detachPaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    console.error('Error detaching payment method:', error);
    throw new Error('Failed to detach payment method');
  }
};

/**
 * List payment methods for a customer
 * @param {string} customerId - Customer ID
 * @param {string} type - Payment method type (default: 'card')
 * @returns {Promise<Array>} Array of payment method objects
 */
const listPaymentMethods = async (customerId, type = 'card') => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: type
    });
    return paymentMethods.data;
  } catch (error) {
    console.error('Error listing payment methods:', error);
    throw new Error('Failed to list payment methods');
  }
};

/**
 * Set default payment method for a customer
 * @param {string} customerId - Customer ID
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} Updated customer object
 */
const setDefaultPaymentMethod = async (customerId, paymentMethodId) => {
  try {
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
    return customer;
  } catch (error) {
    console.error('Error setting default payment method:', error);
    throw new Error('Failed to set default payment method');
  }
};

/**
 * Retrieve a payment method
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} Payment method object
 */
const getPaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    throw new Error('Failed to retrieve payment method');
  }
};

module.exports = {
  // Customer management
  createCustomer,
  getCustomer,
  updateCustomer,
  
  // Payment intent management
  createPaymentIntent,
  getPaymentIntent,
  confirmPaymentIntent,
  cancelPaymentIntent,
  
  // Refund management
  createRefund,
  getRefund,
  listRefunds,
  
  // Webhook verification
  verifyWebhookSignature,
  
  // Payment method management
  attachPaymentMethod,
  detachPaymentMethod,
  listPaymentMethods,
  setDefaultPaymentMethod,
  getPaymentMethod
};
