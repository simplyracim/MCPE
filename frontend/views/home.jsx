import React from 'react';
import { styled } from '../styles/theme';
import { Button } from '../components/ui/Button';

const HeroSection = styled('section', {
  padding: '$10 0',
  backgroundColor: '$surface',
  borderRadius: '$lg',
  marginBottom: '$8',
  textAlign: 'center',
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

const EmployeeTable = styled('div', {
  marginTop: '$8',
  backgroundColor: '$surface',
  borderRadius: '$lg',
  overflow: 'hidden',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
});

const Table = styled('table', {
  width: '100%',
  borderCollapse: 'collapse',
});

const TableHeader = styled('thead', {
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  borderBottom: '1px solid $border',
});

const TableHeaderCell = styled('th', {
  padding: '$3 $4',
  textAlign: 'left',
  fontWeight: 600,
  color: '$textLight',
  fontSize: '$sm',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

const TableRow = styled('tr', {
  borderBottom: '1px solid $border',
  '&:last-child': {
    borderBottom: 'none',
  },
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
  },
});

const TableCell = styled('td', {
  padding: '$3 $4',
  color: '$text',
  fontSize: '$base',
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

  // Mock employee data - in a real app, this would come from an API
  const employees = [
    { id: 1, name: 'John Doe', role: 'Software Engineer' },
    { id: 2, name: 'Jane Smith', role: 'Product Manager' },
    { id: 3, name: 'Bob Johnson', role: 'UX Designer' },
  ];

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

      <EmployeeTable>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          <tbody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </EmployeeTable>
    </>
  );
}
