const mongoose = require('mongoose');
const stripe = require('../config/stripe');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [1, 'Donation amount must be at least $1']
  },
  platformFee: {
    type: Number,
    default: function() {
      return this.amount * 0.05; // 5% platform fee
    }
  },
  stripeFee: {
    type: Number,
    default: function() {
      return (this.amount * 0.029) + 0.30; // Stripe's standard fee
    }
  },
  netAmount: {
    type: Number,
    default: function() {
      return this.amount - this.platformFee - this.stripeFee;
    }
  },
  paymentIntentId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending'
  },
  refundReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  impactScore: {
    type: Number,
    default: 0
  },
  message: {
    type: String,
    maxlength: 500
  },
  anonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate fees before saving
donationSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount')) {
    this.platformFee = this.amount * 0.05;
    this.stripeFee = (this.amount * 0.029) + 0.30;
    this.netAmount = this.amount - this.platformFee - this.stripeFee;
  }
  next();
});

// Static method to create donation with Stripe payment intent
donationSchema.statics.createWithPaymentIntent = async function(donationData) {
  const { donor, project, amount, message, anonymous } = donationData;
  
  // Verify project exists and is active
  const Project = mongoose.model('Project');
  const projectDoc = await Project.findById(project);
  
  if (!projectDoc) {
    throw new Error('Project not found');
  }
  
  if (projectDoc.status !== 'active') {
    throw new Error('Project is not currently accepting donations');
  }
  
  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    metadata: {
      donorId: donor.toString(),
      projectId: project.toString()
    }
  });
  
  // Create donation record
  const donation = await this.create({
    donor,
    project,
    amount,
    message,
    anonymous,
    paymentIntentId: paymentIntent.id,
    status: 'pending'
  });
  
  return {
    donation,
    clientSecret: paymentIntent.client_secret
  };
};

// Static method to process Stripe webhook events
donationSchema.statics.processStripeWebhook = async function(event) {
  const paymentIntent = event.data.object;
  
  const donation = await this.findOne({ paymentIntentId: paymentIntent.id });
  
  if (!donation) {
    console.error('Donation not found for payment intent:', paymentIntent.id);
    return;
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      donation.status = 'succeeded';
      await donation.save();
      
      // Update project funding
      const Project = mongoose.model('Project');
      await Project.findByIdAndUpdate(donation.project, {
        $inc: { 
          currentFunding: donation.netAmount,
          donorCount: 1
        }
      });
      
      // Update donor impact score
      await donation.updateImpactScore();
      break;
      
    case 'payment_intent.payment_failed':
      donation.status = 'failed';
      await donation.save();
      break;
      
    default:
      console.log('Unhandled event type:', event.type);
  }
};

// Instance method to refund donation
donationSchema.methods.refund = async function(reason) {
  if (this.status !== 'succeeded') {
    throw new Error('Only succeeded donations can be refunded');
  }
  
  // Process refund through Stripe
  await stripe.refunds.create({
    payment_intent: this.paymentIntentId,
    reason: 'requested_by_customer'
  });
  
  // Update donation status
  this.status = 'refunded';
  this.refundReason = reason;
  this.refundedAt = new Date();
  await this.save();
  
  // Update project funding
  const Project = mongoose.model('Project');
  await Project.findByIdAndUpdate(this.project, {
    $inc: { 
      currentFunding: -this.netAmount,
      donorCount: -1
    }
  });
  
  // Update donor impact score
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.donor, {
    $inc: { impactScore: -this.impactScore }
  });
  
  return this;
};

// Instance method to calculate and update impact score
donationSchema.methods.updateImpactScore = async function() {
  if (this.status !== 'succeeded') {
    return;
  }
  
  // Get project to calculate impact multiplier
  const Project = mongoose.model('Project');
  const project = await Project.findById(this.project);
  
  if (!project) {
    return;
  }
  
  // Base impact score calculation
  let impactScore = this.netAmount;
  
  // Apply category multipliers
  const categoryMultipliers = {
    'education': 1.2,
    'healthcare': 1.3,
    'environment': 1.25,
    'poverty': 1.3,
    'disaster-relief': 1.4,
    'community': 1.1
  };
  
  const multiplier = categoryMultipliers[project.category] || 1.0;
  impactScore *= multiplier;
  
  // Bonus for early supporters (first 10 donors get 20% bonus)
  if (project.donorCount <= 10) {
    impactScore *= 1.2;
  }
  
  // Update donation impact score
  this.impactScore = Math.round(impactScore);
  await this.save();
  
  // Update user's total impact score
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.donor, {
    $inc: { impactScore: this.impactScore }
  });
  
  return this.impactScore;
};

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Virtual for formatted net amount
donationSchema.virtual('formattedNetAmount').get(function() {
  return `$${this.netAmount.toFixed(2)}`;
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
