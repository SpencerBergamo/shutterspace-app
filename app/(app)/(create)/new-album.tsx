import AlbumCoverField from "@/components/albums/AlbumCoverField";
import AlbumExtraFields from "@/components/albums/AlbumExtraFields";
import { router } from "expo-router";
import { Images, X } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


interface AlbumFormData {
    title: string;
    description?: string;
    dateTime?: string;
    location?: string;
}

export default function NewAlbum() {
    const [formData, setFormData] = useState<AlbumFormData>({
        title: '',
        description: '',
        dateTime: '',
        location: '',
    });

    const scrollViewRef = useRef<ScrollView>(null);
    const titleInputRef = useRef<TextInput>(null);
    const descriptionInputRef = useRef<TextInput>(null);

    const [validationState, ssetValidationState] = useState({
        title: { isValid: false, error: null },
        description: { isValid: false, error: null },
    });
    const isFormReady = Object.values(validationState).every(state => state.isValid);

    const updateField = useCallback((field: keyof AlbumFormData, value: string): void => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    }, [setFormData]);

    const handleTitleInputFocus = useCallback(() => { }, []);
    const handleDescriptionInputFocus = useCallback(() => { }, []);

    const handleDateTimePress = useCallback(() => { }, []);
    const handleLocationPress = useCallback(() => { }, []);

    const handleModalClose = useCallback(() => {
        router.back();
    }, []);

    const handleSubmit = useCallback(() => { }, []);

    return (
        <View style={styles.container}>

            <SafeAreaView style={styles.safeArea}>

                {/* Appbar */}
                <View style={styles.appbar}>
                    <Text style={styles.appbarTitle}>Create New Album</Text>

                    <TouchableOpacity onPress={handleModalClose}>
                        <View style={styles.leading}>
                            <X size={21} color="black" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleSubmit}>
                        <View style={[styles.action,
                        isFormReady && styles.actionReady
                        ]}>
                            <Text style={[styles.actionText,
                            isFormReady && styles.actionTextReady
                            ]}>Next</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }} >
                    <ScrollView style={{ flex: 1 }}>


                        {/* Album Cover */}
                        <View style={{ marginBottom: 16 }}>
                            <AlbumCoverField
                                children={
                                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                        <Images size={45} color="grey" />
                                        <TouchableOpacity>

                                            <View style={{ marginTop: 16, backgroundColor: 'white', padding: 8, paddingHorizontal: 16, borderRadius: 100 }}>
                                                <Text>Add Cover</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                }
                                titleInputComponent={
                                    <TextInput
                                        ref={titleInputRef}
                                        value={formData.title}
                                        onChangeText={(title) => updateField('title', title)}
                                        onFocus={handleTitleInputFocus}
                                        onBlur={() => { }}
                                        placeholder="Album Title..."
                                        placeholderTextColor="#999"
                                        style={styles.titleInput}
                                        multiline={false}
                                        maxLength={20}
                                        cursorColor='#09ADA9'
                                        autoCorrect={false}
                                        autoCapitalize="words"
                                        spellCheck={false}
                                        keyboardType="default"
                                        returnKeyType="done"
                                    />
                                } />
                        </View>

                        {/* Extra Fields */}
                        <View style={{ marginBottom: 16 }}>
                            <AlbumExtraFields
                                onDateTimePress={handleDateTimePress}
                                onLocationPress={handleLocationPress}
                                dateTimeValue={formData.dateTime}
                                locationValue={formData.location}
                                inputComponent={
                                    <TextInput
                                        ref={descriptionInputRef}
                                        placeholder="What should your guests know?"
                                        placeholderTextColor="#999"
                                        value={formData.description}
                                        style={styles.descriptionInput}
                                        multiline={true}
                                        textAlignVertical="top"
                                        maxLength={500}

                                    />
                                } />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 16,
    },
    safeArea: {
        flex: 1,
        padding: 16,
    },

    appbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // paddingHorizontal: 16,
        paddingVertical: 16,

    },
    leading: {
        backgroundColor: 'white',
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100,
    },
    appbarTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'black',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',

    },
    action: {
        backgroundColor: 'white',
        padding: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    actionText: {
        fontSize: 18,
    },
    actionReady: {},
    actionTextReady: {},

    titleInput: {
        width: '100%',
        height: 56,
        fontSize: 32,
        textAlign: 'center',
    },

    descriptionInput: {
        fontSize: 14,
        color: '#333',
        width: '100%',
        textAlign: 'center',
    },


});