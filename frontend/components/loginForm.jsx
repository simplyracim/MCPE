import React, { useState } from 'react';
import { styled } from '../styles/theme';
import { Button } from './ui/Button';

const Form = styled('form', {
  width: '100%',
  maxWidth: '400px',
  margin: '0 auto',
  padding: '$6',
  backgroundColor: '$surface',
  borderRadius: '$lg',
  boxShadow: '$md',
});

const FormGroup = styled('div', {
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
    '&:focus': {
      outline: 'none',
      borderColor: '$primary',
      boxShadow: '0 0 0 2px $colors$primaryLight',
    },
  },
});

const ErrorMessage = styled('div', {
  padding: '$2 $3',
  marginBottom: '$4',
  backgroundColor: '$errorBg',
  color: '$error',
  borderRadius: '$md',
  fontSize: '$sm',
});

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Implement actual login logic
      console.log('Login attempt with:', { email, password });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Navigate to home on success
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <FormGroup>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </FormGroup>

      <FormGroup>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </FormGroup>

      <Button 
        type="submit" 
        variant="primary" 
        disabled={isLoading}
        css={{ width: '100%', marginTop: '$4' }}
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </Button>
    </Form>
  );
};

export default LoginForm;
