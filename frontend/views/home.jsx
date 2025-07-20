import React from 'react';
import { styled } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const HeroSection = styled('section', {
  padding: '$10 0',
  backgroundColor: '$surface',
  borderRadius: '$lg',
  marginBottom: '$8',
  textAlign: 'center',
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

const Title = styled('h1', {
  fontSize: '$4xl',
  fontWeight: 800,
  marginBottom: '$4',
  color: '$text',
  lineHeight: 1.2,
  '@sm': {
    fontSize: '$5xl',
  },
});

const Subtitle = styled('p', {
  fontSize: '$xl',
  color: '$textLight',
  maxWidth: '600px',
  margin: '0 auto $8',
  lineHeight: 1.6,
});

const ButtonGroup = styled('div', {
  display: 'flex',
  gap: '$3',
  justifyContent: 'center',
  flexWrap: 'wrap',
});

const FeaturesGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '$6',
  marginTop: '$12',
  '@md': {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
});

const FeatureCard = styled('div', {
  backgroundColor: '$surface',
  padding: '$6',
  borderRadius: '$lg',
  border: '1px solid $border',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
});

const FeatureIcon = styled('div', {
  width: '48px',
  height: '48px',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderRadius: '$md',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '$4',
  color: '$primary',
  fontSize: '24px',
});

const FeatureTitle = styled('h3', {
  fontSize: '$xl',
  fontWeight: 600,
  marginBottom: '$2',
  color: '$text',
});

const FeatureDescription = styled('p', {
  color: '$textLight',
  lineHeight: 1.6,
});

export default function Home() {
  const features = [
    {
      title: 'Easy to Use',
      description: 'Intuitive interface that makes managing your employees a breeze.',
      icon: '👋',
    },
    {
      title: 'Powerful Features',
      description: 'All the tools you need to efficiently manage your team.',
      icon: '⚡',
    },
    {
      title: 'Secure & Reliable',
      description: 'Your data is always safe and accessible when you need it.',
      icon: '🔒',
    },
  ];

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <>
      <HeroSection>
        <Title>Welcome to MCPE</Title>
        <Subtitle>
          A modern platform for managing your employees with ease and efficiency.
          Get started today and streamline your HR processes.
        </Subtitle>
        <ButtonGroup>
          <Button variant="primary" size="lg">
            Get Started
          </Button>
          <Button variant="secondary" size="lg">
            Learn More
          </Button>
        </ButtonGroup>
      </HeroSection>

      <FeaturesGrid>
        {features.map((feature, index) => (
          <FeatureCard key={index}>
            <FeatureIcon>{feature.icon}</FeatureIcon>
            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
          </FeatureCard>
        ))}
      </FeaturesGrid>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
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
    </>
  );
}
