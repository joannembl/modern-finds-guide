import React, { useState } from "react";
import { Link } from "react-router-dom";
import { safeUrl } from "./catalog";
export function ProductImage({ product }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="product-image">
      {product.image_url && safeUrl(product.image_url) && !failed ? (
        <img
          src={product.image_url}
          alt={product.title}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="image-placeholder">
          <span>M / F</span>
          <small>{product.category}</small>
        </div>
      )}
    </div>
  );
}
export default function ProductCard({ product, index }) {
  return (
    <article className="product-card">
      <Link to={`/find/${product.slug}`} className="image-link">
        <ProductImage product={product} />
        <span className="card-number">
          {String(index + 1).padStart(2, "0")}
        </span>
      </Link>
      <div className="card-content">
        <span className="eyebrow">{product.category}</span>
        <h3>
          <Link to={`/find/${product.slug}`}>{product.title}</Link>
        </h3>
        <p>{product.description}</p>
        <div className="card-links">
          <Link to={`/find/${product.slug}`}>
            The details <span aria-hidden="true">↗</span>
          </Link>
          {safeUrl(product.affiliate_url, true) && (
            <a
              href={product.affiliate_url}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              {product.display_text || "View on Amazon"}{" "}
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
