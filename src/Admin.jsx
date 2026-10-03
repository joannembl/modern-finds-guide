import React, { useEffect, useState, useRef } from "react";
import { backend, listProducts, saveProduct, removeProduct } from "./backend";
import { categories, slugify, validateProduct } from "./catalog";
import Automation from "./Automation";
const blank = () => ({
  title: "",
  slug: "",
  category: "Home",
  description: "",
  notes: "",
  image_url: "",
  affiliate_url: "",
  display_text: "Check price on Amazon",
  tags: [],
  featured: false,
  published: false,
  sort_order: 0,
});
function DeleteDialog({ children, busy, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirmation"
      aria-labelledby="delete-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      {children}
    </dialog>
  );
}
export default function Admin() {
  const [studio, setStudio] = useState(false);
  const [requested, setRequested] = useState(null);
  const [user, setUser] = useState(null);
  const accountId = useRef(null);
  const [authLoading, setAuthLoading] = useState(!!backend);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    if (!backend) return;
    let live = true;
    const applyUser = (nextUser) => {
      if (!live) return;
      const nextId = nextUser?.id || null;
      // Session recovery and token refresh can repeat for the same account.
      // Only an account change should discard private editor state.
      if (accountId.current !== nextId) {
        accountId.current = nextId;
        setAdmin(false);
        setProducts([]);
        setEditor(null);
        setDirty(false);
        setDeleting(null);
        setStudio(false);
        setRequested(null);
      }
      setUser((previous) =>
        previous?.id === nextUser?.id ? previous : nextUser,
      );
    };
    backend.auth
      .getUser()
      .then(({ data }) => {
        if (live) {
          applyUser(data.user);
          setAuthLoading(false);
        }
      })
      .catch(() => {
        if (live) {
          setError("Could not check your session. Reload to try again.");
          setAuthLoading(false);
        }
      });
    const { data } = backend.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user || null);
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const protect = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [dirty]);
  useEffect(() => {
    if (!user) return;
    let live = true;
    setLoading(true);
    setError("");
    backend
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (error) throw error;
        if (!data)
          throw new Error(
            "This account does not have owner access. Ask the owner to authorize it in Supabase.",
          );
        const rows = await listProducts();
        if (live) {
          setAdmin(true);
          setProducts(rows);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [user?.id]);
  const openEditor = (p) => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    setEditor(p);
    setDirty(false);
    setNotice("");
    setError("");
  };
  const field = (key, value) => {
    setEditor((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };
  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await backend.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setPassword("");
    } catch {
      setError(
        "Unable to sign in. Check your email and password, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    const validation = validateProduct(editor);
    if (validation) {
      setError(validation);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const p = await saveProduct({
        ...editor,
        title: editor.title.trim(),
        sort_order: Number(editor.sort_order),
        tags: editor.tags.map((t) => t.trim()).filter(Boolean),
      });
      setProducts((prev) =>
        [...prev.filter((x) => x.id !== p.id), p].sort(
          (a, b) => a.sort_order - b.sort_order,
        ),
      );
      setEditor(null);
      setDirty(false);
      setNotice(
        "Product saved. Published changes are now available on the public site.",
      );
    } catch (e) {
      setError(`Could not save the product: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }
  async function destroy() {
    setBusy(true);
    setError("");
    try {
      await removeProduct(deleting.id);
      setProducts((p) => p.filter((x) => x.id !== deleting.id));
      setDeleting(null);
      setNotice("Product deleted.");
    } catch (e) {
      setError(`Could not delete: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }
  async function signout() {
    if (dirty && !window.confirm("Discard unsaved changes and sign out?"))
      return;
    setBusy(true);
    const { error } = await backend.auth.signOut();
    if (error) setError(error.message);
    else {
      setUser(null);
      setAdmin(false);
      setEditor(null);
      setDirty(false);
      setError("");
    }
    setBusy(false);
  }
  return (
    <main id="main" className="section admin">
      <div className="section-heading">
        <div>
          <span className="eyebrow">OWNER STUDIO</span>
          <h1>Your guide, thoughtfully managed.</h1>
        </div>
        {user && (
          <button disabled={busy} onClick={signout}>
            Sign out
          </button>
        )}
      </div>
      <div aria-live="polite">
        {error && (
          <div role="alert" className="alert error">
            {error}
          </div>
        )}
        {notice && (
          <div className="alert success" role="status">
            {notice}
          </div>
        )}
      </div>
      {!backend ? (
        <div className="setup-card">
          <h2>Your owner studio is ready to connect.</h2>
          <p>
            Secure product management needs the Supabase configuration. Public
            browsing currently shows the five existing recommendations.
          </p>
          <ol>
            <li>
              Create a dedicated Supabase project and apply the included
              database setup.
            </li>
            <li>Create the owner account and authorize its user ID.</li>
            <li>
              Add the project URL and publishable key to the frontend
              environment, then rebuild.
            </li>
          </ol>
          <p>
            See the repository’s <strong>SETUP.md</strong> for the full
            checklist.
          </p>
        </div>
      ) : authLoading ? (
        <div className="state" role="status">
          Checking your session…
        </div>
      ) : !user ? (
        <form className="login-card" onSubmit={login}>
          <h2>Welcome back.</h2>
          <p>Sign in to curate your collection.</p>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="button" disabled={busy}>
            {busy ? "Signing in…" : "Sign in to owner studio →"}
          </button>
          <p className="muted">
            Accounts are created by the owner. To reset your password, use your
            Supabase account-management tools.
          </p>
        </form>
      ) : loading ? (
        <div className="state" role="status">
          Loading your studio…
        </div>
      ) : admin ? (
        <>
          <div className="studio-nav">
            <button
              aria-pressed={!studio}
              onClick={() => {
                if (!dirty || window.confirm("Discard unsaved changes?")) {
                  setStudio(false);
                  setEditor(null);
                  setDirty(false);
                }
              }}
            >
              Products
            </button>
            <button
              aria-pressed={studio}
              onClick={() => {
                if (!dirty || window.confirm("Discard unsaved changes?")) {
                  setStudio(true);
                  setEditor(null);
                  setDirty(false);
                }
              }}
            >
              Automation / Content Queue
            </button>
          </div>
          {studio ? (
            <Automation
              products={products}
              onProducts={setProducts}
              requested={requested}
              onConsumed={() => setRequested(null)}
            />
          ) : editor ? (
            <form onSubmit={save} className="editor">
              <div className="section-heading">
                <h2>{editor.id ? "Edit find" : "Add a new find"}</h2>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openEditor(null)}
                >
                  Cancel
                </button>
              </div>
              <div className="form-grid">
                <label>
                  Product title
                  <input
                    required
                    maxLength={200}
                    value={editor.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setEditor((p) => ({
                        ...p,
                        title,
                        slug: p.id ? p.slug : slugify(title),
                      }));
                      setDirty(true);
                    }}
                  />
                </label>
                <label>
                  URL slug
                  <input
                    required
                    value={editor.slug}
                    onChange={(e) => field("slug", e.target.value)}
                  />
                </label>
                <label>
                  Category
                  <select
                    aria-label="Category"
                    value={editor.category}
                    onChange={(e) => field("category", e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Sort order (lower appears first)
                  <input
                    type="number"
                    step="1"
                    required
                    value={editor.sort_order}
                    onChange={(e) => field("sort_order", e.target.value)}
                  />
                </label>
                <label className="wide">
                  Short description
                  <textarea
                    required
                    maxLength={600}
                    value={editor.description}
                    onChange={(e) => field("description", e.target.value)}
                  />
                </label>
                <label className="wide">
                  Recommendation / practical notes
                  <textarea
                    rows="5"
                    value={editor.notes}
                    onChange={(e) => field("notes", e.target.value)}
                  />
                </label>
                <label>
                  Image URL (HTTPS)
                  <input
                    type="url"
                    value={editor.image_url}
                    onChange={(e) => field("image_url", e.target.value)}
                  />
                  <small>Use an image you own or have permission to use.</small>
                </label>
                <label>
                  Amazon affiliate URL
                  <input
                    type="url"
                    required
                    value={editor.affiliate_url}
                    onChange={(e) => field("affiliate_url", e.target.value)}
                  />
                </label>
                <label>
                  Button display text
                  <input
                    maxLength={80}
                    value={editor.display_text}
                    onChange={(e) => field("display_text", e.target.value)}
                  />
                </label>
                <label>
                  Tags (comma separated)
                  <input
                    value={editor.tags.join(",")}
                    onChange={(e) => field("tags", e.target.value.split(","))}
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={editor.featured}
                    onChange={(e) => field("featured", e.target.checked)}
                  />
                  Featured on the homepage
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={editor.published}
                    onChange={(e) => field("published", e.target.checked)}
                  />
                  Published and visible to visitors
                </label>
              </div>
              <div className="editor-actions">
                <button className="button" disabled={busy}>
                  {busy ? "Saving…" : "Save find →"}
                </button>
                <span className="muted">
                  {dirty
                    ? "You have unsaved changes."
                    : "Changes are saved only when you choose Save."}
                </span>
              </div>
            </form>
          ) : (
            <>
              <div className="collection-tools">
                <label className="search">
                  <input
                    type="search"
                    aria-label="Search managed products"
                    placeholder="Search your products…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <button className="button" onClick={() => openEditor(blank())}>
                  Add a find +
                </button>
              </div>
              <p className="muted">
                {products.length} products · Edit a product to change its order,
                feature it, or publish it.
              </p>
              <div className="admin-list">
                {products
                  .filter((p) =>
                    p.title.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((p) => (
                    <article key={p.id}>
                      <div>
                        <span className="eyebrow">
                          {p.category} · Order {p.sort_order}
                        </span>
                        <h3>{p.title}</h3>
                        <span className={`status ${p.published ? "live" : ""}`}>
                          {p.published ? "Published" : "Draft"}
                        </span>
                        {p.featured && <span className="status">Featured</span>}
                      </div>
                      <div className="row-actions">
                        <button
                          onClick={() => {
                            setRequested(p.id);
                            setStudio(true);
                          }}
                        >
                          Generate Content Pack
                        </button>
                        <button onClick={() => openEditor({ ...p })}>
                          Edit
                        </button>
                        <button
                          className="delete"
                          onClick={() => {
                            setDeleting(p);
                            setError("");
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
              {!products.length && (
                <div className="state">
                  <h2>Your collection starts here.</h2>
                  <p>
                    Add your first recommendation. It will stay private until
                    you publish it.
                  </p>
                </div>
              )}
              {products.length > 0 &&
                !products.some((p) =>
                  p.title.toLowerCase().includes(search.toLowerCase()),
                ) && <div className="state">No matching products.</div>}
            </>
          )}
          {deleting && (
            <DeleteDialog busy={busy} onCancel={() => setDeleting(null)}>
              <div>
                <h2 id="delete-title">Delete this find?</h2>
                <p>{deleting.title}</p>
                <p>This permanently removes the product from the guide.</p>
                {error && <p role="alert">{error}</p>}
                <button
                  autoFocus
                  disabled={busy}
                  onClick={() => setDeleting(null)}
                >
                  Keep product
                </button>{" "}
                <button className="danger" disabled={busy} onClick={destroy}>
                  {busy ? "Deleting…" : "Yes, delete product"}
                </button>
              </div>
            </DeleteDialog>
          )}
        </>
      ) : (
        <button onClick={() => window.location.reload()}>
          Retry access check
        </button>
      )}
    </main>
  );
}
