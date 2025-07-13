import { useThemeStyles } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SubscriptionPlan {
    id: string;
    name: string;
    price: string;
    period: string;
    features: string[];
    recommended?: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
    {
        id: "free",
        name: "Free",
        price: "$0",
        period: "forever",
        features: [
            "Basic photo storage",
            "Limited album creation",
            "Standard resolution",
            "Community support"
        ]
    },
    {
        id: "pro",
        name: "Pro",
        price: "$9.99",
        period: "per month",
        recommended: true,
        features: [
            "Unlimited photo storage",
            "Unlimited album creation", 
            "High resolution uploads",
            "Advanced editing tools",
            "Priority support",
            "Cloud backup"
        ]
    },
    {
        id: "family",
        name: "Family",
        price: "$19.99",
        period: "per month",
        features: [
            "Everything in Pro",
            "Up to 6 family members",
            "Shared family albums",
            "Parental controls",
            "Family collaboration tools",
            "Enhanced privacy settings"
        ]
    }
];

export default function SubscriptionPage() {
    const themeStyles = useThemeStyles();

    const renderPlan = (plan: SubscriptionPlan) => (
        <View
            key={plan.id}
            style={[
                styles.planCard,
                { 
                    backgroundColor: themeStyles.colors.background.card,
                    borderColor: plan.recommended 
                        ? themeStyles.colors.primary 
                        : themeStyles.colors.border.light 
                },
                plan.recommended && styles.recommendedCard
            ]}
        >
            {plan.recommended && (
                <View style={[styles.recommendedBadge, { backgroundColor: themeStyles.colors.primary }]}>
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
            )}
            
            <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: themeStyles.colors.text.primary }]}>
                    {plan.name}
                </Text>
                <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: themeStyles.colors.text.primary }]}>
                        {plan.price}
                    </Text>
                    <Text style={[styles.period, { color: themeStyles.colors.text.secondary }]}>
                        {plan.period}
                    </Text>
                </View>
            </View>

            <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                        <Ionicons 
                            name="checkmark-circle" 
                            size={20} 
                            color={themeStyles.colors.status.success} 
                        />
                        <Text style={[styles.featureText, { color: themeStyles.colors.text.secondary }]}>
                            {feature}
                        </Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity 
                style={[
                    styles.selectButton,
                    plan.recommended 
                        ? { backgroundColor: themeStyles.colors.primary }
                        : { 
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            borderColor: themeStyles.colors.primary 
                        }
                ]}
                onPress={() => {
                    // Placeholder for selection logic
                    console.log(`Selected ${plan.name} plan`);
                }}
            >
                <Text style={[
                    styles.selectButtonText,
                    { 
                        color: plan.recommended 
                            ? '#FFFFFF' 
                            : themeStyles.colors.primary 
                    }
                ]}>
                    {plan.id === 'free' ? 'Current Plan' : 'Select Plan'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <>
            <Stack.Screen 
                options={{
                    title: "Subscription Plans",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: themeStyles.colors.background.header,
                    },
                    headerTitleStyle: {
                        color: themeStyles.colors.text.primary,
                    },
                    headerTintColor: themeStyles.colors.text.primary,
                }}
            />
            <ScrollView 
                style={[styles.container, { backgroundColor: themeStyles.colors.background.main }]}
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: themeStyles.colors.text.primary }]}>
                        Choose Your Plan
                    </Text>
                    <Text style={[styles.subtitle, { color: themeStyles.colors.text.secondary }]}>
                        Select the perfect plan for your photo storage needs. 
                        You can upgrade or downgrade at any time.
                    </Text>
                </View>

                <View style={styles.plansContainer}>
                    {subscriptionPlans.map(renderPlan)}
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: themeStyles.colors.text.tertiary }]}>
                        All plans include basic security features and regular updates.
                        Payment is processed securely and you can cancel anytime.
                    </Text>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    header: {
        marginBottom: 32,
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 22,
    },
    plansContainer: {
        gap: 20,
    },
    planCard: {
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        position: "relative",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    recommendedCard: {
        borderWidth: 2,
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    recommendedBadge: {
        position: "absolute",
        top: -8,
        alignSelf: "center",
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 12,
    },
    recommendedText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
    planHeader: {
        marginBottom: 20,
        alignItems: "center",
    },
    planName: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4,
    },
    price: {
        fontSize: 32,
        fontWeight: "bold",
    },
    period: {
        fontSize: 16,
    },
    featuresContainer: {
        marginBottom: 24,
        gap: 12,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    featureText: {
        fontSize: 16,
        flex: 1,
    },
    selectButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: "center",
    },
    selectButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    footer: {
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
    },
    footerText: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
});