import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { styled } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Input } from '../components/ui/Input';

const LoginContainer = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '$4',
  backgroundColor: '$background',
});

const Title = styled('h1', {
  fontSize: '$2xl',
  fontWeight: 'bold',
  marginBottom: '$6',
  color: '$text',
});

const FormFooter = styled('div', {
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
});

const LoginForm = styled('form', {
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
});

const ErrorMessage = styled('div', {
  padding: '$2 $3',
  marginBottom: '$4',
  backgroundColor: '$errorBg',
  color: '$error',
  borderRadius: '$md',
  fontSize: '$sm',
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError('Failed to log in. Please check your credentials and try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <Title>Welcome Back</Title>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <FormGroup>
          <label htmlFor="email">Email</label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            required
            autoComplete="email"
            autoFocus
          />
        </FormGroup>
        
        <FormGroup>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="password">Password</label>
            <Link 
              to="/forgot-password" 
              style={{ 
                fontSize: '0.875rem',
                color: 'var(--colors-primary)',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
            autoComplete="current-password"
          />
        </FormGroup>
        
        <Button 
          type="submit" 
          variant="primary" 
          disabled={isLoading}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>

        <FormFooter>
          Don't have an account?{' '}
          <Link to="/register">Sign up</Link>
        </FormFooter>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;
