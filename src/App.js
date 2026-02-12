import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductCard from './ProductCard';
import productsData from './products.json';

const ModernFindsGuide = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const activeCategory = category || 'all';
  const products = productsData;

  // Scroll to top when category changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [category]);

  // Get unique categories from products
  const categories = ['🏠 Home Finds', '🐶 Pet Essentials', '☕ Kitchen & Coffee', '📱 Everyday Gadgets'];
  const allCategories = [...new Set(products.map(p => p.category))];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const getCategoryDisplay = (category) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleCategoryClick = (cat) => {
    if (cat === 'all') {
      navigate('/');
    } else {
      navigate(`/category/${cat}`);
    }
  };

  return (
    <div style={{ 
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: '#FFF8F0',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Bootstrap CSS */}
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
        rel="stylesheet"
      />
      <link 
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap" 
        rel="stylesheet"
      />

      {/* Decorative Background */}
      <div style={{
        position: 'fixed',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: '#8B9A7E',
        opacity: 0.05,
        top: '-200px',
        right: '-200px',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: '#D87750',
        opacity: 0.05,
        bottom: '-250px',
        left: '-250px',
        animation: 'float 25s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        
        .product-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: #FFFBF7;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          height: 100%;
        }
        
        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
        }
        
        /* Mobile: Remove hover effect, add tap effect */
        @media (hover: none) and (pointer: coarse) {
          .product-card:hover {
            transform: none;
          }
          .product-card:active {
            transform: scale(0.98);
          }
        }
        
        .product-image {
          position: relative;
          height: 320px;
          overflow: hidden;
          background: #FFF8F0;
        }
        
        /* Mobile: Adjust image height */
        @media (max-width: 768px) {
          .product-image {
            height: 250px;
          }
        }
        
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .product-card:hover .product-image img {
          transform: scale(1.05);
        }
        
        /* Mobile: Disable image zoom on hover */
        @media (hover: none) and (pointer: coarse) {
          .product-card:hover .product-image img {
            transform: none;
          }
        }
        
        .category-tag {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 6px 16px;
          background: #FFFBF7;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #8B9A7E;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        /* Mobile: Smaller tag */
        @media (max-width: 768px) {
          .category-tag {
            font-size: 0.7rem;
            padding: 4px 12px;
            top: 12px;
            right: 12px;
          }
        }
        
        .shop-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: #D87750;
          color: white;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.02em;
          border: none;
          width: 100%;
          justify-content: center;
        }
        
        /* Desktop: Back to inline width */
        @media (min-width: 769px) {
          .shop-btn {
            width: auto;
          }
        }
        
        .shop-btn:hover {
          background: #2C2C2C;
          transform: translateX(4px);
          color: white;
        }
        
        /* Mobile: Tap effect instead of hover */
        @media (hover: none) and (pointer: coarse) {
          .shop-btn:hover {
            transform: none;
          }
          .shop-btn:active {
            background: #2C2C2C;
            transform: scale(0.98);
          }
        }
        
        .filter-btn {
          padding: 14px 32px;
          border: 2px solid #8B9A7E;
          background: transparent;
          color: #2C2C2C;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          border-radius: 50px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.03em;
          position: relative;
          overflow: hidden;
          white-space: nowrap;
        }
        
        /* Mobile: Smaller filter buttons */
        @media (max-width: 768px) {
          .filter-btn {
            padding: 10px 20px;
            font-size: 0.85rem;
          }
        }
        
        /* Mobile: Better touch targets */
        @media (hover: none) and (pointer: coarse) {
          .filter-btn {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        .filter-btn:hover {
          background: #8B9A7E;
          color: #FFFBF7;
        }
        
        .filter-btn.active {
          background: #8B9A7E;
          color: #FFFBF7;
        }
        
        /* Mobile: Tap effect */
        @media (hover: none) and (pointer: coarse) {
          .filter-btn:hover {
            background: transparent;
            color: #2C2C2C;
          }
          .filter-btn:active {
            background: #8B9A7E;
            color: #FFFBF7;
            transform: scale(0.95);
          }
          .filter-btn.active:hover {
            background: #8B9A7E;
            color: #FFFBF7;
          }
        }
        
        /* Mobile: Improve text readability */
        @media (max-width: 768px) {
          body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }
        
        /* Mobile: Prevent horizontal scroll */
        @media (max-width: 768px) {
          html, body {
            overflow-x: hidden;
            width: 100%;
          }
        }
        
        /* Mobile: Better spacing */
        @media (max-width: 768px) {
          .container {
            padding: 0 16px;
          }
        }
      `}</style>

      <div className="container py-5" style={{ position: 'relative', zIndex: 1, maxWidth: '1400px' }}>
        {/* Header */}
        <header className="text-center mb-5" style={{ padding: '0 8px' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 8vw, 4rem)',
            fontWeight: 700,
            color: '#2C2C2C',
            marginBottom: '16px',
            letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}>
            Modern Finds Guide
          </h1>
          <p style={{
            fontSize: 'clamp(0.9rem, 3vw, 1.25rem)',
            color: '#8B9A7E',
            fontWeight: 300,
            letterSpacing: '0.05em',
            marginBottom: '8px'
          }}>
            Curated Amazon finds for modern living
          </p>
          <p style={{
            fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
            color: '#8B9A7E',
            opacity: 0.7
          }}>
            As an Amazon Associate, I earn from qualifying purchases.
          </p>
        </header>

        {/* Category Filter */}
        <div className="d-flex justify-content-center flex-wrap gap-3 mb-5">
          <button 
            className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('all')}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {getCategoryDisplay(cat)}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="row g-4 mb-5">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              getCategoryDisplay={getCategoryDisplay}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Wrapper component with Router
const App = () => {
  return (
    <BrowserRouter basename="/modern-finds-guide">
      <Routes>
        <Route path="/" element={<ModernFindsGuide />} />
        <Route path="/category/:category" element={<ModernFindsGuide />} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;
