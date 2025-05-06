// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { profilesService } from "../lib/profiles";

const AuthContext = createContext({
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUserProfile = async (userId) => {
    try {
      const profileData = await profilesService.getProfile(userId);
      if (profileData) {
        setProfile(profileData);
        setIsAdmin(Boolean(profileData.is_admin));
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    // Listen for auth state changes.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Get the current session.
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          loadUserProfile(session.user.id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error getting session:", err);
        setError(err.message);
        setLoading(false);
      });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (data) => {
    try {
      // Attempt to sign up the user.
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          ...data.options,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
  
      // If there's additional profile data, create (or upsert) the profile.
      if (authData.user && data.options?.data) {
        await profilesService.createProfile(authData.user.id, data.options.data);
      }
  
      // Sign the user out immediately to prevent auto-login.
      await supabase.auth.signOut();
  
      // Return success; the Register component will handle showing the message and redirection.
      return { data: authData, error: null };
    } catch (err) {
      console.error("Error in signUp:", err);
      return { data: null, error: err };
    }
  };
  
  
  const signIn = async (data) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      if (authData.user) {
        setUser(authData.user);
        await loadUserProfile(authData.user.id);
      }
      return { data: authData, error: null };
    } catch (err) {
      console.error("Error in signIn:", err);
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      return { error: null };
    } catch (err) {
      console.error("Error in signOut:", err);
      return { error: err };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedProfile = await profilesService.updateProfile(profileData);
      setProfile(updatedProfile);
      return { data: updatedProfile, error: null };
    } catch (err) {
      console.error("Error updating profile:", err);
      return { data: null, error: err };
    }
  };

  const value = {
    signUp,
    signIn,
    signOut,
    updateProfile,
    user,
    profile,
    isAdmin,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
