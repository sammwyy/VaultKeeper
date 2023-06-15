import { decryptString, encryptString } from "./encryption";

const WELL_KNOWN_KEY = "vault-keeper-known-key"

export function isLockPinSetup() {
    return new Promise((resolve) => {
        chrome.storage.local.get([WELL_KNOWN_KEY], (result) => {
            const isSetup = result[WELL_KNOWN_KEY] !== undefined;
            resolve(isSetup);
        });
    })
}

export function isPinCorrect(pin: string) {
    return new Promise((resolve) => {
        chrome.storage.local.get([WELL_KNOWN_KEY], (result) => {
            const encryptedPin = result[WELL_KNOWN_KEY];
            if (encryptedPin) {
                const isCorrect = decryptString(encryptedPin, WELL_KNOWN_KEY) === pin;
                resolve(isCorrect);
            } else {
                resolve(false);
            }
        });
    })
}

function internalSetupLockPin(encryptedPin: string): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [WELL_KNOWN_KEY]: encryptedPin }, () => {
            resolve();
        });
    });
}

export async function setupLockPin(pin: string) {
    const encryptedPin = encryptString(pin, WELL_KNOWN_KEY);
    await internalSetupLockPin(encryptedPin);
}