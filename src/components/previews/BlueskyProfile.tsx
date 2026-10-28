import { Icon } from "@/components/ui/Icon";
import { PhoneMockup } from "@/components/ui/PhoneMockup";
import type { SettingValues } from "@/lib/workspace/types";

/** Describe the current preview for screen readers, since the mockup is an image of a profile. */
export function describeProfile(v: SettingValues): string {
  const parts = [
    v.server ? "handle shows their server (@maya@garden.example)" : "handle @maya.bsky.social",
    v.locked ? "follow button reads Request to follow, with a padlock by the name" : "a plain Follow button",
    v.hideCounts ? "follower counts hidden" : "follower counts shown",
    v.fields ? "a verified website link with a green tick" : null,
    v.tags ? "three featured hashtags" : null,
    v.mtabs ? "Mastodon-style tabs: Posts, Posts & replies, Media" : "tabs: Posts, Replies, Media, Likes, Feeds",
  ];
  return `Pretend profile page for Maya Ortiz: ${parts.filter(Boolean).join("; ")}.`;
}

/** A pretend Bluesky profile (demo fixture data) that reacts to the workspace settings. */
export function BlueskyProfile({ values: v }: { values: SettingValues }) {
  const handle = v.server ? "@maya@garden.example" : "@maya.bsky.social";
  const tabs = v.mtabs ? ["Posts", "Posts & replies", "Media"] : ["Posts", "Replies", "Media", "Likes", "Feeds"];
  return (
    <PhoneMockup label={describeProfile(v)}>
      <div aria-hidden className="contents">
        <div
          className="relative h-24 flex-none"
          style={{
            backgroundColor: "var(--color-app-banner)",
            backgroundImage: "radial-gradient(var(--color-app-banner-dot) 2px, transparent 2.5px)",
            backgroundSize: "18px 18px",
          }}
        >
          <span className="absolute left-2.5 top-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-ink/55 text-white">
            <Icon name="chevronLeft" size={14} strokeWidth={2.5} />
          </span>
        </div>
        <div className="relative z-[1] -mt-[34px] flex items-end justify-between px-3.5">
          <span className="box-border flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-surface bg-presence-orange text-[28px] font-semibold text-white">
            M
          </span>
          {v.locked ? (
            <span className="flex h-8 items-center gap-1.5 rounded-full bg-app-blue px-3.5 text-[13px] font-semibold text-white">
              <Icon name="lock" size={12} strokeWidth={2.5} />
              Request to follow
            </span>
          ) : (
            <span className="flex h-8 items-center gap-1 rounded-full bg-app-blue px-4 text-[13px] font-semibold text-white">+ Follow</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5 px-3.5 pt-2">
          <span className="flex items-center gap-1.5 text-[21px] font-bold">
            Maya Ortiz
            {v.locked && <Icon name="lock" size={15} strokeWidth={2.4} className="text-muted" />}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <span className="rounded bg-app-line px-1.5 py-0.5 text-[11px] text-ink-2">Follows you</span>
            {handle}
          </span>
          {v.hideCounts ? (
            <span className="text-[13px] text-muted">
              <strong className="text-ink">845</strong> posts · follower counts hidden
            </span>
          ) : (
            <span className="text-[13px] text-muted">
              <strong className="text-ink">1,204</strong> followers&nbsp;&nbsp;<strong className="text-ink">312</strong> following&nbsp;&nbsp;
              <strong className="text-ink">845</strong> posts
            </span>
          )}
          <span className="text-[13px] leading-[1.45]">Allotment notes and bad photos of good vegetables. Slowly learning to compost properly.</span>
          {v.fields && (
            <div className="overflow-hidden rounded-md border border-app-line text-xs">
              <div className="grid border-b border-app-line bg-diff-add-bg" style={{ gridTemplateColumns: "84px 1fr" }}>
                <span className="px-2 py-1.5 font-semibold text-diff-add-ink">Website</span>
                <span className="flex items-center gap-1 px-2 py-1.5 text-diff-add-ink">
                  <Icon name="check" size={12} strokeWidth={3} />
                  garden.example
                </span>
              </div>
              <div className="grid" style={{ gridTemplateColumns: "84px 1fr" }}>
                <span className="px-2 py-1.5 font-semibold text-muted">Pronouns</span>
                <span className="px-2 py-1.5">she/her</span>
              </div>
            </div>
          )}
          {v.tags && (
            <div className="flex flex-wrap gap-1">
              {["#allotment", "#composting", "#seedswap"].map((t) => (
                <span key={t} className="rounded-full bg-cat-social-bg px-2 py-[3px] text-xs text-cat-social-ink">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2.5 flex overflow-hidden border-b border-app-line px-1.5 text-[13px]">
          {tabs.map((t, i) => (
            <span key={t} className={`whitespace-nowrap px-2 pb-2 pt-2.5 ${i === 0 ? "border-b-[3px] border-app-blue font-semibold" : "text-muted"}`}>
              {t}
            </span>
          ))}
        </div>
        <div className="flex gap-2.5 px-3 py-2.5">
          <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-presence-orange text-[13px] font-semibold text-white">M</span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-xs">
              <strong>Maya Ortiz</strong> <span className="text-muted">{handle} · 2m</span>
            </span>
            <span className="text-[13px] leading-[1.4]">First frost on the allotment this morning. The kale doesn’t care.</span>
          </span>
        </div>
      </div>
    </PhoneMockup>
  );
}
