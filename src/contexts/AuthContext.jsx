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
        // Ensure isAdmin is set as a boolean
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
              // First, try to get the profile for the user
              let profileData;
              try {
                profileData = await profilesService.getProfile(result.data.user.id);
              } catch (getError) {
                // If no profile is found, we'll assume it doesn't exist
                profileData = null;
              }
              if (profileData) {
                // If a profile exists, update it with the new metadata
                console.log("Profile already exists, updating metadata");
                await profilesService.updateProfile({
                  first_name: data.options.data.first_name,
                  last_name: data.options.data.last_name,
                });
              } else {
                // If no profile exists, create one
                await profilesService.createProfile(result.data.user.id, data.options.data);
                console.log("Profile created with metadata:", data.options.data);
              }
            } catch (profileError) {
              console.error("Error in profile creation/updating:", profileError);
              // Optionally, setError(profileError.message);
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
            try {
              await loadUserProfile(result.data.user.id);
            } catch (profileError) {
              console.error("Error loading profile after sign in:", profileError);
            }
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

// export const useAuth = () => useContext(AuthContext);
