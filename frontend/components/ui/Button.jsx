import React from 'react';
import { styled } from '../../styles/theme';

const StyledButton = styled('button', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '$md',
  fontSize: '$base',
  fontWeight: 500,
  padding: '$2 $4',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
        color: 'white',
        '&:hover': {
          backgroundColor: '$primaryDark',
        },
      },
      secondary: {
        backgroundColor: '$secondary',
        color: 'white',
        '&:hover': {
          backgroundColor: '$secondaryDark',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$text',
        '&:hover': {
          backgroundColor: '$gray100',
        },
      },
      link: {
        backgroundColor: 'transparent',
        color: '$primary',
        padding: 0,
        '&:hover': {
          textDecoration: 'underline',
        },
      },
    },
    size: {
      sm: {
        fontSize: '$sm',
        padding: '$1 $2',
      },
      md: {
        fontSize: '$base',
        padding: '$2 $4',
      },
      lg: {
        fontSize: '$lg',
        padding: '$3 $6',
      },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

const Button = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <StyledButton ref={ref} {...props}>
      {children}
    </StyledButton>
  );
});

Button.displayName = 'Button';

export { Button };
export default Button;
