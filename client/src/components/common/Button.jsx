import { Loader } from 'lucide-react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  isLoading = false, 
  disabled = false,
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary hover:bg-red-600 text-white',
    secondary: 'bg-secondary hover:bg-teal-600 text-white',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        btn ${variants[variant]} 
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {isLoading && <Loader size={18} className="animate-spin" />}
      {children}
    </button>
  );
};

export default Button;