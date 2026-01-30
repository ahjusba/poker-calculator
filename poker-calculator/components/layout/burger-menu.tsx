'use client';

import { useState } from 'react';
import { slide as Menu } from 'react-burger-menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './burger-menu.css';

export function BurgerMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: '/', label: 'Submit', icon: '🏠' },
    { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { href: '/add-player', label: 'Add Player', icon: '➕' },
    { href: '/stats', label: 'Stats', icon: '📊' },
    { href: '/live', label: 'Live Session', icon: '🎮' },
    { href: '/info', label: 'Info', icon: 'ℹ️' },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <Menu 
      right 
      isOpen={isOpen}
      onStateChange={(state) => setIsOpen(state.isOpen)}
    >
      {menuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`menu-item ${pathname === item.href ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <span className="menu-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </Menu>
  );
}
