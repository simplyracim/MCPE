import React from 'react';
import { styled } from '../styles/theme';

const FooterContainer = styled('footer', {
  padding: '1.5rem',
  marginTop: '2rem',
  borderTop: '1px solid $border',
  backgroundColor: '$surface',
  textAlign: 'center',
  color: '$textSecondary',
  fontSize: '0.875rem',
  '& a': {
    color: '$primary',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <div>© {currentYear} MCPE. All rights reserved.</div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
        <a href="/privacy">Privacy Policy</a> | 
        <a href="/terms">Terms of Service</a> | 
        <a href="/contact">Contact Us</a>
      </div>
    </FooterContainer>
  );
};

export default Footer;
