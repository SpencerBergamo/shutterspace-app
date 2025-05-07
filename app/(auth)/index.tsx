import { Link, router } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function Welcome() {
    const { user, signInWithGoogle, signInWithApple } = useAuth();

    // Redirect if user is already authenticated
    useEffect(() => {
        if (user) {
            router.replace('../(app)/home');
        }
    }, [user]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Welcome to Shutterspace</Text>
                <Text style={styles.subtitle}>Your personal photo management app</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('../sign-up')}
                >
                    <Text style={styles.buttonText}>Continue with Email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.googleButton]}
                    onPress={signInWithGoogle}
                >
                    <Text style={styles.buttonText}>Continue with Google</Text>
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                    <TouchableOpacity
                        style={[styles.button, styles.appleButton]}
                        onPress={signInWithApple}
                    >
                        <Text style={styles.buttonText}>Continue with Apple</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="../sign-in" asChild>
                    <TouchableOpacity>
                        <Text style={styles.signInLink}>Sign In</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        justifyContent: 'space-between',
    },
    header: {
        marginTop: 60,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    buttonContainer: {
        gap: 12,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    googleButton: {
        backgroundColor: '#4285F4',
    },
    appleButton: {
        backgroundColor: '#000',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
    },
    footerText: {
        color: '#666',
    },
    signInLink: {
        color: '#007AFF',
        fontWeight: '600',
    },
}); 