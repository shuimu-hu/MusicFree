import React, { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import AppBar from "@/components/base/appBar";
import StatusBar from "@/components/base/statusBar";
import ThemeText from "@/components/base/themeText";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView";
import MusicBar from "@/components/musicBar";
import globalStyle from "@/constants/globalStyle";
import playStats, {
    IPlayCountItem,
    usePlayCounts,
    useTotalSeconds,
} from "@/core/playStats";
import rpx from "@/utils/rpx";

/** 把秒数格式化成「x 小时 y 分」 */
function formatDuration(totalSeconds: number) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
    const h = Math.floor(safeSeconds / 3600);
    const m = Math.floor((safeSeconds % 3600) / 60);
    const s = safeSeconds % 60;
    if (h > 0) {
        return `${h} 小时 ${m} 分`;
    }
    if (m > 0) {
        return `${m} 分 ${s} 秒`;
    }
    return `${s} 秒`;
}

export default function PlayStats() {
    const counts = usePlayCounts();
    const totalSeconds = useTotalSeconds();

    // 按播放次数从多到少排序
    const list = useMemo(() => {
        return Object.values(counts).sort((a, b) => b.count - a.count);
    }, [counts]);

    const renderItem = ({
        item,
        index,
    }: {
        item: IPlayCountItem;
        index: number;
    }) => (
        <View style={styles.row}>
            <ThemeText style={styles.rank} fontColor="textSecondary">
                {index + 1}
            </ThemeText>
            <View style={styles.rowInfo}>
                <ThemeText numberOfLines={1}>{item.title}</ThemeText>
                <ThemeText
                    numberOfLines={1}
                    fontSize="description"
                    fontColor="textSecondary">
                    {item.artist}
                </ThemeText>
            </View>
            <ThemeText style={styles.count} fontColor="textHighlight">
                {item.count} 次
            </ThemeText>
        </View>
    );

    return (
        <VerticalSafeAreaView style={globalStyle.fwflex1}>
            <StatusBar />
            <AppBar
                menu={[
                    {
                        icon: "trash-outline",
                        title: "清空统计",
                        onPress() {
                            playStats.clear();
                        },
                    },
                ]}>
                听歌统计
            </AppBar>
            <View style={styles.summary}>
                <ThemeText style={styles.summaryNumber} fontWeight="bold">
                    {formatDuration(totalSeconds)}
                </ThemeText>
                <ThemeText
                    style={styles.summaryLabel}
                    fontSize="description"
                    fontColor="textSecondary">
                    累计听歌时长
                </ThemeText>
            </View>
            <ThemeText
                style={styles.sectionTitle}
                fontSize="description"
                fontColor="textSecondary">
                单曲播放次数（共 {list.length} 首）
            </ThemeText>
            <FlatList
                style={globalStyle.flex1}
                data={list}
                keyExtractor={item => `${item.platform}@${item.id}`}
                renderItem={renderItem}
                ListEmptyComponent={
                    <ThemeText style={styles.empty} fontColor="textSecondary">
                        还没有播放记录，去听几首歌吧～
                    </ThemeText>
                }
            />
            <MusicBar />
        </VerticalSafeAreaView>
    );
}

const styles = StyleSheet.create({
    summary: {
        width: "100%",
        paddingVertical: rpx(48),
        justifyContent: "center",
        alignItems: "center",
    },
    summaryNumber: {
        fontSize: rpx(56),
    },
    summaryLabel: {
        marginTop: rpx(12),
    },
    sectionTitle: {
        paddingHorizontal: rpx(24),
        marginBottom: rpx(12),
    },
    row: {
        width: "100%",
        height: rpx(108),
        paddingHorizontal: rpx(24),
        flexDirection: "row",
        alignItems: "center",
    },
    rank: {
        width: rpx(60),
    },
    rowInfo: {
        flex: 1,
        justifyContent: "center",
    },
    count: {
        marginLeft: rpx(16),
    },
    empty: {
        width: "100%",
        textAlign: "center",
        marginTop: rpx(80),
    },
});
