import React, { useState, useEffect } from 'react';
import { styled } from '../styles/theme';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home,
  BarChart2,
  FilePlus,
  Folder,
  Users,
  Calendar,
  HelpCircle,
  Mail,
  Settings as SettingsIcon
} from 'lucide-react';

const SidebarContainer = styled('aside', {
  width: '250px',
  height: '100vh',
  backgroundColor: '$surface',
  borderRight: '1px solid $border',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 40,
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '$border',
    borderRadius: '4px',
  },
});

const Logo = styled('div', {
  padding: '1.25rem 1.5rem',
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '$primary',
  borderBottom: '1px solid $border',
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  position: 'sticky',
  top: 0,
  backgroundColor: '$surface',
  zIndex: 10,
});

const Nav = styled('nav', {
  padding: '1rem 0',
});

const NavSection = styled('div', {
  marginBottom: '0.5rem',
  '&:last-child': {
    marginBottom: 0,
  },
});

const NavSectionTitle = styled('div', {
  padding: '0.5rem 1.5rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '$textSecondary',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.5rem',
});

const NavItem = styled(NavLink, {
  display: 'flex',
  alignItems: 'center',
  padding: '0.75rem 1.5rem',
  color: '$textSecondary',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  position: 'relative',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    color: '$text',
    '& svg': {
      color: '$primary',
    },
  },
  '&.active': {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '$primary',
    fontWeight: 500,
    '&:before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '3px',
      backgroundColor: '$primary',
      borderRadius: '0 3px 3px 0',
    },
    '& svg': {
      color: '$primary',
    },
  },
});

const NavIcon = styled('span', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  marginRight: '12px',
  color: '$textSecondary',
  transition: 'color 0.2s ease',
});

const NavText = styled('span', {
  flex: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const navItems = [
  {
    title: 'Main',
    items: [
      { icon: <Home size={18} />, text: 'Dashboard', to: '/' },
      { icon: <BarChart2 size={18} />, text: 'Analytics', to: '/analytics' },
      { icon: <FilePlus size={18} />, text: 'New Project', to: '/projects/new' },
      { icon: <Folder size={18} />, text: 'All Projects', to: '/projects' },
      { icon: <Users size={18} />, text: 'Team', to: '/team' },
      { icon: <Calendar size={18} />, text: 'Calendar', to: '/calendar' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: <HelpCircle size={18} />, text: 'Help Center', to: '/help' },
      { icon: <Mail size={18} />, text: 'Contact Us', to: '/contact' },
      { icon: <SettingsIcon size={18} />, text: 'Settings', to: '/settings' },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <SidebarContainer>
        <Logo>MCPE</Logo>
        <Nav>
          {navItems.map((section, index) => (
            <NavSection key={index}>
              <NavSectionTitle>{section.title}</NavSectionTitle>
              {section.items.map((item, itemIndex) => (
                <NavItem 
                  key={itemIndex}
                  to={item.to}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  end
                >
                  <NavIcon>{item.icon}</NavIcon>
                  <NavText>{item.text}</NavText>
                </NavItem>
              ))}
            </NavSection>
          ))}
        </Nav>
    </SidebarContainer>
  );
};

export default Sidebar;
