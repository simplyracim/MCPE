import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

// Styled components
const Container = styled('div', {
  padding: '2rem',
  maxWidth: '1200px',
  margin: '0 auto',
});

const Header = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  gap: '1rem',
});

const Title = styled('h1', {
  fontSize: '1.875rem',
  fontWeight: 'bold',
  color: '$text',
  margin: 0,
});

const TableContainer = styled('div', {
  backgroundColor: '$surface',
  borderRadius: '0.5rem',
  boxShadow: '$md',
  overflow: 'hidden',
});

const Table = styled('table', {
  width: '100%',
  borderCollapse: 'collapse',
  '& th, & td': {
    padding: '1rem',
    textAlign: 'left',
    borderBottom: '1px solid $border',
  },
  '& th': {
    backgroundColor: '$background',
    fontWeight: 600,
    color: '$text',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
  },
  '& tr:last-child td': {
    borderBottom: 'none',
  },
  '& tr:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
});

const StatusBadge = styled('span', {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.25rem 0.75rem',
  borderRadius: '9999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  variants: {
    variant: {
      active: {
        backgroundColor: '$successLight',
        color: '$success',
      },
      inactive: {
        backgroundColor: '$errorLight',
        color: '$error',
      },
      admin: {
        backgroundColor: '$primaryLight',
        color: '$primary',
      },
    },
  },
});

const ActionButton = styled('button', {
  padding: '0.5rem 1rem',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s ease-in-out',
  '& + &': {
    marginLeft: '0.5rem',
  },
  variants: {
    variant: {
      edit: {
        backgroundColor: '$primary',
        color: 'white',
        '&:hover': {
          backgroundColor: '$primaryDark',
        },
      },
      delete: {
        backgroundColor: '$error',
        color: 'white',
        '&:hover': {
          backgroundColor: '$errorDark',
        },
      },
    },
  },
});

const Loading = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem',
  color: '$textSecondary',
});

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (id) => {
    navigate(`/employees/${id}/edit`);
  };

  const handleCreate = () => {
    navigate('/employees/new');
  };

  if (loading) {
    return <Loading>Loading employees...</Loading>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Container>
      <Header>
        <Title>Employees</Title>
        <Button 
          onClick={handleCreate}
          variant="primary"
          disabled={!user?.is_admin}
          title={!user?.is_admin ? 'Admin access required' : 'Add new employee'}
        >
          Add Employee
        </Button>
      </Header>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.name}</td>
                <td>{employee.role_title || 'No role assigned'}</td>
                <td>
                  {employee.is_admin ? (
                    <StatusBadge variant="admin">Admin</StatusBadge>
                  ) : (
                    <StatusBadge variant="active">Active</StatusBadge>
                  )}
                </td>
                <td>
                  <ActionButton 
                    variant="edit" 
                    onClick={() => handleEdit(employee.id)}
                    disabled={!user?.is_admin}
                  >
                    Edit
                  </ActionButton>
                  <ActionButton 
                    variant="delete" 
                    onClick={() => handleDelete(employee.id)}
                    disabled={!user?.is_admin}
                  >
                    Delete
                  </ActionButton>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Employees;
