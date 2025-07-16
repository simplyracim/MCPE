import React, { useState, useEffect } from 'react';
import { styled } from '../styles/theme';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { cn } from '../lib/utils';

const LayoutContainer = styled('div', {
  display: 'flex',
  minHeight: '100vh',
  flexDirection: 'column',
  backgroundColor: '$background',
  position: 'relative',
  overflowX: 'hidden',
});

const ContentWrapper = styled('div', {
  display: 'flex',
  flex: 1,
  position: 'relative',
  paddingTop: '64px',
  '@md': {
    paddingTop: 0,
  },
});

const MainContent = styled('main', {
  flex: 1,
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 'calc(100vh - 64px)',
  marginLeft: '250px',
  transition: 'margin-left 0.3s ease-in-out',
  width: 'calc(100% - 250px)',
  '@md': {
    padding: '1.5rem',
    marginLeft: '80px',
    width: 'calc(100% - 80px)',
  },
  '&.collapsed': {
    marginLeft: '80px',
    width: 'calc(100% - 80px)',
  },
  '&.expanded': {
    marginLeft: '250px',
    width: 'calc(100% - 250px)',
  },
});

export const Layout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Listen for window resize to handle mobile view
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768; // Tailwind's md breakpoint
      if (isMobile) {
        setIsSidebarCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <LayoutContainer>
      <ContentWrapper>
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
        <MainContent className={cn(
          isSidebarCollapsed ? 'collapsed' : 'expanded'
        )}>
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <Footer />
        </MainContent>
      </ContentWrapper>
    </LayoutContainer>
  );
};

export default Layout;
