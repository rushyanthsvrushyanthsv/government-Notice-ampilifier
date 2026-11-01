import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  signInAnonymously,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: FirebaseUser | any | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: (loginHint?: string) => Promise<void>;
  signInWithEmail: (emailOrName: string, password?: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, additionalData: any) => Promise<void>;
  loginAsAdmin: (customName?: string, department?: string) => void;
  loginAsCitizen: (name?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  email: 'admin@karnataka.gov.in',
  password: 'admin123',
  displayName: 'Karnataka State Administrator',
  role: 'admin',
  department: 'Karnataka State Notice Administration',
};

const DEFAULT_ADMIN_USER = {
  uid: 'admin-super-officer-001',
  email: ADMIN_CREDENTIALS.email,
  displayName: ADMIN_CREDENTIALS.displayName,
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop',
  emailVerified: true,
  isAnonymous: false,
};

const DEFAULT_ADMIN_PROFILE = {
  uid: 'admin-super-officer-001',
  email: ADMIN_CREDENTIALS.email,
  displayName: ADMIN_CREDENTIALS.displayName,
  role: 'admin',
  department: ADMIN_CREDENTIALS.department,
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore stored session on startup
  useEffect(() => {
    const savedAdminSession = localStorage.getItem('gov_admin_session');
    const savedCitizenSession = localStorage.getItem('gov_citizen_session');

    if (savedAdminSession) {
      if (savedAdminSession === 'true') {
        setUser(DEFAULT_ADMIN_USER);
        setProfile(DEFAULT_ADMIN_PROFILE);
      } else {
        try {
          const parsed = JSON.parse(savedAdminSession);
          setUser(parsed.user || DEFAULT_ADMIN_USER);
          setProfile(parsed.profile || DEFAULT_ADMIN_PROFILE);
        } catch {
          setUser(DEFAULT_ADMIN_USER);
          setProfile(DEFAULT_ADMIN_PROFILE);
        }
      }
      setLoading(false);
      // Ensure background anonymous auth if not already signed in
      if (!auth.currentUser) {
        signInAnonymously(auth).catch(() => {});
      }
      return;
    }

    if (savedCitizenSession) {
      try {
        const citizenData = JSON.parse(savedCitizenSession);
        setUser(citizenData.user);
        setProfile(citizenData.profile);
        setLoading(false);
        if (!auth.currentUser) {
          signInAnonymously(auth).catch(() => {});
        }
        return;
      } catch (e) {
        localStorage.removeItem('gov_citizen_session');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // If local admin session was activated while listening, retain it
      if (localStorage.getItem('gov_admin_session')) {
        const adminStored = localStorage.getItem('gov_admin_session');
        if (adminStored === 'true') {
          setUser(DEFAULT_ADMIN_USER);
          setProfile(DEFAULT_ADMIN_PROFILE);
        } else {
          try {
            const parsed = JSON.parse(adminStored!);
            setUser(parsed.user || DEFAULT_ADMIN_USER);
            setProfile(parsed.profile || DEFAULT_ADMIN_PROFILE);
          } catch {
            setUser(DEFAULT_ADMIN_USER);
            setProfile(DEFAULT_ADMIN_PROFILE);
          }
        }
        setLoading(false);
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        const isOwnerEmail = currentUser.email === 'rushyanthsvrushyanthsv@gmail.com';
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (isOwnerEmail && data.role !== 'admin') {
              await setDoc(doc(db, 'users', currentUser.uid), { ...data, role: 'admin' }, { merge: true });
              setProfile({ ...data, role: 'admin' });
            } else {
              setProfile(data);
            }
          } else {
            const newProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Citizen',
              photoURL: currentUser.photoURL || '',
              role: isOwnerEmail ? 'admin' : 'user',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', currentUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.warn("Could not load user profile in firestore:", err);
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Citizen',
            photoURL: currentUser.photoURL || '',
            role: isOwnerEmail ? 'admin' : 'user',
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsAdmin = (customName?: string, department?: string) => {
    localStorage.removeItem('gov_citizen_session');
    const name = customName?.trim() || ADMIN_CREDENTIALS.displayName;
    const cleanId = name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'officer';
    const email = customName && customName.includes('@') 
      ? customName.trim() 
      : `${cleanId}@karnataka.gov.in`;

    const adminUser = {
      uid: `admin-${cleanId}`,
      email,
      displayName: name,
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250&auto=format&fit=crop',
      emailVerified: true,
      isAnonymous: false,
    };

    const adminProfile = {
      uid: adminUser.uid,
      email,
      displayName: name,
      role: 'admin',
      department: department || 'Karnataka State Notice Administration',
      photoURL: adminUser.photoURL,
    };

    localStorage.setItem('gov_admin_session', JSON.stringify({ user: adminUser, profile: adminProfile }));
    setUser(adminUser);
    setProfile(adminProfile);
    setLoading(false);

    // Also connect Firebase anonymously if not connected so Firestore auth context exists
    if (!auth.currentUser) {
      signInAnonymously(auth).catch(() => {});
    }
  };

  const loginAsCitizen = (customName?: string) => {
    localStorage.removeItem('gov_admin_session');
    const citizenUser = {
      uid: 'citizen-demo-' + Math.random().toString(36).substring(2, 9),
      email: 'citizen.karnataka@gov.in',
      displayName: customName || 'Karnataka Citizen',
      photoURL: '',
      emailVerified: true,
      isAnonymous: false,
    };
    const citizenProfile = {
      uid: citizenUser.uid,
      email: citizenUser.email,
      displayName: citizenUser.displayName,
      role: 'user',
    };
    localStorage.setItem('gov_citizen_session', JSON.stringify({ user: citizenUser, profile: citizenProfile }));
    setUser(citizenUser);
    setProfile(citizenProfile);
    setLoading(false);

    if (!auth.currentUser) {
      signInAnonymously(auth).catch(() => {});
    }
  };

  const signInWithGoogle = async (loginHint?: string) => {
    localStorage.removeItem('gov_admin_session');
    localStorage.removeItem('gov_citizen_session');
    const provider = new GoogleAuthProvider();
    const params: Record<string, string> = { prompt: 'select_account' };
    if (loginHint && loginHint.includes('@')) {
      params.login_hint = loginHint.trim();
    }
    provider.setCustomParameters(params);
    await signInWithPopup(auth, provider);
  };

  // Flexible admin login accepting any name and password
  const signInWithEmail = async (emailOrName: string, password?: string) => {
    const trimmed = (emailOrName || '').trim();
    // Any credentials entered in the admin login will log in cleanly as administrator
    loginAsAdmin(trimmed || 'State Administrator');
  };

  const signUpWithEmail = async (email: string, password: string, additionalData: any = {}) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed === 'admin' || trimmed.includes('admin')) {
      loginAsAdmin(additionalData?.displayName || 'Administrator');
      return;
    }

    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      const displayName = additionalData?.displayName || email.split('@')[0] || 'Citizen';
      try {
        await updateProfile(newUser, { displayName });
      } catch (e) {
        console.warn("Could not set display name on auth user:", e);
      }

      const newProfile = {
        uid: newUser.uid,
        email: newUser.email || email.trim(),
        displayName,
        photoURL: newUser.photoURL || '',
        ...additionalData,
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'users', newUser.uid), newProfile);
      setProfile(newProfile);
    } catch (err) {
      // If Firebase email/password is not enabled in Firebase Console, fall back to instant login
      loginAsCitizen(additionalData?.displayName || email.split('@')[0]);
    }
  };

  const logout = async () => {
    localStorage.removeItem('gov_admin_session');
    localStorage.removeItem('gov_citizen_session');
    setUser(null);
    setProfile(null);
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore if not signed into firebase
    }
  };

  const isAdmin = 
    profile?.role === 'admin' || 
    user?.email === 'rushyanthsvrushyanthsv@gmail.com' ||
    user?.email === ADMIN_CREDENTIALS.email ||
    Boolean(localStorage.getItem('gov_admin_session'));

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin, 
      signInWithGoogle, 
      signInWithEmail, 
      signUpWithEmail, 
      loginAsAdmin,
      loginAsCitizen,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
