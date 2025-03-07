// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { profilesService } from '../lib/profiles';

const AuthContext = createContext({
  signUp: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  updateProfile: () => Promise.resolve(),
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  initialized: false,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  const loadUserProfile = async (userId) => {
    try {
      console.log("Loading user profile for:", userId);
      const profileData = await profilesService.getProfile(userId);
      console.log("Profile data loaded:", profileData);
      if (profileData) {
        setProfile(profileData);
        // Set isAdmin based on the profile field (ensure the database field is boolean)
        setIsAdmin(Boolean(profileData.is_admin));
        console.log("Profile set, isAdmin:", Boolean(profileData.is_admin));
      } else {
        console.log("No profile data returned");
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        console.log("AuthProvider: Initializing auth state");
        // Attempt to read a cached session from localStorage
        const cachedSessionStr = localStorage.getItem('supabase.auth.token');
        if (cachedSessionStr) {
          try {
            const cachedSession = JSON.parse(cachedSessionStr);
            // Depending on your version, the session structure might be different.
            // This is an optional quick-check before calling getSession().
            if (cachedSession && cachedSession.currentSession && cachedSession.currentSession.user) {
              console.log("Found cached session:", cachedSession.currentSession.user.id);
              setUser(cachedSession.currentSession.user);
              // Start loading profile in background
              loadUserProfile(cachedSession.currentSession.user.id);
            }
          } catch (parseError) {
            console.error("Error parsing cached session:", parseError);
          }
        }
        // Now call getSession to update the session from Supabase
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setError(sessionError.message);
          setLoading(false);
          setInitialized(true);
          return;
        }
        const session = data?.session;
        console.log("Session data:", session ? "Session exists" : "No session");
        if (session?.user) {
          console.log("User found in session:", session.user.id);
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          console.log("No user in session");
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Unexpected error during auth initialization:", err);
        setError(err.message);
        setLoading(false);
      } finally {
        setInitialized(true);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        console.log("Auth state changed:", event, session ? "Session exists" : "No session");
        try {
          if (session?.user) {
            console.log("User found in auth change:", session.user.id, "Event:", event);
            setUser(session.user);
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
              await loadUserProfile(session.user.id);
            }
          } else {
            console.log("No user in auth change. Event:", event);
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
            setLoading(false);
          }
        } catch (err) {
          if (!isMounted) return;
          console.error("Error in auth state change handler:", err);
          setError(err.message);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      console.log("Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    signUp: async (data) => {
      try {
        console.log("Signing up with:", { email: data.email, metadata: data.options?.data });
        const options = {
          ...data.options,
          emailRedirectTo: window.location.origin,
        };
        const result = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options,
        });
        if (result.error) {
          console.error("Sign up error:", result.error);
          setError(result.error.message);
        } else {
          console.log("Sign up successful:", result.data);
          if (result.data.user && data.options?.data) {
            try {
              await profilesService.createProfile(result.data.user.id, data.options.data);
              console.log("Profile created with metadata:", data.options.data);
            } catch (profileError) {
              if (profileError.code === "23505") {
                console.log("Profile already exists, skipping creation.");
              } else {
                console.error("Error creating profile:", profileError);
                setError(profileError.message);
              }
            }
          }
          // Force sign out after registration so the user is not auto-logged in.
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) {
            console.error("Error during sign out after registration:", signOutError);
          } else {
            console.log("User signed out after registration.");
            setUser(null);
          }
        }
        return result;
      } catch (err) {
        console.error("Error in signUp:", err);
        setError(err.message);
        throw err;
      }
    },
    signIn: async (data) => {
      try {
        console.log("Signing in with:", { email: data.email });
        const result = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (result.error) {
          console.error("Sign in error:", result.error);
          setError(result.error.message);
        } else {
          console.log("Sign in successful:", result.data.user.id);
          setUser(result.data.user);
          if (result.data.user) {
            await loadUserProfile(result.data.user.id);
          }
        }
        return result;
      } catch (err) {
        console.error("Error in signIn:", err);
        setError(err.message);
        throw err;
      }
    },
    signOut: async () => {
      try {
        console.log("Signing out");
        const result = await supabase.auth.signOut();
        if (result.error) {
          console.error("Sign out error:", result.error);
          setError(result.error.message);
        } else {
          console.log("Sign out successful");
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
        return result;
      } catch (err) {
        console.error("Error in signOut:", err);
        setError(err.message);
        throw err;
      }
    },
    updateProfile: async (profileData) => {
      try {
        const updatedProfile = await profilesService.updateProfile(profileData);
        setProfile(updatedProfile);
        return updatedProfile;
      } catch (err) {
        console.error("Error updating profile:", err);
        setError(err.message);
        throw err;
      }
    },
    user,
    profile,
    isAdmin,
    loading,
    initialized,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
