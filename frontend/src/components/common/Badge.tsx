import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  children,
}) => {
  const variants = {
    default: 'bg-gray-600/50 text-gray-300',
    success: 'bg-green-600/30 text-green-400',
    warning: 'bg-yellow-600/30 text-yellow-400',
    error: 'bg-red-600/30 text-red-400',
    info: 'bg-blue-600/30 text-blue-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
};
