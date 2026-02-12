import React from 'react';

const ProductCard = ({ product, getCategoryDisplay }) => {
  return (
    <div className="col-12 col-md-6 col-lg-3">
      <div className="product-card">
        <div className="product-image">
          <span className="category-tag">{getCategoryDisplay(product.category)}</span>
          <img src={product.image} alt={product.title} />
        </div>
        <div className="p-4">
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.35rem',
            fontWeight: 600,
            marginBottom: '12px',
            color: '#2C2C2C'
          }}>
            {product.title}
          </h3>
          <p style={{
            fontSize: '0.95rem',
            color: '#666',
            marginBottom: '20px',
            lineHeight: 1.6
          }}>
            {product.description}
          </p>
          <a href={product.affiliateLink} className="shop-btn">
            Check Price on Amazon
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
