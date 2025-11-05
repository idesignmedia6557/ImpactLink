import React from 'react';
import './HowItWorks.css';

const HowItWorks = () => {
  const steps = [
    {
      number: '1',
      title: 'Discover Projects',
      description: 'Browse verified charity projects that align with your values and interests.',
      icon: '🔍'
    },
    {
      number: '2',
      title: 'Choose & Donate',
      description: 'Select a project and donate securely with complete transparency.',
      icon: '💳'
    },
    {
      number: '3',
      title: 'Track Impact',
      description: 'Monitor your contribution and see the real-world impact you are making.',
      icon: '📊'
    },
    {
      number: '4',
      title: 'Stay Connected',
      description: 'Receive updates and reports from the charities you support.',
      icon: '🔔'
    }
  ];

  return (
    <section className="how-it-works">
      <div className="container">
        <h2>How It Works</h2>
        <p className="section-subtitle">
          Making a difference is simple with ImpactLink
        </p>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-icon">{step.icon}</div>
              <div className="step-number">Step {step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
