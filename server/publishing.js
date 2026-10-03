// Server-only connector boundary. The browser never receives provider credentials.
// A deployment worker must load records using owner authorization/RLS and acquire
// a unique durable attempt before invoking these adapters. Do not blindly retry
// an ambiguous timeout: reconcile the remote account first to avoid duplicate posts.
export function reviewedPayload(post, assets, now = new Date()) {
  if (!["Approved", "Scheduled"].includes(post.status))
    throw new Error("Owner approval required");
  if (post.status === "Scheduled" && new Date(post.scheduled_at) > now)
    throw new Error("Post is not due");
  const images = assets
    .filter(
      (a) =>
        a.status === "Approved" &&
        a.platform === post.platform &&
        a.format !== "Cover",
    )
    .map((a) => a.public_url);
  if (!images.length || images.some((url) => !/^https:\/\//.test(url || "")))
    throw new Error("Upload approved PNG/JPEG assets to HTTPS hosting first");
  return { post, images };
}
export function pinterestPayload(reviewed, boardId) {
  if (!boardId) throw new Error("Configure the Pinterest board ID");
  const { post, images } = reviewed;
  return {
    board_id: boardId,
    title: post.title.slice(0, 100),
    description: post.description.slice(0, 800),
    alt_text: post.alt_text.slice(0, 500),
    link: post.destination_url,
    media_source: { source_type: "image_url", url: images[0] },
  };
}
export function instagramPayload(reviewed) {
  const { post, images } = reviewed;
  return {
    caption: [post.description, post.cta, post.hashtags]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 2200),
    images,
    alt_text: post.alt_text,
  };
}
export async function dispatchReviewed(post, assets, connectors) {
  const reviewed = reviewedPayload(post, assets);
  const connector = connectors[post.platform];
  if (!connector)
    return {
      mode: "manual",
      post,
      reason: "Publishing credentials or permissions are not configured",
    };
  // The connector returns a real provider ID/permalink; no simulated success.
  const result = await connector.publish(reviewed);
  if (!result?.id || !/^https:\/\//.test(result.url || ""))
    throw new Error("Provider did not confirm publication");
  return { mode: "published", ...result };
}
