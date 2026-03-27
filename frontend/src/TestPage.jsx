import React from 'react';

export default function TestPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '1rem',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
            VSLA Platform - Test Page ✅
          </h1>
          <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>
            If you can see this with a purple gradient background and glass card, CSS is working!
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{ background: 'rgba(99,102,241,0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>12</div>
              <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Groups</div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>156</div>
              <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Members</div>
            </div>
            <div style={{ background: 'rgba(139,92,246,0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>$45K</div>
              <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Savings</div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>94%</div>
              <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Repayment</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}