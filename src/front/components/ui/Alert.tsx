'use client';

import React from 'react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  type?: 'info' | 'success' | 'warning' | 'error';
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
}

export function Alert({ variant, type, message, children, onClose }: AlertProps) {
  const alertType = type || variant || 'info';
  
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };
  
  return (
    <div className={`p-4 border rounded-md ${variantStyles[alertType]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-xl font-bold">{icons[alertType]}</span>
        </div>
        <div className="ml-3 flex-1">
          {message && <p className="text-sm font-medium">{message}</p>}
          {children}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-3 inline-flex text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <span className="text-xl">×</span>
          </button>
        )}
      </div>
    </div>
  );
}
