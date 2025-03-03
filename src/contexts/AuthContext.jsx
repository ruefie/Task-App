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
      }
    };

    initAuth();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      console.log("Auth state changed:", event, session ? "Session exists" : "No session");
      
      try {
        if (session?.user) {
          console.log("User found in auth change:", session.user.id, "Event:", event);
          setUser(session.user);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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
      console.log("Profile data loaded:", profileData);
      
      if (profileData) {
        setProfile(profileData);
        setIsAdmin(profileData.is_admin || false);
        console.log("Profile set, isAdmin:", profileData.is_admin);
      } else {
        console.log("No profile data returned");
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
        
        // Disable email confirmation for development
        const options = {
          ...data.options,
          emailRedirectTo: window.location.origin,
        };
        
        const result = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options
        });
        
        if (result.error) {
          console.error("Sign up error:", result.error);
          
          // Transform error for better user experience
          if (result.error.message.includes('already registered')) {
            result.error.message = 'This email is already registered. Please use a different email or try logging in.';
          }
          
          setError(result.error.message);
        } else {
          console.log("Sign up successful:", result.data);
          
          // Create profile with first_name and last_name
          if (result.data.user && data.options?.data) {
            try {
              await profilesService.createProfile(result.data.user.id, data.options.data);
              console.log("Profile created with metadata:", data.options.data);
            } catch (profileError) {
              console.error("Error creating profile:", profileError);
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
        const result = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });
        
        if (result.error) {
          console.error("Sign in error:", result.error);
          setError(result.error.message);
        } else {
          console.log("Sign in successful:", result.data.user.id);
          
          // Set user immediately
          setUser(result.data.user);
          
          // Ensure profile is loaded after sign in
          if (result.data.user) {
            try {
              await loadUserProfile(result.data.user.id);
            } catch (profileError) {
              console.error("Error loading profile after sign in:", profileError);
            }
          }
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
        const result = await supabase.auth.signOut();
        
        if (result.error) {
          console.error("Sign out error:", result.error);
          setError(result.error.message);
        } else {
          console.log("Sign out successful");
          // Clear user and profile state
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