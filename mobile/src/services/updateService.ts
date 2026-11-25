
import axios from "axios";

export interface UpdateInfo {
    version: string;
    versionCode: number;
    downloadUrl: string;
    releaseNotes: string;
    minimumVersion: string;
    forceUpdate: boolean;
}

const UPDATE_JSON_URL =
    "https://raw.githubusercontent.com/manan2806/AI-Interview-Assist/main/update.json";

// Fetch latest update information from GitHub
export const fetchLatestUpdate = async (): Promise<UpdateInfo> => {
    try {
        const response = await axios.get<UpdateInfo>(
            UPDATE_JSON_URL,
            {
                timeout: 15000,
                headers: {
                    "Cache-Control": "no-cache",
                },
                params: {
                    timestamp: Date.now(),
                },
            }
        );

        const data = response.data;

        if (
            !data.version ||
            !Number.isInteger(data.versionCode) ||
            data.versionCode <= 0 ||
            !data.downloadUrl ||
            !data.minimumVersion
        ) {
            throw new Error("Invalid update information.");
        }

        if (!data.downloadUrl.startsWith("https://")) {
            throw new Error("Invalid APK download URL.");
        }

        return data;
    } catch (error) {
        console.log("Update Check Error:", error);
        throw error;
    }
};

// Compare installed and latest app versions
export const isUpdateAvailable = (
    currentVersionCode: number,
    latestVersionCode: number
): boolean => {
    return latestVersionCode > currentVersionCode;
};
