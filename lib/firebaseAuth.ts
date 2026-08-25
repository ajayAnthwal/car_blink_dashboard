import { auth } from "./firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

let confirmationResultStore: ConfirmationResult | null = null;

export const setupRecaptcha = (containerId: string) => {
  if (typeof window === "undefined") return null;

  try {
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {}
    }

    const appVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {},
    });

    (window as any).recaptchaVerifier = appVerifier;
    return appVerifier;
  } catch (error) {
    console.error("Error setting up RecaptchaVerifier:", error);
    return null;
  }
};

export const sendFirebasePhoneOtp = async (phoneNumber: string, containerId: string = "recaptcha-container") => {
  const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber.replace(/\D/g, "")}`;
  const appVerifier = setupRecaptcha(containerId);

  if (!appVerifier) {
    throw new Error("Recaptcha verifier initialization failed.");
  }

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    confirmationResultStore = confirmationResult;
    return confirmationResult;
  } catch (error: any) {
    console.error("Firebase sendOtp error:", error);
    throw error;
  }
};

export const verifyFirebasePhoneOtp = async (otpCode: string) => {
  if (!confirmationResultStore) {
    throw new Error("No active OTP session. Please request a new OTP.");
  }

  try {
    const userCredential = await confirmationResultStore.confirm(otpCode);
    const idToken = await userCredential.user.getIdToken();
    return { user: userCredential.user, idToken };
  } catch (error: any) {
    console.error("Firebase verifyOtp error:", error);
    throw error;
  }
};
