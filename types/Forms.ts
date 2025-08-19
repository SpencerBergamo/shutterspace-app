interface AuthFormData {
    email: string | null;
    password: string | null;
}

interface AuthFormErrors {
    email: string | null;
    password: string | null;
}

export type { AuthFormData, AuthFormErrors };
