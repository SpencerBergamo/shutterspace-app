import * as Contacts from 'expo-contacts';
import { useEffect, useState } from "react";

interface UseContactListResult {
    hasPermission: boolean;
    contacts: Contacts.Contact[] | null;
    requestPermissions: () => Promise<void>;
}

export default function useContactList(): UseContactListResult {
    const [permission, setPermission] = useState<Contacts.PermissionStatus>(Contacts.PermissionStatus.UNDETERMINED);
    const [contacts, setContacts] = useState<Contacts.Contact[] | null>(null);

    const requestPermissions = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            setPermission(status);
        } catch (e) {
            console.error('Failed to request permissions', e);
        }
    };


    useEffect(() => {
        const getContacts = async () => {
            try {
                const { status } = await Contacts.getPermissionsAsync();
                setPermission(status);

                if (status !== Contacts.PermissionStatus.GRANTED) return;

                const { data } = await Contacts.getContactsAsync({
                    fields: [
                        Contacts.Fields.Name,
                        Contacts.Fields.Image,
                        Contacts.Fields.PhoneticFirstName
                    ],
                });

                setContacts(data);
            } catch (e) {
                console.error('Failed to check permissions', e);
                setPermission(Contacts.PermissionStatus.UNDETERMINED);
            }
        }

        getContacts();
    }, [permission]);

    return {
        hasPermission: permission === Contacts.PermissionStatus.GRANTED,
        contacts,
        requestPermissions,
    }
}