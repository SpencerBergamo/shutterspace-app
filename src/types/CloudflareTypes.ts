export interface ImageDirectUploadURLResponse {
    errors: string[];
    messages: string[];
    result: {
        id: string;
        uploadURL: string;
    };
    success: boolean;
}

export interface VideoDirectUploadURLResponse {
    uid: string;
    uploadURL: string;
    success: boolean;
    errors: string[];
    messages: string[];
}