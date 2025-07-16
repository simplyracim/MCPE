import React from 'react';
import { styled } from '../styles/theme';
import { Button } from './ui/Button';
import { Menu, X, Bell, User, Settings as SettingsIcon } from 'lucide-react';

const HeaderContainer = styled('header', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 1.5rem',
  backgroundColor: '$surface',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  position: 'fixed',
  top: 0,
  right: 0,
  left: '250px',
  height: '64px',
  zIndex: 50,
  '@md': {
    padding: '1rem 1.5rem',
  },
});

const Logo = styled('div', {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '$primary',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

const Nav = styled('nav', {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center',
  '@sm': {
    gap: '0.5rem',
  },
});

const IconButton = styled(Button, {
  padding: '0.5rem',
  borderRadius: '50%',
  width: '2.5rem',
  height: '2.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});

export const Header = () => {
  return (
    <HeaderContainer>
      <Logo>
        <span>MCPE</span>
      </Logo>
      
      <Nav>
        <IconButton variant="ghost" size="sm" aria-label="Notifications">
          <Bell size={20} />
        </IconButton>
        <IconButton variant="ghost" size="sm" aria-label="Settings">
          <SettingsIcon size={20} />
        </IconButton>
        <IconButton variant="ghost" size="sm" aria-label="User profile">
          <User size={20} />
        </IconButton>
        <Button variant="ghost" size="sm">
          Settings
        </Button>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;
