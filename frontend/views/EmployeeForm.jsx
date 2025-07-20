import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { styled } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

// Reuse styled components from employees.jsx
const { 
  Container,
  Title,
  FormGroup,
  ErrorMessage,
  FormFooter,
  Form: StyledForm,
  FormRow,
  FormLabel,
  FormInput,
  FormSelect,
  FormActions
} = {
  Container: styled('div', {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
  }),
  Title: styled('h1', {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
    color: '$text',
  }),
  Form: styled('form', {
    backgroundColor: '$surface',
    borderRadius: '0.5rem',
    padding: '2rem',
    boxShadow: '$md',
  }),
  FormGroup: styled('div', {
    marginBottom: '1.5rem',
  }),
  FormRow: styled('div', {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '1rem',
    '@md': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  }),
  FormLabel: styled('label', {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 500,
    color: '$text',
    '&.required:after': {
      content: '"*"',
      color: '$error',
      marginLeft: '0.25rem',
    },
  }),
  FormInput: styled('input', {
    width: '100%',
    padding: '0.625rem',
    border: '1px solid $border',
    borderRadius: '0.375rem',
    fontSize: '1rem',
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
  }),
  FormSelect: styled('select', {
    width: '100%',
    padding: '0.625rem',
    border: '1px solid $border',
    borderRadius: '0.375rem',
    fontSize: '1rem',
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
  }),
  FormActions: styled('div', {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid $border',
  }),
  ErrorMessage: styled('div', {
    color: '$error',
    marginTop: '0.5rem',
    fontSize: '0.875rem',
  }),
};

const EmployeeForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    role_id: '',
    is_admin: false,
  });
  
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/roles', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch roles');
        }
        
        const data = await response.json();
        setRoles(data);
        
        // Set default role if available
        if (data.length > 0 && !isEditMode) {
          setFormData(prev => ({
            ...prev,
            role_id: data[0].id.toString()
          }));
        }
      } catch (err) {
        toast.error('Failed to load roles');
        console.error(err);
      }
    };

    fetchRoles();
  }, [isEditMode]);

  // Fetch employee data if in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchEmployee = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/employees/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch employee');
        }
        
        const data = await response.json();
        setFormData({
          name: data.name,
          role_id: data.role_id ? data.role_id.toString() : '',
          is_admin: Boolean(data.is_admin),
        });
      } catch (err) {
        toast.error('Failed to load employee data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.role_id) {
      newErrors.role_id = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      const url = isEditMode 
        ? `http://localhost:4000/api/employees/${id}`
        : 'http://localhost:4000/api/employees';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          is_admin: formData.is_admin ? 1 : 0
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save employee');
      }
      
      toast.success(`Employee ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate('/employees');
    } catch (err) {
      toast.error(err.message || 'An error occurred');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check if user has permission to edit
  if (!user?.is_admin) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to {isEditMode ? 'edit' : 'create'} employees.</p>
          <Button onClick={() => navigate('/employees')} variant="primary">
            Back to Employees
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</Title>
      
      <StyledForm onSubmit={handleSubmit}>
        <FormGroup>
          <FormLabel className="required" htmlFor="name">Full Name</FormLabel>
          <FormInput
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={submitting}
            placeholder="Enter employee's full name"
          />
          {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
        </FormGroup>
        
        <FormRow>
          <FormGroup>
            <FormLabel className="required" htmlFor="role_id">Role</FormLabel>
            <FormSelect
              id="role_id"
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              disabled={submitting || roles.length === 0}
            >
              {roles.length === 0 ? (
                <option value="">Loading roles...</option>
              ) : (
                roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))
              )}
            </FormSelect>
            {errors.role_id && <ErrorMessage>{errors.role_id}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
              <input
                type="checkbox"
                id="is_admin"
                name="is_admin"
                checked={formData.is_admin}
                onChange={handleChange}
                disabled={submitting}
                style={{
                  marginRight: '0.5rem',
                  width: '1.25rem',
                  height: '1.25rem',
                }}
              />
              <FormLabel htmlFor="is_admin" style={{ marginBottom: 0 }}>
                Administrator
              </FormLabel>
            </div>
            <div style={{ fontSize: '0.875rem', color: '$textSecondary', marginTop: '0.25rem' }}>
              Administrators have full access to the system
            </div>
          </FormGroup>
        </FormRow>
        
        <FormActions>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => navigate('/employees')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={submitting}
          >
            {submitting 
              ? (isEditMode ? 'Updating...' : 'Creating...')
              : (isEditMode ? 'Update Employee' : 'Create Employee')
            }
          </Button>
        </FormActions>
      </StyledForm>
    </Container>
  );
};

export default EmployeeForm;
