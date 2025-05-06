// src/lib/admin.js
import { supabase } from './supabaseClient';

export const adminService = {
  // Customer management
  async getCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error in getCustomers:', error);
      throw error;
    }
  },

  async getCustomer(id) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('Error fetching customer:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in getCustomer:', error);
      throw error;
    }
  },

  async createCustomer(customerData) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();
      if (error) {
        console.error('Error creating customer:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in createCustomer:', error);
      throw error;
    }
  },

  async updateCustomer(id, customerData) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Error updating customer:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in updateCustomer:', error);
      throw error;
    }
  },

  async deleteCustomer(id) {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Error deleting customer:', error);
        throw error;
      }
      return { success: true };
    } catch (error) {
      console.error('Error in deleteCustomer:', error);
      throw error;
    }
  },

  // Employee management
  async getEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('last_name');
      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error in getEmployees:', error);
      throw error;
    }
  },

  async getEmployee(id) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('Error fetching employee:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in getEmployee:', error);
      throw error;
    }
  },

  async createEmployee(employeeData) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();
      if (error) {
        console.error('Error creating employee:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in createEmployee:', error);
      throw error;
    }
  },

  async updateEmployee(id, employeeData) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Error updating employee:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      throw error;
    }
  },

  async deleteEmployee(id) {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Error deleting employee:', error);
        throw error;
      }
      return { success: true };
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      throw error;
    }
  }
};
