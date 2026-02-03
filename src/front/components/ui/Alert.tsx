'use client';

import React from 'react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

export function Alert({ variant = 'info', children }: AlertProps) {
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };
  
  return (
    <div className={`p-4 border rounded-md ${variantStyles[variant]}`}>
      {children}
    </div>
  );
}
