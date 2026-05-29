import React from 'react';
import logoImg from '../assets/galgotias_logo.png';

export default function GalgotiasLogo({ className = "w-10 h-10" }) {
  return (
    <img 
      src={logoImg} 
      alt="Galgotias University Logo" 
      className={`${className} object-contain`} 
    />
  );
}
