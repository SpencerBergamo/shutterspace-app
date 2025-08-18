import { ChevronRight } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SettingsGroupProps {
    title: string;
    children: React.ReactNode;
}

export const SettingsGroup = ({ title, children }: SettingsGroupProps) => (
    <View style={styles.groupContainer}>
        <Text style={styles.groupTitle}>
            {title}
        </Text>
        <View style={[
            styles.groupContent,
            { backgroundColor: 'white', borderColor: '#E5E5E5', borderRadius: 12 }
        ]}>
            {children}
        </View>
    </View>
);


interface SettingsItemProps {
    icon: React.ReactNode;
    title: string;
    onPress: () => void;
    isLast?: boolean;
    isDestructive?: boolean;
}

export const SettingsItem = ({ icon, title, onPress, isLast, isDestructive }: SettingsItemProps) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
        style={[
            styles.settingsItem,
            !isLast && { borderBottomWidth: 1, borderBottomColor: '#E5E5E5' }
        ]} >

        <View style={styles.itemContent}>
            <View style={styles.iconContainer}>
                {icon}
            </View>
            <Text style={[styles.itemTitle,
            isDestructive && { color: '#FF3B30' }
            ]}>
                {title}
            </Text>
        </View>

        <ChevronRight size={16} color="#999999" />

    </TouchableOpacity>
);

const styles = StyleSheet.create({
    groupContainer: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    groupTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        paddingHorizontal: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#666666',
    },
    groupContent: {
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 52,
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    itemIcon: {
        color: '#666666'
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '400',
        color: '#000000',
    },
})