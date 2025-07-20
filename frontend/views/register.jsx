import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { styled } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Input } from '../components/ui/Input';

// Reuse styled components from login.jsx
const { 
  LoginContainer, 
  Title, 
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

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const success = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      if (success) {
        toast.success('Registration successful! Please log in.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit}>
        <Title>Create an Account</Title>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <FormGroup>
          <label htmlFor="name">Full Name</label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
            required
            autoComplete="name"
            autoFocus
          />
          {errors.name && <small style={{ color: 'var(--colors-error)' }}>{errors.name}</small>}
        </FormGroup>
        
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
          />
          {errors.email && <small style={{ color: 'var(--colors-error)' }}>{errors.email}</small>}
        </FormGroup>
        
        <FormGroup>
          <label htmlFor="password">Password</label>
          <Input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
            autoComplete="new-password"
          />
          {errors.password && <small style={{ color: 'var(--colors-error)' }}>{errors.password}</small>}
        </FormGroup>
        
        <FormGroup>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <Input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            required
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <small style={{ color: 'var(--colors-error)' }}>{errors.confirmPassword}</small>
          )}
        </FormGroup>
        
        <Button 
          type="submit" 
          variant="primary" 
          disabled={isLoading}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>

        <FormFooter>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </FormFooter>
      </LoginForm>
    </LoginContainer>
  );
}
