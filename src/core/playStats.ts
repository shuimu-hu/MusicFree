import getOrCreateMMKV from "@/utils/getOrCreateMMKV";
import { safeParse, safeStringify } from "@/utils/jsonUtil";
import { atom, getDefaultStore, useAtomValue } from "jotai";

/**
 * 听歌统计
 * - 每首歌的播放次数
 * - 累计听歌总时长（秒）
 *
 * 数据存储参考 musicHistory.ts，使用 MMKV 本地持久化。
 */

export interface IPlayCountItem {
    platform: string;
    id: string;
    title: string;
    artist: string;
    artwork?: string;
    /** 播放次数 */
    count: number;
    /** 最近一次播放时间戳 */
    lastPlayTime: number;
}

const COUNTS_KEY = "playCounts";
const TOTAL_KEY = "totalSeconds";

const playStatsStore = getOrCreateMMKV("music.PlayStats");

/** 每首歌的播放次数表：key -> item */
const playCountsAtom = atom<Record<string, IPlayCountItem>>({});
/** 累计听歌时长（秒） */
const totalSecondsAtom = atom<number>(0);

function getMediaKey(musicItem: IMusic.IMusicItem) {
    return `${musicItem.platform}@${musicItem.id}`;
}

class PlayStats {
    /** 本次开始播放的时间戳，null 表示当前未在计时 */
    private listenStartAt: number | null = null;

    get playCounts() {
        return getDefaultStore().get(playCountsAtom);
    }

    get totalSeconds() {
        return getDefaultStore().get(totalSecondsAtom);
    }

    async setup() {
        const counts = safeParse(
            playStatsStore.getString(COUNTS_KEY) ?? "{}",
        ) as Record<string, IPlayCountItem>;
        const total = playStatsStore.getNumber(TOTAL_KEY) ?? 0;

        getDefaultStore().set(playCountsAtom, counts ?? {});
        getDefaultStore().set(totalSecondsAtom, total ?? 0);
    }

    /** 记录一次播放（次数 +1），在歌曲真正开始播放时调用 */
    recordPlay(musicItem: IMusic.IMusicItem) {
        if (!musicItem) {
            return;
        }
        const key = getMediaKey(musicItem);
        const counts = { ...this.playCounts };
        const prev = counts[key];

        counts[key] = {
            platform: `${musicItem.platform ?? ""}`,
            id: `${musicItem.id ?? ""}`,
            title: musicItem.title ?? "未知歌曲",
            artist: musicItem.artist ?? "",
            artwork: musicItem.artwork,
            count: (prev?.count ?? 0) + 1,
            lastPlayTime: Date.now(),
        };

        playStatsStore.set(COUNTS_KEY, safeStringify(counts));
        getDefaultStore().set(playCountsAtom, counts);
    }

    /**
     * 播放状态变化时调用。
     * @param isPlaying 当前是否处于播放中
     */
    notifyState(isPlaying: boolean) {
        if (isPlaying) {
            if (this.listenStartAt == null) {
                this.listenStartAt = Date.now();
            }
        } else {
            this.flush();
            this.listenStartAt = null;
        }
    }

    /**
     * 把"上次开始计时到现在"这一段时长累加进总时长。
     * 在歌曲切换、暂停、停止时调用，避免长时间播放未及时落库。
     */
    flush() {
        if (this.listenStartAt == null) {
            return;
        }
        const now = Date.now();
        const delta = Math.floor((now - this.listenStartAt) / 1000);
        if (delta > 0) {
            const total = (this.totalSeconds ?? 0) + delta;
            playStatsStore.set(TOTAL_KEY, total);
            getDefaultStore().set(totalSecondsAtom, total);
        }
        // 如果仍在播放，重置起点继续计时
        this.listenStartAt = now;
    }

    /** 清空所有统计 */
    clear() {
        this.listenStartAt = null;
        playStatsStore.set(COUNTS_KEY, "{}");
        playStatsStore.set(TOTAL_KEY, 0);
        getDefaultStore().set(playCountsAtom, {});
        getDefaultStore().set(totalSecondsAtom, 0);
    }
}

export function usePlayCounts() {
    return useAtomValue(playCountsAtom);
}

export function useTotalSeconds() {
    return useAtomValue(totalSecondsAtom);
}

const playStats = new PlayStats();
export default playStats;
