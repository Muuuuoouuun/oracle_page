"use client";

import { UserPlus, UserCheck } from "lucide-react";
import { useUser } from "@/lib/context";
import clsx from "clsx";

interface Props {
  userId: string;
  userName: string;
  className?: string;
}

/**
 * 팔로우 토글 버튼.
 * 백엔드가 없으므로 팔로우 목록은 브라우저(localStorage)에만 저장되고,
 * 상대방에게는 실제로 전달되지 않는다.
 */
export default function FollowButton({ userId, userName, className }: Props) {
  const { isFollowing, toggleFollow } = useUser();
  const following = isFollowing(userId);

  return (
    <button
      onClick={() => toggleFollow(userId)}
      aria-pressed={following}
      title={following ? `${userName} 팔로우 취소` : `${userName} 팔로우`}
      className={clsx(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95",
        following
          ? "bg-oracle-purple/20 border-oracle-purple/50 text-oracle-purple hover:bg-oracle-hot/10 hover:border-oracle-hot/40 hover:text-oracle-hot"
          : "bg-gradient-to-r from-oracle-purple to-oracle-glow border-transparent text-white hover:opacity-90",
        className
      )}
    >
      {following ? (
        <>
          <UserCheck className="w-3.5 h-3.5" /> 팔로잉
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" /> 팔로우
        </>
      )}
    </button>
  );
}
