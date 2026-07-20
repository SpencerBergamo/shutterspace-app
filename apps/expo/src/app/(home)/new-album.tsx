import { TextInputStyles } from "@/src/constants/styles";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { validateAlbumTitle, validateDescription } from "@/src/utils/validators";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { router, Stack } from "expo-router";
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Keyboard, ScrollView, Switch, Text, TextInput, View } from "react-native";

type NewAlbumFormData = {
   title: string;
   description: string;
   openInvites: boolean;
};

export default function NewAlbumScreen() {
   const { colors } = useAppTheme();
   const navigation = useNavigation();
   const createNewAlbum = useMutation(api.albums.createNewAlbum);

   const titleInputRef = useRef<TextInput>(null);
   const descriptionInputRef = useRef<TextInput>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);

   const {
      control,
      handleSubmit,
      reset,
      formState: { errors, isValid, isDirty },
   } = useForm<NewAlbumFormData>({
      mode: "onChange",
      defaultValues: {
         title: "",
         description: "",
         openInvites: true,
      },
   });

   usePreventRemove(isDirty, ({ data }) => {
      Keyboard.dismiss();
      Alert.alert(
         "Unsaved Changes",
         "You have unsaved changes. Are you sure you want to leave?",
         [
            { text: "Cancel", style: "cancel" },
            {
               text: "Leave",
               style: "destructive",
               onPress: () => navigation.dispatch(data.action),
            },
         ],
      );
   });

   const onCreate = async (data: NewAlbumFormData) => {
      setIsSubmitting(true);
      try {
         const albumId = await createNewAlbum({
            title: data.title.trim(),
            description: data.description.trim() || undefined,
            openInvites: data.openInvites,
         });

         reset(data);
         router.dismiss();
         router.push(`/(home)/album/${albumId}`);
      } catch (error) {
         console.error("Failed to create album:", error);
         Alert.alert(
            "Couldn't Create Album",
            error instanceof Error ? error.message : "Please try again.",
         );
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <>
         <Stack.Screen options={{ gestureEnabled: !isDirty }} />

         <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button onPress={() => router.back()}>
               <Stack.Toolbar.Label>Cancel</Stack.Toolbar.Label>
            </Stack.Toolbar.Button>
         </Stack.Toolbar>

         <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
               icon="checkmark"
               disabled={!isValid || isSubmitting}
               onPress={handleSubmit(onCreate)}
            />
         </Stack.Toolbar>

         <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustContentInsets
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ padding: 16 }}
         >
            <Controller
               control={control}
               name="title"
               rules={{
                  required: "Don't forget to title your album!",
                  validate: (value) => validateAlbumTitle(value) ?? true,
               }}
               render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                     ref={titleInputRef}
                     autoFocus
                     value={value}
                     placeholder="Title"
                     placeholderTextColor={colors.caption}
                     maxLength={30}
                     autoCapitalize="sentences"
                     autoCorrect
                     returnKeyType="done"
                     selectionColor={colors.primary}
                     onChangeText={onChange}
                     onBlur={onBlur}
                     onSubmitEditing={() => descriptionInputRef.current?.focus()}
                     style={[
                        TextInputStyles,
                        {
                           backgroundColor: colors.surface,
                           borderColor: colors.border,
                           color: colors.text,
                           borderCurve: "continuous",
                        },
                     ]}
                  />
               )}
            />
            <View style={{ height: 21, justifyContent: "center", paddingHorizontal: 8 }}>
               {errors.title ? (
                  <Text selectable style={{ color: colors.danger }}>
                     {errors.title.message}
                  </Text>
               ) : null}
            </View>

            <Controller
               control={control}
               name="description"
               rules={{
                  validate: (value) => validateDescription(value) ?? true,
               }}
               render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                     ref={descriptionInputRef}
                     value={value}
                     placeholder="Description (optional)"
                     placeholderTextColor={colors.caption}
                     maxLength={300}
                     multiline
                     textAlignVertical="top"
                     autoCapitalize="sentences"
                     returnKeyType="done"
                     selectionColor={colors.primary}
                     onChangeText={onChange}
                     onBlur={onBlur}
                     style={[
                        TextInputStyles,
                        {
                           minHeight: 100,
                           backgroundColor: colors.surface,
                           borderColor: colors.border,
                           color: colors.text,
                           borderCurve: "continuous",
                        },
                     ]}
                  />
               )}
            />
            <View style={{ height: 21, justifyContent: "center", paddingHorizontal: 8 }}>
               {errors.description ? (
                  <Text selectable style={{ color: colors.danger }}>
                     {errors.description.message}
                  </Text>
               ) : null}
            </View>

            <Controller
               control={control}
               name="openInvites"
               render={({ field: { onChange, value } }) => (
                  <View
                     style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        paddingVertical: 8,
                        paddingHorizontal: 4,
                     }}
                  >
                     <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "500" }}>
                           Open invites
                        </Text>
                        <Text style={{ color: colors.caption, fontSize: 13 }}>
                           Anyone with a link can join without approval
                        </Text>
                     </View>
                     <Switch
                        value={value}
                        onValueChange={onChange}
                        trackColor={{ false: colors.grey2, true: colors.primary }}
                     />
                  </View>
               )}
            />
         </ScrollView>
      </>
   );
}
