import * as Contacts from 'expo-contacts';
import { useEffect } from "react";


interface ContactResult {

}

export default function ContactList() {

    useEffect(() => {
        (async () => {
            const { status } = await Contacts.requestPermissionsAsync();

            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.Name, Contacts.Fields.Image],
                });

                if (data.length > 0) {
                    return data;
                }
            }
        })();
    }, []);
}