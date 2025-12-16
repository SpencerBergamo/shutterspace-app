import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Avatar from "@/src/components/Avatar";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AlbumMemberAvatarStackProps {
    albumId: Id<'albums'>;
}

const AVATAR_SIZE = 32;
const OVERLAP_OFFSET = 24;
const MAX_VISIBLE_AVATARS = 8;

const MemberAvatar = ({ profileId, index }: { profileId: Id<'profiles'>, index: number }) => {
    const publicProfile = useQuery(api.profile.getPublicProfileById, { profileId });

    if (!publicProfile) return null;

    return (
        <View
            style={[
                styles.avatarContainer,
                { left: index * OVERLAP_OFFSET, zIndex: MAX_VISIBLE_AVATARS - index }
            ]}
        >
            <Avatar
                nickname={publicProfile.nickname}
                avatarKey={publicProfile.avatarKey}
                ssoAvatarUrl={publicProfile.ssoAvatarUrl}
                size={AVATAR_SIZE}
            />
        </View>
    );
}

export default function AlbumMemberAvatarStack({ albumId }: AlbumMemberAvatarStackProps) {
    const { colors } = useAppTheme();
    const memberships = useQuery(api.albumMembers.getMemberships, albumId ? { albumId } : "skip");

    if (!memberships || memberships.length === 0) return null;

    const visibleMembers = memberships.slice(0, MAX_VISIBLE_AVATARS);
    const remainingCount = memberships.length - MAX_VISIBLE_AVATARS;

    const handlePress = () => {
        router.push({
            pathname: '/album/members',
            params: { albumId }
        });
    };

    const containerWidth = (visibleMembers.length - 1) * OVERLAP_OFFSET + AVATAR_SIZE + (remainingCount > 0 ? OVERLAP_OFFSET + 40 : 0);

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[styles.container, { width: containerWidth }]}
            activeOpacity={0.7}
        >
            <View style={styles.stackContainer}>
                {visibleMembers.map((membership, index) => (
                    <MemberAvatar
                        key={membership._id}
                        profileId={membership.profileId}
                        index={index}
                    />
                ))}

                {remainingCount > 0 && (
                    <View
                        style={[
                            styles.moreContainer,
                            {
                                left: visibleMembers.length * OVERLAP_OFFSET,
                                backgroundColor: colors.secondary + '80',
                                borderColor: colors.border,
                            }
                        ]}
                    >
                        <Text style={[styles.moreText, { color: colors.text }]}>+{remainingCount}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    stackContainer: {
        flexDirection: 'row',
        position: 'relative',
        height: AVATAR_SIZE,
    },
    avatarContainer: {
        position: 'absolute',
    },
    moreContainer: {
        position: 'absolute',
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreText: {
        fontSize: 12,
        fontWeight: '600',
    },
})
