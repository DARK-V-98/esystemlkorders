
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User as FirebaseUser,
  type AuthProvider as FirebaseAuthProvider
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // Import db
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions
import type { AuthUser } from '@/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast(); // Initialize useToast

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        let userRole: AuthUser['role'] = 'user'; // Default role

        if (userDocSnap.exists()) {
          userRole = userDocSnap.data()?.role || 'user';
        }

        const userDataToSave: Partial<AuthUser> & { lastLogin?: any, createdDate?: any } = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: userRole, 
          lastLogin: serverTimestamp(),
        };

        if (!userDocSnap.exists()) {
          userDataToSave.createdDate = serverTimestamp();
        }
        
        await setDoc(userDocRef, userDataToSave, { merge: true });

        const appUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: userRole, 
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider as FirebaseAuthProvider);
      // onAuthStateChanged will handle success and setLoading(false)
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email || "your email";
        toast({
          variant: "destructive",
          title: "Account Exists",
          description: `An account with ${email} already exists, likely with an email and password. Please sign in using that method. If you'd like to connect your Google account, you can do so from your profile settings in the future.`,
          duration: 8000, // Longer duration for important messages
        });
        setLoading(false); // Stop loading as the process is halted for user action
        // We don't re-throw here to allow the user to try other sign-in methods on the page.
      } else {
        console.error("Error signing in with Google:", error);
        setLoading(false); // Stop loading on other errors
        throw error; // Re-throw other errors to be caught by the calling component (e.g., LoginPage)
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle success and setLoading(false)
    } catch (error) {
      console.error("Error signing in with email:", error);
      setLoading(false); // Stop loading on error
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle user data saving and setLoading(false)
    } catch (error) {
      console.error("Error signing up with email:", error);
      setLoading(false); // Stop loading on error
      throw error;
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      router.push('/login'); 
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // setLoading(false) is managed by onAuthStateChanged when user becomes null, 
      // or if an error occurs and we don't redirect.
      // However, if signOut is quick and onAuthStateChanged runs setting user to null, then loading to false,
      // this might be redundant or cause a quick flicker if user is already null.
      // It's generally safe as onAuthStateChanged is the source of truth for user state.
      // If there's an issue with remaining loading, explicitly set setLoading(false) here.
      if (auth.currentUser === null) { // Ensure Firebase auth state is actually null
          setLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
