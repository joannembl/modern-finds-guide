import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import ProductCard, { ProductImage } from "./ProductCard";
import { categories, seedProducts, filterProducts, safeUrl } from "./catalog";
import { backend, listProducts } from "./backend";
import Admin from "./Admin";
import "./styles.css";
const categoryNotes = [
  "For the road ahead",
  "A little more at home",
  "For your favorite companion",
  "Make everyday work better",
  "Ideas into things",
];
const symbols = ["↗", "⌂", "♡", "⌘", "✳"];
function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
    } else if (!location.search) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash, location.search]);
  return null;
}
function Header() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="announcement">
        A considered collection for everyday living.
      </div>
      <header>
        <Link to="/" className="brand" aria-label="Modern Finds Guide home">
          <span className="brand-mark">
            m<span>f</span>
          </span>
          <span>
            MODERN FINDS<small>G U I D E</small>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/#collection">Explore finds</Link>
          <Link to="/#categories">Categories</Link>
          <Link to="/#about">Our approach</Link>
        </nav>
        <Link className="nav-explore" to="/#collection">
          Find your next favorite <span aria-hidden="true">↗</span>
        </Link>
      </header>
    </>
  );
}
function Footer() {
  return (
    <footer>
      <div>
        <Link to="/" className="footer-brand">
          Modern Finds Guide.
        </Link>
        <p>Good finds. More thoughtful living.</p>
      </div>
      <div>
        <Link to="/#about">About the guide</Link>
        <Link to="/disclosure">Affiliate disclosure</Link>
        <Link to="/admin">Owner login</Link>
      </div>
      <p className="footer-disclosure">
        As an Amazon Associate I earn from qualifying purchases.
        <br />© {new Date().getFullYear()} Modern Finds Guide
      </p>
    </footer>
  );
}
function useCatalog() {
  const [products, setProducts] = useState(backend ? [] : seedProducts);
  const [loading, setLoading] = useState(!!backend);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    if (backend) {
      setLoading(true);
      listProducts()
        .then((data) => {
          if (live) {
            setProducts(data);
            setError("");
          }
        })
        .catch(() => {
          if (live)
            setError("We couldn’t load the collection. Please try again.");
        })
        .finally(() => {
          if (live) setLoading(false);
        });
    }
    return () => {
      live = false;
    };
  }, [revision]);
  return { products, loading, error, retry: () => setRevision((x) => x + 1) };
}
function Home() {
  const { products, loading, error, retry } = useCatalog();
  const { category: legacy } = useParams();
  const [params, setParams] = useSearchParams();
  const old = {
    "home-finds": "Home",
    "pet-essentials": "Pets",
    "everyday-gadgets": "Home",
  };
  const selected = params.get("category") || old[legacy] || "all";
  const query = params.get("q") || "";
  const sort = params.get("sort") || "curated";
  const visible = filterProducts(products, selected, query, sort);
  const featured = filterProducts(products, "all", "")
    .filter((p) => p.featured)
    .slice(0, 3);
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  useEffect(() => {
    if (window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, []);
  return (
    <main id="main">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="little-line" /> THE EVERYDAY, WELL CHOSEN
          </span>
          <h1>
            Little finds.
            <br />
            <em>Better everyday.</em>
          </h1>
          <p>
            Practical pieces, clever ideas, and small upgrades for the spaces
            and routines that make up your life.
          </p>
          <a className="button" href="#collection">
            Explore the collection <span aria-hidden="true">↗</span>
          </a>
          <div className="hero-note">
            Thoughtful picks. Useful details. No endless scrolling.
          </div>
        </div>
        <div className="hero-art">
          <div className="art-grid" />
          <div className="art-sun" />
          <div className="art-vase">
            <div />
          </div>
          <div className="art-book book-one" />
          <div className="art-book book-two" />
          <div className="art-lamp">
            <div />
          </div>
          <span className="art-caption">THE ART OF FINDING SOMETHING GOOD</span>
          <div className="art-label">
            Made for
            <br />
            <em>real life.</em>
            <span>THE MODERN FINDS EDIT</span>
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <span>Useful by design</span>
        <span>Room for every routine</span>
        <span>Chosen with care</span>
        <span>Always check current details on Amazon ↗</span>
      </div>
      <section id="categories" className="section categories-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIND YOUR CORNER</span>
            <h2>A good find for every day.</h2>
          </div>
          <p>From your morning drive to your next maker project.</p>
        </div>
        <div className="category-grid">
          {categories.map((c, i) => (
            <a
              key={c}
              href="#collection"
              onClick={() => update("category", c)}
              className="category-tile"
            >
              <span className="category-icon" aria-hidden="true">
                {symbols[i]}
              </span>
              <h3>{c}</h3>
              <p>{categoryNotes[i]}</p>
              <span className="category-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
      </section>
      {featured.length > 0 && (
        <section className="section featured-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE SHORTLIST</span>
              <h2>A few worth a closer look.</h2>
            </div>
            <a className="text-link" href="#collection">
              Browse all finds ↗
            </a>
          </div>
          <div className="product-grid">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
      <section className="section collection-section" id="collection">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE COLLECTION</span>
            <h2>Find something that fits.</h2>
          </div>
          <p>Start with a need. Stay for the possibilities.</p>
        </div>
        <div className="collection-tools">
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search finds"
              placeholder="Search products, ideas, or tags…"
              value={query}
              onChange={(e) => update("q", e.target.value)}
            />
          </label>
          <label className="sort">
            Sort by{" "}
            <select
              value={sort}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="curated">Guide order</option>
              <option value="az">Name: A–Z</option>
              <option value="newest">Newest first</option>
            </select>
          </label>
        </div>
        <div className="filter-tabs" aria-label="Filter by category">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              aria-pressed={selected === c}
              onClick={() => update("category", c)}
            >
              {c === "all" ? "All finds" : c}
            </button>
          ))}
        </div>
        <div className="results-note" aria-live="polite">
          {!loading &&
            !error &&
            `${visible.length} ${visible.length === 1 ? "find" : "finds"} in this collection`}
        </div>
        {loading ? (
          <div className="state" role="status">
            Gathering the good finds…
          </div>
        ) : error ? (
          <div className="state" role="alert">
            {error}
            <button onClick={retry}>Try again</button>
          </div>
        ) : visible.length ? (
          <div className="product-grid">
            {visible.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="state">
            <h3>
              {query
                ? "No finds match that search."
                : "This corner of the guide is growing."}
            </h3>
            <p>
              {query
                ? "Try a different word or browse the full collection."
                : "Check back for new recommendations, or explore our current finds."}
            </p>
            <button onClick={() => setParams({})}>Explore all finds</button>
          </div>
        )}
        <p className="disclosure-note">
          Some links are affiliate links. As an Amazon Associate I earn from
          qualifying purchases. <Link to="/disclosure">Learn more</Link>
        </p>
      </section>
      <section className="about" id="about">
        <div>
          <span className="eyebrow">WHY MODERN FINDS?</span>
          <h2>
            Less searching.
            <br />
            <em>More living.</em>
          </h2>
        </div>
        <div>
          <p className="about-lead">A little guidance goes a long way.</p>
          <p>
            Modern Finds Guide brings useful products into one considered
            collection—things for your home, your car, your pets, your
            workspace, and whatever you’re making next.
          </p>
          <p>
            We focus on practical uses and clear descriptions so you can decide
            what belongs in your everyday. Always check dimensions,
            compatibility, current pricing, and seller details before buying.
          </p>
          <Link className="text-link" to="/disclosure">
            How our affiliate links work ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
function Detail() {
  const { slug } = useParams();
  const { products, loading, error, retry } = useCatalog();
  const p = products.find((p) => p.published && p.slug === slug);
  useEffect(() => {
    if (!p) return;
    const previous = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.content;
    document.title = p.seo_title || `${p.title} | Modern Finds Guide`;
    if (meta) meta.content = p.seo_description || p.description;
    return () => {
      document.title = previous;
      if (meta) meta.content = previousDescription;
    };
  }, [p]);

  return (
    <main id="main" className="section detail">
      {loading ? (
        <div className="state" role="status">
          Loading this find…
        </div>
      ) : error ? (
        <div className="state" role="alert">
          {error}
          <button onClick={retry}>Try again</button>
        </div>
      ) : !p ? (
        <div className="state">
          <h1>Find unavailable</h1>
          <Link to="/">Back to the collection</Link>
        </div>
      ) : (
        <>
          <Link className="text-link" to="/#collection">
            ← Back to the collection
          </Link>
          <div className="detail-grid">
            <ProductImage product={p} />
            <div>
              <span className="eyebrow">{p.category}</span>
              <h1>{p.title}</h1>
              <p className="about-lead">{p.description}</p>
              {p.notes && (
                <div className="recommendation">
                  <h2>A closer look</h2>
                  <p>{p.notes}</p>
                </div>
              )}
              {!!p.key_features?.length && (
                <div className="recommendation">
                  <h2>Key features</h2>
                  <ul>
                    {p.key_features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="tags">
                {p.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              {safeUrl(p.affiliate_url, true) && (
                <a
                  className="button"
                  href={p.affiliate_url}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                >
                  {p.display_text || "View on Amazon"} ↗
                </a>
              )}
              <p className="disclosure-note">
                Affiliate link. As an Amazon Associate I earn from qualifying
                purchases. Check current price and availability on Amazon.
              </p>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
function Disclosure() {
  return (
    <main id="main" className="section prose">
      <span className="eyebrow">TRANSPARENCY MATTERS</span>
      <h1>About our affiliate links.</h1>
      <p>As an Amazon Associate I earn from qualifying purchases.</p>
      <p>
        When you follow an Amazon link on Modern Finds Guide and make a
        qualifying purchase, we may receive a commission. This helps support the
        guide at no additional cost to you.
      </p>
      <p>
        We share product descriptions and practical considerations. Unless
        explicitly stated, a listing does not mean we have personally tested the
        product. Product details, availability, sellers, and prices can change;
        verify them on Amazon before purchasing.
      </p>
      <p>
        Images belong to their respective owners. Product images should be used
        only with permission or in accordance with the applicable affiliate
        program terms.
      </p>
      <Link className="button" to="/">
        Explore the guide ↗
      </Link>
    </main>
  );
}
export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <BrowserRouter basename={base}>
      <ScrollManager />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:category" element={<Home />} />
        <Route path="/find/:slug" element={<Detail />} />
        <Route path="/disclosure" element={<Disclosure />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route
          path="*"
          element={
            <main id="main" className="state">
              <h1>Page not found</h1>
              <Link to="/">Explore the guide</Link>
            </main>
          }
        />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
