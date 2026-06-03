import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  doc, 
  getDocFromServer, 
  getFirestore 
} from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Safe check to verify if browser environment supports/allows IndexedDB storage cache
function isPersistenceSupported() {
  try {
    if (typeof window === "undefined") return false;
    const idb = window.indexedDB;
    if (!idb) return false;
    // Attempt local storage test access to verify third-party sandboxing controls
    localStorage.setItem("zendenta_persistence_test", "ok");
    localStorage.removeItem("zendenta_persistence_test");
    return true;
  } catch (e) {
    return false;
  }
}

let dbInstance;
if (isPersistenceSupported()) {
  try {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (error) {
    console.warn("Firestore offline persistence failed to initialize. Falling back to default getFirestore:", error);
    dbInstance = getFirestore(app);
  }
} else {
  console.log("Firestore persistence not supported or access denied (sandboxed context). Initializing standard Firestore instance.");
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

const appCheckSiteKey = (import.meta as any)?.env?.VITE_RECAPTCHA_SITE_KEY as string | undefined;
if (appCheckSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn("App Check initialization failed:", error);
  }
}

// Operational types for structured error logging
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("client is offline")) {
      console.error("Please check your Firebase configuration: the client is offline.");
    }
  }
}
testConnection();

export default app;
