import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { MemberRole } from "@/src/types/Album";
import { useQuery } from "convex/react";
import { StyleSheet, Text, View } from "react-native";

interface AlbumMemberCardProps {
    profileId: Id<'profiles'>;
    role: MemberRole;
}

export function AlbumMemberCard({ profileId, role }: AlbumMemberCardProps) {
    const { colors } = useAppTheme();
    const member = useQuery(api.profile.getPublicProfileById, { profileId });

    if (!member) return null;

    const getRoleBadgeColor = () => {
        switch (role) {
            case 'host':
                return { bg: colors.primary + '20', text: colors.primary };
            case 'moderator':
                return { bg: '#10B98120', text: '#10B981' };
            case 'member':
                return { bg: colors.grey3, text: colors.caption };
            default:
                return { bg: colors.grey3, text: colors.caption };
        }
    };

    const roleColors = getRoleBadgeColor();

    return (
        <View style={[styles.container, { borderBottomColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {member.nickname.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={[styles.memberName, { color: colors.text }]}>
                    {member.nickname}
                </Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
                <Text style={[styles.roleBadgeText, { color: roleColors.text }]}>
                    {role === 'not-a-member' ? 'Guest' : role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
    },
    infoContainer: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '500',
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
});
