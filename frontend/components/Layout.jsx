import React from 'react';
import { styled } from '../styles/theme';
import Sidebar from './Sidebar';
import Footer from './Footer';

const LayoutContainer = styled('div', {
  display: 'flex',
  minHeight: '100vh',
  flexDirection: 'column',
  backgroundColor: '$background',
  position: 'relative',
});

const ContentWrapper = styled('div', {
  display: 'flex',
  flex: 1,
  position: 'relative',
});

const MainContent = styled('main', {
  flex: 1,
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  marginLeft: '250px',
  '@md': {
    padding: '1.5rem',
  },
});

export const Layout = ({ children }) => {
  return (
    <LayoutContainer>
      <ContentWrapper>
        <Sidebar />
        <MainContent>
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
