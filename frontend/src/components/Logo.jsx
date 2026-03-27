import React from 'react';

const Logo = ({ size = 'md', showText = true }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };
  
  const iconSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`${sizes[size]} bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg`}>
        <span className={`${iconSizes[size]} text-white font-bold`}>₿</span>
      </div>
      {showText && (
        <div>
          <h1 className={`font-bold ${textSizes[size]} text-gray-800`}>
            VSLA<span className="text-primary-600">Platform</span>
          </h1>
          <p className="text-xs text-gray-500">Village Savings & Loan Association</p>
        </div>
      )}
    </div>
  );
};

export default Logo;