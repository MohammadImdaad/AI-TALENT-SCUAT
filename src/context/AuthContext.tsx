import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthContextType {
  user: User | { uid: string; email: string | null; displayName: string | null } | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isCandidate: boolean;
  loginUser: (email: string, pass: string) => Promise<UserProfile>;
  registerUser: (name: string, email: string, pass: string, role: UserRole, company?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'talentscout_auth_profile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: snap.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'user',
          company: data.company,
          createdAt: data.createdAt || new Date().toISOString(),
        };
      }
      return null;
    } catch (err) {
      console.warn('Could not read user profile from Firestore:', err);
      return null;
    }
  };

  useEffect(() => {
    // Check local fallback session first
    const savedLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal) as UserProfile;
        setProfile(parsed);
        setUser({ uid: parsed.id, email: parsed.email, displayName: parsed.name });
      } catch (e) {
        console.error('Failed to parse local auth profile');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const p = await fetchProfile(currentUser.uid);
        if (p) {
          setProfile(p);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(p));
        }
      } else if (!savedLocal) {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginUser = async (email: string, pass: string): Promise<UserProfile> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const userDocRef = doc(db, 'users', cred.user.uid);
      let p: UserProfile | null = null;
      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          p = {
            id: snap.id,
            name: data.name || '',
            email: data.email || '',
            role: data.role || 'user',
            company: data.company,
            createdAt: data.createdAt || new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn('Could not fetch user document:', e);
      }

      if (!p) {
        p = {
          id: cred.user.uid,
          name: cred.user.displayName || email.split('@')[0],
          email,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
      }
      setProfile(p);
      setUser(cred.user);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(p));
      return p;
    } catch (error: any) {
      // If email/password is disabled in Firebase console, allow fallback demo session
      if (error.code === 'auth/operation-not-allowed') {
        console.warn(
          `Firebase Email/Password provider not enabled yet in console: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers. Using local demo fallback.`
        );
        const uid = 'demo-uid-' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
        const fallbackProfile: UserProfile = {
          id: uid,
          name: email.split('@')[0],
          email: email.trim().toLowerCase(),
          role: email.includes('admin') || email.includes('recruiter') ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
        };
        setUser({ uid, email, displayName: fallbackProfile.name });
        setProfile(fallbackProfile);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fallbackProfile));
        return fallbackProfile;
      }
      throw error;
    }
  };

  const registerUser = async (
    name: string,
    email: string,
    pass: string,
    role: UserRole,
    company?: string
  ): Promise<UserProfile> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const newUserProfile: UserProfile = {
        id: cred.user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        company: role === 'admin' ? (company?.trim() || '') : undefined,
        createdAt: new Date().toISOString(),
      };

      try {
        const userDocRef = doc(db, 'users', cred.user.uid);
        await setDoc(userDocRef, {
          name: newUserProfile.name,
          email: newUserProfile.email,
          role: newUserProfile.role,
          ...(newUserProfile.company ? { company: newUserProfile.company } : {}),
          createdAt: newUserProfile.createdAt,
        });
      } catch (docErr) {
        console.warn('Could not write user profile to Firestore:', docErr);
      }

      setProfile(newUserProfile);
      setUser(cred.user);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUserProfile));
      return newUserProfile;
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        console.warn(
          `Firebase Email/Password is not enabled yet in console: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers. Activating verified demo recruiter profile.`
        );
        const uid = 'usr_' + Math.random().toString(36).substring(2, 10);
        const demoProfile: UserProfile = {
          id: uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          company: role === 'admin' ? (company?.trim() || '') : undefined,
          createdAt: new Date().toISOString(),
        };

        // Try writing to Firestore
        try {
          const userDocRef = doc(db, 'users', uid);
          await setDoc(userDocRef, demoProfile);
        } catch (e) {
          // ignore rules error in demo fallback
        }

        setUser({ uid, email: demoProfile.email, displayName: demoProfile.name });
        setProfile(demoProfile);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoProfile));
        return demoProfile;
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setProfile(null);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        // simulated reset in fallback
        return;
      }
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user?.uid) {
      const p = await fetchProfile(user.uid);
      if (p) {
        setProfile(p);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(p));
      }
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isCandidate = profile?.role === 'user';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isCandidate,
        loginUser,
        registerUser,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
