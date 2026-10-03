import React, { useEffect, useState, useRef } from "react";
import { categories } from "./catalog";
import {
  studioRows,
  studioSave,
  createPack,
  publishQueue,
  saveProduct,
  listProducts,
} from "./backend";
import {
  templates,
  contentPack,
  creativeSVG,
  download,
  downloadPNG,
  manualCandidate,
  identity,
} from "./contentEngine";
export default function Automation({
  products,
  onProducts,
  requested,
  onConsumed,
}) {
  const [tab, setTab] = useState("Queue"),
    [queue, setQueue] = useState([]),
    [posts, setPosts] = useState([]),
    [media, setMedia] = useState([]),
    [selected, setSelected] = useState([]),
    [active, setActive] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [template, setTemplate] = useState(templates[0]),
    [calendar, setCalendar] = useState(false);
  const lock = useRef(false);
  const [candidate, setCandidate] = useState({
    title: "",
    description: "",
    affiliate_url: "",
    category: "Home",
  });
  async function refresh() {
    const [q, p, m] = await Promise.all([
      studioRows("content_queue"),
      studioRows("social_posts"),
      studioRows("media_assets"),
    ]);
    setQueue(q);
    setPosts(p);
    setMedia(m);
  }
  async function run(fn) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e.message + " — You can retry after correcting the issue.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    run(async () => {});
  }, []);
  useEffect(() => {
    if (requested) {
      setSelected([requested]);
      onConsumed();
    }
  }, [requested]);
  const origin = (
    import.meta.env.VITE_SITE_URL ||
    window.location.origin + import.meta.env.BASE_URL
  ).replace(/\/$/, "");
  async function generate(ids) {
    await run(async () => {
      let added = 0;
      for (const id of ids) {
        if (queue.some((q) => q.product_id === id)) continue;
        const product = products.find((p) => p.id === id);
        const pack = contentPack([product], origin);
        const assets = ["Pinterest", "Instagram", "Cover"].map((format) => ({
          platform: format === "Cover" ? "Instagram" : format,
          format,
          template,
          svg: creativeSVG(
            pack.posts.find(
              (p) => p.platform === (format === "Cover" ? "Instagram" : format),
            ),
            [product],
            template,
            format,
          ),
        }));
        await createPack([id], pack, assets);
        added++;
      }
      setNotice(`${added} content packs created. Existing packs were kept.`);
    });
  }
  async function collection() {
    await run(async () => {
      if (selected.length < 2) throw new Error("Select at least two products.");
      const ps = products.filter((p) => selected.includes(p.id));
      if (new Set(ps.map((p) => p.category)).size !== 1)
        throw new Error(
          "Choose products in the same category so the destination contains all finds.",
        );
      const pack = contentPack(ps, origin);
      const assets = pack.posts.flatMap((p) =>
        ps.map((product, i) => ({
          platform: p.platform,
          format: p.platform,
          template: "List pin",
          svg: creativeSVG(
            { ...p, title: i === 0 ? p.title : product.title },
            i === 0 ? ps : [product],
            "List pin",
          ),
        })),
      );
      await createPack(selected, pack, assets);
      setNotice("Collection pack created, including carousel slides.");
    });
  }
  const q = queue.find((x) => x.id === active);
  const field = (key, value) =>
    setQueue((rows) =>
      rows.map((x) =>
        x.id === active
          ? { ...x, status: "Draft", website: { ...x.website, [key]: value } }
          : x,
      ),
    );
  const postField = (id, key, value) =>
    setPosts((rows) =>
      rows.map((x) =>
        x.id === id
          ? { ...x, [key]: value, status: "Draft", scheduled_at: null }
          : x,
      ),
    );
  return (
    <section className="automation">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CONTENT STUDIO</span>
          <h2>One find. A thoughtful content pack.</h2>
          <p>
            Verified facts → branded creatives → owner review → publication.
          </p>
        </div>
      </div>
      <div className="alert">
        Manual import and editorial templates are ready. Social scheduling is a
        local planning queue; posting happens through export until an approved
        publishing connector is installed.
      </div>
      <div className="row-actions">
        {["Queue", "Media Library", "Schedule", "Import"].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {busy && <p role="status">Saving your studio…</p>}
        {error && (
          <p role="alert" className="alert error">
            {error}
            <button disabled={busy} onClick={() => run(async () => {})}>
              Reload queue
            </button>
          </p>
        )}
        {notice && <p className="alert success">{notice}</p>}
      </div>
      {tab === "Import" && (
        <form
          className="editor"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const p = manualCandidate(candidate);
              if (
                products.some(
                  (x) =>
                    identity(x.affiliate_url) === p.source_key ||
                    x.slug === p.slug,
                )
              )
                throw new Error(
                  "This find already exists. Generate its content pack from the queue.",
                );
              await saveProduct(p);
              onProducts(await listProducts());
              setCandidate({
                ...candidate,
                title: "",
                description: "",
                affiliate_url: "",
              });
              setNotice("Candidate saved as a private product draft.");
            });
          }}
        >
          <h3>Import a verified find</h3>
          <p>
            Paste your affiliate link and facts you have checked. No Amazon page
            scraping. Short links cannot be matched to an ASIN until you supply
            the full Amazon link.
          </p>
          {["title", "description", "affiliate_url"].map((k) => (
            <label key={k}>
              {k === "affiliate_url"
                ? "Amazon affiliate URL"
                : k === "description"
                  ? "Verified description"
                  : "Candidate title"}
              <input
                required
                value={candidate[k]}
                onChange={(e) =>
                  setCandidate({ ...candidate, [k]: e.target.value })
                }
              />
            </label>
          ))}
          <label>
            Category
            <select
              value={candidate.category}
              onChange={(e) =>
                setCandidate({ ...candidate, category: e.target.value })
              }
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button disabled={busy}>Add private candidate</button>
        </form>
      )}
      {tab === "Queue" && (
        <>
          <div className="editor">
            <h3>Generate Content Pack</h3>
            <label>
              Creative template
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <div className="product-picks">
              {products.map((p) => (
                <label className="checkbox" key={p.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked
                          ? [...s, p.id]
                          : s.filter((id) => id !== p.id),
                      )
                    }
                  />
                  {p.title}
                </label>
              ))}
            </div>
            <div className="row-actions">
              <button
                disabled={busy || !selected.length}
                onClick={() => generate(selected)}
              >
                Generate Content Pack{selected.length > 1 ? "s (batch)" : ""}
              </button>
              <button
                disabled={busy || selected.length < 2}
                onClick={collection}
              >
                Generate Amazon Must-Haves carousel
              </button>
            </div>
          </div>
          <div className="admin-list">
            {queue.map((row) => (
              <article key={row.id}>
                <div>
                  <h3>{row.website.title}</h3>
                  <span className="status">{row.status}</span>
                </div>
                <button onClick={() => setActive(row.id)}>Review pack</button>
              </article>
            ))}
          </div>
          {!queue.length && (
            <p>
              Your queue is empty. Choose existing finds or import a candidate.
            </p>
          )}
          {q && (
            <div className="editor">
              <h3>Website copy · {q.status}</h3>
              <div className="form-grid">
                {[
                  "title",
                  "description",
                  "notes",
                  "seo_title",
                  "seo_description",
                  "display_text",
                ].map((k) => (
                  <label key={k}>
                    {{
                      notes: "Editorial recommendation",
                      display_text: "Affiliate CTA",
                      seo_title: "SEO title",
                      seo_description: "SEO description",
                    }[k] || k}
                    <textarea
                      value={q.website[k]}
                      onChange={(e) => field(k, e.target.value)}
                    />
                  </label>
                ))}
                <label>
                  Category
                  <select
                    value={q.website.category}
                    onChange={(e) => field("category", e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                {["tags", "key_features", "placements"].map((k) => (
                  <label key={k}>
                    {k.replace("_", " ")} (one per line)
                    <textarea
                      value={(q.website[k] || []).join("\n")}
                      onChange={(e) =>
                        field(k, e.target.value.split("\n").filter(Boolean))
                      }
                    />
                  </label>
                ))}
              </div>
              <p className="muted">
                Key features are intentionally empty until you add verified
                specifications. Existing affiliate URLs stay attached to the
                product.
              </p>
              <div className="row-actions">
                <button
                  disabled={busy}
                  onClick={() => run(() => studioSave("content_queue", q))}
                >
                  Save draft copy
                </button>
                <button
                  disabled={busy || q.status !== "Draft"}
                  onClick={() =>
                    run(() =>
                      studioSave("content_queue", { ...q, status: "Approved" }),
                    )
                  }
                >
                  Approve website copy
                </button>
                <button
                  disabled={busy || q.status !== "Approved"}
                  onClick={() =>
                    run(async () => {
                      await publishQueue(q.id);
                      onProducts(await listProducts());
                      setNotice("Approved website copy published.");
                    })
                  }
                >
                  Publish approved product to site
                </button>
              </div>
              {posts
                .filter((p) => p.queue_id === q.id)
                .map((p) => (
                  <div className="social-editor" key={p.id}>
                    <h3>
                      {p.platform} · {p.status}
                    </h3>
                    {[
                      "title",
                      "description",
                      "destination_url",
                      "board",
                      "alt_text",
                      "hashtags",
                      "cta",
                    ]
                      .filter(
                        (k) =>
                          p.platform === "Instagram" ||
                          !["hashtags", "cta"].includes(k),
                      )
                      .map((k) => (
                        <label key={k}>
                          {k.replaceAll("_", " ")}
                          <textarea
                            value={p[k]}
                            onChange={(e) => postField(p.id, k, e.target.value)}
                          />
                        </label>
                      ))}
                    <div className="row-actions">
                      <button
                        disabled={busy}
                        onClick={() => run(() => studioSave("social_posts", p))}
                      >
                        Save {p.platform} draft
                      </button>
                      <button
                        disabled={busy || p.status !== "Draft"}
                        onClick={() =>
                          run(() =>
                            studioSave("social_posts", {
                              ...p,
                              status: "Approved",
                            }),
                          )
                        }
                      >
                        Approve {p.platform}
                      </button>
                      <button
                        onClick={() =>
                          run(async () => {
                            await navigator.clipboard.writeText(
                              `${p.title}\n\n${p.description}\n${p.hashtags}\n${p.cta}\n${p.destination_url}`,
                            );
                            setNotice("Social copy copied.");
                          })
                        }
                      >
                        Copy content
                      </button>
                      <button
                        onClick={() =>
                          download(
                            JSON.stringify(p, null, 2),
                            `${p.platform}-content.json`,
                          )
                        }
                      >
                        Export content
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
      {tab === "Media Library" && (
        <>
          <p>
            Typography creatives avoid fictional product depictions. PNG exports
            have the exact platform dimensions. Regeneration resets asset and
            social approvals.
          </p>
          <div className="media-grid">
            {media.map((m) => {
              const row = queue.find((q) => q.id === m.queue_id);
              const post = posts.find(
                (p) => p.queue_id === m.queue_id && p.platform === m.platform,
              );
              return (
                <article className="editor" key={m.id}>
                  <img
                    alt={post?.alt_text || "Branded creative"}
                    src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(m.svg)}`}
                  />
                  <h3>{row?.website.title}</h3>
                  <p>
                    {m.format} · {m.template} · {m.status}
                  </p>
                  <label>
                    Template
                    <select
                      value={m.template}
                      onChange={(e) =>
                        setMedia((rows) =>
                          rows.map((a) =>
                            a.id === m.id
                              ? { ...a, template: e.target.value }
                              : a,
                          ),
                        )
                      }
                    >
                      {templates.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <div className="row-actions">
                    <button
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await studioSave("media_assets", {
                            ...m,
                            status: "Draft",
                            svg: creativeSVG(
                              post,
                              products.filter((p) =>
                                row.product_ids.includes(p.id),
                              ),
                              m.template,
                              m.format,
                            ),
                          });
                          for (const p of posts.filter(
                            (p) =>
                              p.queue_id === m.queue_id &&
                              p.platform === m.platform,
                          ))
                            await studioSave("social_posts", {
                              ...p,
                              status: "Draft",
                              scheduled_at: null,
                            });
                        })
                      }
                    >
                      Regenerate preview
                    </button>
                    <button
                      disabled={busy || m.status === "Approved"}
                      onClick={() =>
                        run(() =>
                          studioSave("media_assets", {
                            ...m,
                            status: "Approved",
                          }),
                        )
                      }
                    >
                      Approve asset
                    </button>
                    <button
                      onClick={() =>
                        run(() => downloadPNG(m.svg, `${m.id}-${m.format}.png`))
                      }
                    >
                      Download PNG
                    </button>
                    <button
                      onClick={() =>
                        download(m.svg, `${m.id}.svg`, "image/svg+xml")
                      }
                    >
                      Download SVG
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
      {tab === "Schedule" && (
        <>
          <h3>Publishing planner</h3>
          <p>
            Times use your device timezone (
            {Intl.DateTimeFormat().resolvedOptions().timeZone}). Planned posts
            are not sent externally.
          </p>
          <button onClick={() => setCalendar(!calendar)}>
            {calendar ? "List view" : "Calendar view"}
          </button>
          <div className={calendar ? "calendar-grid" : "admin-list"}>
            {[...posts]
              .sort((a, b) =>
                (a.scheduled_at || "z").localeCompare(b.scheduled_at || "z"),
              )
              .map((p) => (
                <article key={p.id}>
                  <div>
                    <span className="eyebrow">
                      {p.platform} · {p.status}
                    </span>
                    <h3>{p.title}</h3>
                    <p>
                      {p.scheduled_at
                        ? new Date(p.scheduled_at).toLocaleString()
                        : "Unscheduled"}
                    </p>
                  </div>
                  <label>
                    Plan date
                    <input
                      type="datetime-local"
                      disabled={
                        busy || !["Approved", "Scheduled"].includes(p.status)
                      }
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const date = new Date(e.target.value);
                        if (date <= new Date()) {
                          setError("Choose a future time.");
                          return;
                        }
                        run(() =>
                          studioSave("social_posts", {
                            ...p,
                            status: "Scheduled",
                            scheduled_at: date.toISOString(),
                          }),
                        );
                      }}
                    />
                  </label>
                  {p.status === "Scheduled" && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          studioSave("social_posts", {
                            ...p,
                            status: "Approved",
                            scheduled_at: null,
                          }),
                        )
                      }
                    >
                      Unschedule
                    </button>
                  )}
                  {["Approved", "Scheduled"].includes(p.status) && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const url = new FormData(e.target).get("url");
                        run(() =>
                          studioSave("social_posts", {
                            ...p,
                            status: "Published",
                            published_url: url,
                          }),
                        );
                      }}
                    >
                      <label>
                        Published post URL
                        <input
                          name="url"
                          type="url"
                          required
                          pattern="https://.*"
                        />
                      </label>
                      <button disabled={busy}>
                        Confirm manually published
                      </button>
                    </form>
                  )}
                </article>
              ))}
          </div>
          <button
            onClick={() =>
              download(
                JSON.stringify(posts, null, 2),
                "publishing-planner.json",
              )
            }
          >
            Export planner
          </button>
        </>
      )}
    </section>
  );
}
