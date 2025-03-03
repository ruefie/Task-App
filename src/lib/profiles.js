import { supabase } from './supabase';

export const profilesService = {
  async getProfile() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }
      
      if (!userData || !userData.user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (error) {
        // If the profile doesn't exist yet, create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile');
          return this.createProfile(userData.user.id, userData.user.user_metadata);
        }
        
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  },

  async createProfile(userId, metadata = {}) {
    try {
      console.log('Creating new profile for user:', userId);
      
      // Check if profile already exists to avoid duplicates
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (!checkError && existingProfile) {
        console.log('Profile already exists, returning existing profile');
        return existingProfile;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          first_name: metadata.first_name || '',
          last_name: metadata.last_name || '',
          is_admin: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createProfile:', error);
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }
      
      if (!userData || !userData.user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userData.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  },

  async updatePassword(currentPassword, newPassword) {
    try {
      // First verify the current password by signing in
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }
      
      if (!userData || !userData.user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      // Try to sign in with the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword
      });
      
      if (signInError) {
        console.error('Current password is incorrect:', signInError);
        throw new Error('Current password is incorrect');
      }
      
      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('Error updating password:', error);
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in updatePassword:', error);
      throw error;
    }
  },

  async isAdmin() {
    try {
      const profile = await this.getProfile();
      return profile?.is_admin || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
};