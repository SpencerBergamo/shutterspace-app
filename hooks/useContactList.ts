import * as Contacts from 'expo-contacts';
import { useEffect, useState } from "react";

interface UseContactListResult {
    isLoading: boolean;
    hasPermission: boolean;
    contacts: Contacts.Contact[] | null;
    requestPermissions: () => Promise<void>;
}

export default function useContactList(): UseContactListResult {
    const [status, setStatus] = useState<Contacts.PermissionStatus>(Contacts.PermissionStatus.UNDETERMINED);
    const [contactState, setContactState] = useState<{
        isLoading: boolean,
        hasPermission: boolean,
        contacts: Contacts.Contact[] | null,
    }>({
        isLoading: true,
        hasPermission: false,
        contacts: null,
    });

    const requestPermissions = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            setStatus(status);
        } catch (e) {
            console.error('Failed to request permissions', e);
        }
    };


    useEffect(() => {
        const getContacts = async () => {
            try {
                const { status } = await Contacts.getPermissionsAsync();
                setStatus(status);

                if (status !== Contacts.PermissionStatus.GRANTED) return;

                const { data } = await Contacts.getContactsAsync({
                    fields: [
                        Contacts.Fields.Name,
                        Contacts.Fields.Image,
                        Contacts.Fields.PhoneticFirstName
                    ],
                });

                setContactState({
                    isLoading: false,
                    hasPermission: true,
                    contacts: data,
                });
            } catch (e) {
                console.error('Failed to check permissions', e);
            } finally {
                setContactState(prev => {
                    return {
                        ...prev,
                        isLoading: false,
                    }
                })
            }
        }

        getContacts();
    }, [status]);

    return {
        isLoading: contactState.isLoading,
        hasPermission: contactState.hasPermission,
        contacts: contactState.contacts,
        requestPermissions,
    }
}