import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { profilesService } from '../lib/profiles';

// Create context with default values
const AuthContext = createContext({
  signUp: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  updateProfile: () => Promise.resolve(),
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  error: null
});

// Export the useAuth hook
export const useAuth = () => useContext(AuthContext);

// AuthProvider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    console.log("AuthProvider: Initializing auth state");
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        // Check active sessions and set the user
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setError(sessionError.message);
          setLoading(false);
          return;
        }
        
        const session = data?.session;
        console.log("Session data:", session ? "Session exists" : "No session");
        
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
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
      }
    };

    initAuth();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      console.log("Auth state changed:", event, session ? "Session exists" : "No session");
      
      try {
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
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
    });

    return () => {
      isMounted = false;
      console.log("Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile
  const loadUserProfile = async (userId) => {
    try {
      console.log("Loading user profile for:", userId);
      const profileData = await profilesService.getProfile();
      console.log("Profile data loaded:", profileData ? "Profile exists" : "No profile");
      
      if (profileData) {
        setProfile(profileData);
        setIsAdmin(profileData.is_admin || false);
      } else {
        // If no profile exists, create one
        const newProfile = await profilesService.createProfile(userId, {});
        setProfile(newProfile);
        setIsAdmin(newProfile.is_admin || false);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const updatedProfile = await profilesService.updateProfile(profileData);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      throw error;
    }
  };

  // Auth context value
  const value = {
    signUp: async (data) => {
      try {
        console.log("Signing up with:", { email: data.email, metadata: data.options?.data });
        
        // IMPORTANT: For development, we're disabling email confirmation
        const options = {
          ...data.options,
          emailRedirectTo: window.location.origin,
          // This is critical for development - disable email confirmation
          data: {
            ...data.options?.data
          }
        };
        
        const result = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options
        });
        
        if (result.error) {
          console.error("Sign up error:", result.error);
          setError(result.error.message);
          throw result.error;
        } else {
          console.log("Sign up successful:", result.data);
          
          // For development, we'll automatically create a profile
          if (result.data.user) {
            try {
              await profilesService.createProfile(result.data.user.id, data.options?.data || {});
            } catch (profileError) {
              console.error("Error creating profile after signup:", profileError);
              // Don't throw here, as the signup was successful
            }
          }
        }
        
        return result;
      } catch (error) {
        console.error("Error in signUp:", error);
        setError(error.message);
        throw error;
      }
    },
    signIn: async (data) => {
      try {
        console.log("Signing in with:", { email: data.email });
        
        // Clear any previous errors
        setError(null);
        
        const result = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });
        
        if (result.error) {
          console.error("Sign in error:", result.error);
          setError(result.error.message);
          throw result.error;
        } else if (!result.data?.user) {
          const noUserError = new Error("No user returned from authentication");
          console.error("Sign in error:", noUserError);
          setError(noUserError.message);
          throw noUserError;
        } else {
          console.log("Sign in successful:", result.data.user.id);
          setUser(result.data.user);
          
          // Load the user profile after successful login
          await loadUserProfile(result.data.user.id);
        }
        
        return result;
      } catch (error) {
        console.error("Error in signIn:", error);
        setError(error.message);
        throw error;
      }
    },
    signOut: async () => {
      try {
        console.log("Signing out");
        setError(null);
        
        const result = await supabase.auth.signOut();
        
        if (result.error) {
          console.error("Sign out error:", result.error);
          setError(result.error.message);
          throw result.error;
        } else {
          console.log("Sign out successful");
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
        
        return result;
      } catch (error) {
        console.error("Error in signOut:", error);
        setError(error.message);
        throw error;
      }
    },
    updateProfile,
    user,
    profile,
    isAdmin,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}