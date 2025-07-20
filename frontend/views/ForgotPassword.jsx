import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { styled } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

// Reuse styled components from login.jsx
const { 
  LoginContainer, 
  Title, 
  SuccessMessage,
  ErrorMessage, 
  FormFooter, 
  LoginForm, 
  FormGroup 
} = {
  LoginContainer: styled('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '$4',
    backgroundColor: '$background',
  }),
  Title: styled('h1', {
    fontSize: '$2xl',
    fontWeight: 'bold',
    marginBottom: '$6',
    color: '$text',
  }),
  SuccessMessage: styled('p', {
    color: '$success',
    marginBottom: '$4',
    textAlign: 'center',
  }),
  ErrorMessage: styled('p', {
    color: '$error',
    marginBottom: '$4',
    textAlign: 'center',
  }),
  FormFooter: styled('div', {
    marginTop: '$4',
    textAlign: 'center',
    fontSize: '$sm',
    color: '$textSecondary',
    '& a': {
      color: '$primary',
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  }),
  LoginForm: styled('form', {
    width: '100%',
    maxWidth: '400px',
    padding: '$6',
    backgroundColor: '$surface',
    borderRadius: '$lg',
    boxShadow: '$md',
    '&:hover': {
      boxShadow: '$lg',
    },
    transition: 'box-shadow 0.2s ease-in-out',
  }),
  FormGroup: styled('div', {
    marginBottom: '$4',
    '& label': {
      display: 'block',
      marginBottom: '$2',
      fontWeight: 500,
      color: '$text',
    },
    '& input': {
      width: '100%',
      padding: '$2 $3',
      border: '1px solid $border',
      borderRadius: '$md',
      fontSize: '$base',
      backgroundColor: '$background',
      color: '$text',
      '&:focus': {
        outline: 'none',
        borderColor: '$primary',
        boxShadow: '0 0 0 2px $colors$primaryLight',
      },
      '&:disabled': {
        opacity: 0.7,
        cursor: 'not-allowed',
      },
    },
  }),
};

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await resetPassword(email);
      setMessage('If an account with that email exists, we have sent a password reset link.');
      setEmail('');
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <Title>Reset Password</Title>
        <p style={{ marginBottom: '1.5rem', color: '$textSecondary' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {message && <SuccessMessage>{message}</SuccessMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <FormGroup>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="email"
            autoFocus
          />
        </FormGroup>
        
        <Button 
          type="submit" 
          variant="primary" 
          disabled={isLoading}
          style={{ width: '100%' }}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>

        <FormFooter>
          <Link to="/login">Back to Login</Link>
        </FormFooter>
      </LoginForm>
    </LoginContainer>
  );
}
