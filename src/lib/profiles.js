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
      
      // If first_name and last_name are empty but metadata exists, update them
      if ((!data.first_name || !data.last_name) && userData.user.user_metadata) {
        const metadata = userData.user.user_metadata;
        if (metadata.first_name || metadata.last_name) {
          console.log('Updating profile with metadata from user:', metadata);
          const updatedProfile = await this.updateProfile({
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || ''
          });
          return updatedProfile;
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  },

  async createProfile(userId, metadata = {}) {
    try {
      console.log('Creating new profile for user:', userId, 'with metadata:', metadata);
      
      // Ensure we have the metadata values
      const first_name = metadata.first_name || '';
      const last_name = metadata.last_name || '';
      
      console.log('Profile data to insert:', { 
        id: userId, 
        first_name, 
        last_name, 
        is_admin: false 
      });
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          first_name,
          last_name,
          is_admin: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }
      
      console.log('Profile created successfully:', data);
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
      
      console.log('Updating profile for user:', userData.user.id, 'with data:', profileData);
      
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
      
      console.log('Profile updated successfully:', data);
      
      // Also update the user metadata to keep it in sync
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.first_name,
          last_name: profileData.last_name
        }
      });
      
      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        // Don't throw here, just log the error
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