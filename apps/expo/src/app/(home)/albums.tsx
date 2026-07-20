import { AlbumsEmptyState, AlbumsList } from "@/src/components/albums";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useUserAlbums } from "@/src/hooks/use-user-albums";
import { router, Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

type SortOption = "name" | "created" | "updated";

export default function AlbumsScreen() {
    const { colors } = useAppTheme();
    const { albums, status, loadMore } = useUserAlbums();
    const [sortBy, setSortBy] = useState<SortOption>("updated");
    const [search, setSearch] = useState("");

    const isLoading = status === "LoadingFirstPage";

    const displayAlbums = useMemo(() => {
        if (!albums) return albums;

        const query = search.trim().toLowerCase();
        const filtered = query
            ? albums.filter((album) => album.title.toLowerCase().includes(query))
            : albums;

        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.title.localeCompare(b.title);
                case "created":
                    return b._creationTime - a._creationTime;
                case "updated":
                    return b.updatedAt - a.updatedAt;
            }
        });
    }, [albums, sortBy, search]);

    const trimmedSearch = search.trim();

    const renderEmptyComponent = useCallback(() => {
        if (isLoading) {
            return (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            );
        }
        if (trimmedSearch) {
            return <AlbumsEmptyState variant="search" query={trimmedSearch} />;
        }
        return <AlbumsEmptyState />;
    }, [isLoading, trimmedSearch, colors.text]);

    const handleSearchChange = useCallback((event: { nativeEvent: { text: string } }) => {
        setSearch(event.nativeEvent.text);
    }, []);

    const handleSearchCancel = useCallback(() => {
        setSearch("");
    }, []);

    const handleEndReached = useCallback(() => {
        if (status === "CanLoadMore") {
            loadMore();
        }
    }, [status, loadMore]);

    return (
        <>
            <Stack.Screen options={{
                headerTitle: "Albums",
                headerLargeTitleEnabled: true,
                headerTitleStyle: {
                    color: colors.text,
                },
            }} />

            <Stack.Toolbar placement="right">
                <Stack.Toolbar.Menu icon="line.3.horizontal.decrease" >
                    <Stack.Toolbar.Menu inline title="Sort By">
                        <Stack.Toolbar.MenuAction
                            icon="textformat"
                            isOn={sortBy === "name"}
                            onPress={() => setSortBy("name")}
                        >
                            Name
                        </Stack.Toolbar.MenuAction>
                        <Stack.Toolbar.MenuAction
                            icon="calendar"
                            isOn={sortBy === "created"}
                            onPress={() => setSortBy("created")}
                        >
                            Date Created
                        </Stack.Toolbar.MenuAction>
                        <Stack.Toolbar.MenuAction
                            icon="clock"
                            isOn={sortBy === "updated"}
                            onPress={() => setSortBy("updated")}
                        >
                            Last Updated
                        </Stack.Toolbar.MenuAction>
                    </Stack.Toolbar.Menu>
                    <Stack.Toolbar.MenuAction
                        icon="plus"
                        onPress={() => router.push("/(home)/album/create")}
                    >
                        New Album
                    </Stack.Toolbar.MenuAction>
                </Stack.Toolbar.Menu>
            </Stack.Toolbar>

            <AlbumsList
                albums={isLoading ? [] : displayAlbums}
                onEndReached={handleEndReached}
                ListEmptyComponent={renderEmptyComponent}
                style={{ backgroundColor: colors.background }}
                layoutKey={sortBy}
            />

            {/* Search Bar */}
            <Stack.SearchBar
                placeholder="Search albums"
                onChangeText={handleSearchChange}
                onCancelButtonPress={handleSearchCancel}
            />
            {Platform.OS === 'ios' && (
                <Stack.Toolbar placement="bottom" >
                    <Stack.Toolbar.SearchBarSlot />
                    <Stack.Toolbar.Spacer />
                    <Stack.Toolbar.Button icon="plus" onPress={() => router.push("/(home)/new-album")} />
                </Stack.Toolbar>
            )}
        </>
    );
}
