import { Icon } from "@/components/ui/Icon";
import { PhoneMockup } from "@/components/ui/PhoneMockup";

// Demo fixtures: pretend accounts on a pretend timeline.
const POSTS = [
  { name: "Sam Lee", handle: "samlee.example", time: "6h", initial: "S", color: "var(--color-presence-pink)", text: "Hot take: pineapple belongs on pizza. Fight me." },
  { name: "Maya Ortiz", handle: "maya.example", time: "2m", initial: "M", color: "var(--color-presence-orange)", text: "First frost on the allotment this morning. The kale doesn’t care." },
  { name: "Jun Park", handle: "jun.example", time: "9m", initial: "J", color: "var(--color-presence-purple)", text: "Can’t believe how that finale ended. Still thinking about the last scene." },
];

export function BlueskyTimeline() {
  return (
    <PhoneMockup width={320} height={600} label="Preview of the Bluesky app showing a pretend timeline of posts" className="shadow-[0_16px_40px_rgba(31,35,40,.14)]">
      <div className="flex flex-col gap-2.5 border-b border-app-line px-4 pt-[18px]">
        <span className="h-7 w-7 self-center rounded-full bg-app-blue" />
        <div className="flex justify-around text-sm">
          <span className="border-b-[3px] border-app-blue pb-2.5 font-semibold">Discover</span>
          <span className="pb-2.5 text-muted">Following</span>
        </div>
      </div>
      {POSTS.map((p) => (
        <div key={p.handle} className="flex gap-2.5 border-b border-app-line px-3.5 py-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: p.color }}>
            {p.initial}
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-[13px]">
              <strong>{p.name}</strong> <span className="text-muted">@{p.handle} · {p.time}</span>
            </span>
            <span className="text-sm leading-[1.4]">{p.text}</span>
            <span className="mt-1 flex gap-7 text-muted">
              <Icon name="reply" />
              <Icon name="repost" />
              <Icon name="heart" />
            </span>
          </span>
        </div>
      ))}
    </PhoneMockup>
  );
}
