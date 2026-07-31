'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md px-6 py-3 shadow-sm cursor-pointer';

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-sinet-blue text-white hover:bg-sinet-navy focus:ring-sinet-blue-light border border-transparent',
    secondary:
      'bg-white text-sinet-blue border border-gray-200 hover:bg-gray-50 focus:ring-sinet-blue',
    ghost:
      'bg-transparent text-sinet-blue hover:bg-sinet-blue/5 focus:ring-sinet-blue border border-transparent',
    gold:
      'bg-sinet-gold text-sinet-navy hover:bg-gold-light focus:ring-gold-main font-semibold border border-gold-dark/20',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

