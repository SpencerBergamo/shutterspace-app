import { StyleSheet, useWindowDimensions, View } from "react-native";

interface AlbumCoverFieldProps {
    children: React.ReactNode;
    titleInputComponent: React.ReactNode;
}

export default function AlbumCoverField({ children, titleInputComponent }: AlbumCoverFieldProps) {
    const { width } = useWindowDimensions();
    const containerWidth = width - 32;
    const polaroidHeight = width * (5 / 4);
    const polaroidPadding = 16;
    const availableInnerHeight = polaroidHeight - (polaroidPadding * 2);
    const imageHeight = availableInnerHeight * 0.85;
    const titleAreaHeight = availableInnerHeight - imageHeight;
    const safeImageAreaHeight = Math.max(0, imageHeight);
    const safeTitleAreaHeight = Math.max(0, titleAreaHeight);

    return (

        <View style={[styles.polaroidContainer, { height: polaroidHeight, width: containerWidth }]}>

            <View style={[styles.imageArea, { height: safeImageAreaHeight }]}>
                {children}
            </View>

            <View style={[styles.titleInputArea, { height: safeTitleAreaHeight }]}>
                {titleInputComponent}
            </View>

        </View>
    );
}


const styles = StyleSheet.create({
    polaroidContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        borderColor: 'transparent',
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },

    imageArea: {
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    titleInputArea: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },

});

/* 

<TextInput
                        value={value}
                        onChangeText={onTitleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={handleBlur}
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
                        {...props}
                    />*/