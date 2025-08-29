import { useTheme } from "@/context/ThemeContext";
import { formatDateRange } from "@/utils/dateFormatters";
import { Calendar } from "lucide-react-native";
import { useMemo } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import DatePicker, { RangeOutput } from 'react-native-neat-date-picker';

interface DateTimeFieldProps {
    isPickerOpen: boolean;
    dateRange?: { start?: Date; end?: Date; };
    setDateRange: (value: { start?: Date; end?: Date; }) => void;
    closePicker: () => void;
}

export default function DateTimeField({ dateRange, isPickerOpen, setDateRange, closePicker }: DateTimeFieldProps) {
    const { theme } = useTheme();

    const handleConfirm = (range: RangeOutput) => {
        setDateRange({
            start: range.startDate,
            end: range.endDate,
        });

        closePicker();
    }


    const formatDisplayDateRange = useMemo(() => {
        if (!dateRange || !dateRange.start) return;
        const start = dateRange.start;
        const end = dateRange.end ?? dateRange.start;

        return {
            start: formatDateRange(start, end).start,
            end: formatDateRange(start, end).end,
        }
    }, [dateRange?.start, dateRange?.end]);

    return (
        <View style={styles.container}>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Calendar size={24} color={theme.colors.text} />

                {dateRange && dateRange.start ? (
                    <View>
                        <Text style={{ fontSize: 14, fontWeight: '500' }}>
                            {formatDisplayDateRange?.start}
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '500' }}>
                            {formatDisplayDateRange?.end}
                        </Text>


                    </View>
                ) : (
                    <View>
                        <Text style={{ fontSize: 12, fontWeight: '400', color: 'grey' }}>Is this time sensitive?</Text>
                        <Text style={{ fontSize: 14, fontWeight: '500' }}>Tap to add dates to your album</Text>
                    </View>
                )}
            </View>

            <Modal
                visible={isPickerOpen}

                transparent={true}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                animationType="fade" >

                <DatePicker
                    mode="range"
                    isVisible={true}
                    onCancel={closePicker}
                    onConfirm={handleConfirm}
                    customLanguageConfig={{
                        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                        weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                        accept: 'Confirm',
                        cancel: 'Cancel',
                    }}
                    colorOptions={{
                        headerColor: theme.colors.primary,
                        backgroundColor: theme.colors.background,
                        selectedDateBackgroundColor: theme.colors.primary,
                        selectedDateTextColor: 'white',
                        confirmButtonColor: theme.colors.primary,
                        weekDaysColor: theme.colors.primary,
                    }} />
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        gap: 16,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    label: {
        fontSize: 16,
        fontWeight: '500',
    },

    iosPicker: {
        height: 200,
    }
});