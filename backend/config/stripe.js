const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a payment intent
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return paymentIntent;
  } catch (error) {
    throw new Error(`Error creating payment intent: ${error.message}`);
  }
};

// Create a customer
const createCustomer = async (email, name, metadata = {}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });
    return customer;
  } catch (error) {
    throw new Error(`Error creating customer: ${error.message}`);
  }
};

// Retrieve payment intent
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    throw new Error(`Error retrieving payment intent: ${error.message}`);
  }
};

// Create a refund
const createRefund = async (paymentIntentId, amount = null) => {
  try {
    const refundData = { payment_intent: paymentIntentId };
    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }
    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    throw new Error(`Error creating refund: ${error.message}`);
  }
};

// List all customers
const listCustomers = async (limit = 10) => {
  try {
    const customers = await stripe.customers.list({ limit });
    return customers;
  } catch (error) {
    throw new Error(`Error listing customers: ${error.message}`);
  }
};

// Webhook signature verification
const constructWebhookEvent = (payload, signature, webhookSecret) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return event;
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
};

module.exports = {
  stripe,
  createPaymentIntent,
  createCustomer,
  retrievePaymentIntent,
  createRefund,
  listCustomers,
  constructWebhookEvent,
};
