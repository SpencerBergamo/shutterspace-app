import { Modal, StyleSheet, TouchableWithoutFeedback, View } from "react-native";
// import DatePicker, { RangeOutput } from "react-native-neat-date-picker";

interface DateRangePickerProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (range: any) => void;
}

export default function DateRangePickerModal({ open, onClose, onConfirm }: DateRangePickerProps) {
    return (
        <Modal
            visible={open}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose} >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.container}>

                    {/* <DatePicker
                        isVisible={open}
                        mode='range'
                        withoutModal={true}
                        colorOptions={{
                            headerColor: '#09ADA9',
                            confirmButtonColor: '#09ADA9',
                            changeYearModalColor: '#09ADA9',
                            selectedDateTextColor: 'white',
                            selectedDateBackgroundColor: '#09ADA9',
                            weekDaysColor: '#09ADA9',
                        }}
                        modalStyles={{

                        }}
                        customLanguageConfig={{
                            months: {
                                '0': 'Jan',
                                '1': 'Feb',
                                '2': 'Mar',
                                '3': 'Apr',
                                '4': 'May',
                                '5': 'Jun',
                                '6': 'Jul',
                                '7': 'Aug',
                                '8': 'Sep',
                                '9': 'Oct',
                                '10': 'Nov',
                                '11': 'Dec',
                            },
                            weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                            accept: 'Apply',
                            cancel: 'Cancel',
                        }}

                        onCancel={onClose}
                        onConfirm={onConfirm} /> */}
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});