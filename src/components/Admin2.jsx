import React, { useState, useEffect } from 'react';
import { adminService } from '../lib/admin';
import { 
  Users, 
  Building, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import styles from '../styles/AdminPanel.module.scss';
import { useAuth } from '../contexts/AuthContext';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [employeeFormData, setEmployeeFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: ''
  });
  
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');


  const { isAdmin } = useAuth();
  const [adminState, setAdminState] = useState({
    isAdmin,
    loading: true,
    error: null
  });

  useEffect(() => {
    // This helps debug why admin panel might not be showing
    console.log("AdminPanel component mounted");
    console.log("isAdmin status:", isAdmin);
    
    setAdminState({
      isAdmin,
      loading: false,
      error: null
    });
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center' 
      }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin panel.</p>
        <p>isAdmin value: {String(isAdmin)}</p>
        <p>If you believe this is an error, please contact support.</p>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'employees') {
        const employeesData = await adminService.getEmployees();
        setEmployees(employeesData);
      } else {
        const customersData = await adminService.getCustomers();
        setCustomers(customersData);
      }
    } catch (error) {
      console.error(`Error loading ${activeTab}:`, error);
      setError(`Failed to load ${activeTab}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedData = () => {
    let data = activeTab === 'employees' ? [...employees] : [...customers];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item => {
        if (activeTab === 'employees') {
          return (
            item.first_name?.toLowerCase().includes(query) ||
            item.last_name?.toLowerCase().includes(query) ||
            item.email?.toLowerCase().includes(query) ||
            item.position?.toLowerCase().includes(query)
          );
        } else {
          return (
            item.name?.toLowerCase().includes(query) ||
            item.contact_person?.toLowerCase().includes(query) ||
            item.email?.toLowerCase().includes(query)
          );
        }
      });
    }
    
    // Sort data
    if (sortField) {
      data.sort((a, b) => {
        let aValue = a[sortField] || '';
        let bValue = b[sortField] || '';
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return data;
  };

  const resetForms = () => {
    setEmployeeFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: ''
    });
    
    setCustomerFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: ''
    });
    
    setEditingEmployee(null);
    setEditingCustomer(null);
    setShowEmployeeForm(false);
    setShowCustomerForm(false);
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (editingEmployee) {
        await adminService.updateEmployee(editingEmployee.id, employeeFormData);
        setSuccess('Employee updated successfully');
      } else {
        await adminService.createEmployee(employeeFormData);
        setSuccess('Employee created successfully');
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      resetForms();
      loadData();
    } catch (error) {
      console.error('Error saving employee:', error);
      setError('Failed to save employee. Please try again.');
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (editingCustomer) {
        await adminService.updateCustomer(editingCustomer.id, customerFormData);
        setSuccess('Customer updated successfully');
      } else {
        await adminService.createCustomer(customerFormData);
        setSuccess('Customer created successfully');
      }
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      resetForms();
      loadData();
    } catch (error) {
      console.error('Error saving customer:', error);
      setError('Failed to save customer. Please try again.');
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setEmployeeFormData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || ''
    });
    setShowEmployeeForm(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustomerFormData({
      name: customer.name || '',
      contact_person: customer.contact_person || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || ''
    });
    setShowCustomerForm(true);
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    
    setError(null);
    setSuccess(null);
    
    try {
      await adminService.deleteEmployee(id);
      setSuccess('Employee deleted successfully');
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      loadData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError('Failed to delete employee. Please try again.');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    setError(null);
    setSuccess(null);
    
    try {
      await adminService.deleteCustomer(id);
      setSuccess('Customer deleted successfully');
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      loadData();
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError('Failed to delete customer. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Panel</h1>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      {success && (
        <div className={styles.success}>
          {success}
        </div>
      )}
      
      <div className={styles.panel}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'employees' ? styles.activeTab : ''}`}
            onClick={() => {
              setActiveTab('employees');
              resetForms();
            }}
          >
            <Users className={styles.tabIcon} />
            Employees
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'customers' ? styles.activeTab : ''}`}
            onClick={() => {
              setActiveTab('customers');
              resetForms();
            }}
          >
            <Building className={styles.tabIcon} />
            Customers
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <button
              onClick={() => {
                if (activeTab === 'employees') {
                  setShowEmployeeForm(true);
                  setEditingEmployee(null);
                  setEmployeeFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    position: ''
                  });
                } else {
                  setShowCustomerForm(true);
                  setEditingCustomer(null);
                  setCustomerFormData({
                    name: '',
                    contact_person: '',
                    email: '',
                    phone: '',
                    address: ''
                  });
                }
              }}
              className={styles.addButton}
            >
              <Plus className={styles.buttonIcon} />
              Add {activeTab === 'employees' ? 'Employee' : 'Customer'}
            </button>
          </div>
          
          {activeTab === 'employees' && (
            <>
              {showEmployeeForm && (
                <div className={styles.formCard}>
                  <div className={styles.formHeader}>
                    <h3 className={styles.formTitle}>
                      {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                    </h3>
                    <button
                      onClick={() => setShowEmployeeForm(false)}
                      className={styles.closeButton}
                    >
                      <X className={styles.closeIcon} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleEmployeeSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label htmlFor="first_name" className={styles.label}>
                          First name
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          id="first_name"
                          required
                          value={employeeFormData.first_name}
                          onChange={(e) => setEmployeeFormData({...employeeFormData, first_name: e.target.value})}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="last_name" className={styles.label}>
                          Last name
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          id="last_name"
                          required
                          value={employeeFormData.last_name}
                          onChange={(e) => setEmployeeFormData({...employeeFormData, last_name: e.target.value})}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={employeeFormData.email}
                          onChange={(e) => setEmployeeFormData({...employeeFormData, email: e.target.value})}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="phone" className={styles.label}>
                          Phone
                        </label>
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          value={employeeFormData.phone}
                          onChange={(e) => setEmployeeFormData({...employeeFormData, phone: e.target.value})}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroupFull}>
                        <label htmlFor="position" className={styles.label}>
                          Position
                        </label>
                        <input
                          type="text"
                          name="position"
                          id="position"
                          value={employeeFormData.position}
                          onChange={(e) => setEmployeeFormData({...employeeFormData, position: e.target.value})}
                          className={styles.input}
                        />
                      </div>
                    </div>
                    
                    <div className={styles.formActions}>
                      <button
                        type="button"
                        onClick={() => setShowEmployeeForm(false)}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.saveButton}
                      >
                        <Save className={styles.buttonIcon} />
                        {editingEmployee ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th
                        className={styles.tableHeaderCell}
                        onClick={() => handleSort('first_name')}
                      >
                        <div className={styles.headerContent}>
                          Name
                          {sortField === 'first_name' && (
                            sortDirection === 'asc' ? <ChevronUp className={styles.sortIcon} /> : <ChevronDown className={styles.sortIcon} />
                          )}
                        </div>
                      </th>
                      <th
                        className={styles.tableHeaderCell}
                        onClick={() => handleSort('email')}
                      >
                        <div className={styles.headerContent}>
                          Email
                          {sortField === 'email' && (
                            sortDirection === 'asc' ? <ChevronUp className={styles.sortIcon} /> : <ChevronDown className={styles.sortIcon} />
                          )}
                        </div>
                      </th>
                      <th
                        className={styles.tableHeaderCell}
                        onClick={() => handleSort('position')}
                      >
                        <div className={styles.headerContent}>
                          Position
                          {sortField === 'position' && (
                            sortDirection === 'asc' ? <ChevronUp className={styles.sortIcon} /> : <ChevronDown className={styles.sortIcon} />
                          )}
                        </div>
                      </th>
                      <th
                        className={styles.tableHeaderCell}
                      >
                        Phone
                      </th>
                      <th className={styles.tableHeaderCell}>
                        <span className={styles.srOnly}>Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className={styles.loadingCell}>
                          Loading...
                        </td>
                      </tr>
                    ) : getSortedData().length === 0 ? (
                      <tr>
                        <td colSpan="5" className={styles.emptyCell}>
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      getSortedData().map((employee) => (
                        <tr key={employee.id} className={styles.tableRow}>
                          <td className={styles.tableCell}>
                            <div className={styles.nameCell}>
                              {employee.first_name} {employee.last_name}
                            </div>
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.emailCell}>{employee.email}</div>
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.positionCell}>{employee.position}</div>
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.phoneCell}>{employee.phone}</div>
                          </td>
                          <td className={styles.actionCell}>
                            <button
                              onClick={() => handleEditEmployee(employee)}
                              className={styles.editAction}
                            >
                              <Edit2 className={styles.actionIcon} />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className={styles.deleteAction}
                            >
                              <Trash2 className={styles.actionIcon} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          {activeTab === 'customers' && (
            <>
              {showCustomerForm && (
                <div className={styles.formCard}>
                  <div className={styles.formHeader}>
                    <h3 className={styles.formTitle}>
                      {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                    </h3>
                    <button
                      onClick={() => setShowCustomerForm(false)}
                      className={styles.closeButton}
                    >
                      <X className={styles.closeIcon} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleCustomerSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroupFull}>
                        <label htmlFor="name" className={styles.label}>
                          Company Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={customerFormData.name}
                          onChange={(e) => setCustomerFormData({...customerFormData, name: e.target.value})}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="contact_person" className={styles.label}>
                          Contact Person
                        </label>
                        <input
                          type="text"
                          name="contact_person"
                          id="contact_person"
                          value={customerFormData.contact_person}
                          onChange={(e) => setCustomerFormData({...customerFormData, contact_person: e.target.value})}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={customerFormData.email}
                          onChange={(e) => setCustomerFormData({...customerFormData, email: e.target.value})}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="phone" className={styles.label}>
                          Phone
                        </label>
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          value={customerFormData.phone}
                          onChange={(e) => setCustomerFormData({...customerFormData, phone: e.target.value})}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroupFull}>
                        <label htmlFor="address" className={styles.label}>
                          Address
                        </label>
                        <textarea
                          name="address"
                          id="address"
                          rows="3"
                          value={customerFormData.address}
                          onChange={(e) => setCustomerFormData({...customerFormData, address: e.target.value})}
                          className={styles.textarea}
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className={styles.formActions}>
                      <button
                        type="button"
                        onClick={() => setShowCustomerForm(false)}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.saveButton}
                      >
                        <Save className={styles.buttonIcon} />
                        {editingCustomer ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th
                        className={styles.tableHeaderCell}
                        onClick={() => handleSort('name')}
                      >
                        <div className={styles.headerContent}>
                          Company Name
                          {sortField === 'name' && (
                            sortDirection === 'asc' ? <ChevronUp className={styles.sortIcon} /> : <ChevronDown className={styles.sortIcon} />
                          )}
                        </div>
                      </th>
                      <th
                        className={styles.tableHeaderCell}
                        onClick={() => handleSort('contact_person')}
                      >
                        <div className={styles.headerContent}>
                          Contact Person
                          {sortField === 'contact_person' && (
                            sortDirection === 'asc' ? <ChevronUp className={styles.sortIcon} /> : <ChevronDown className={styles.sortIcon} />
                          )}
                        </div>
                      </th>
                      <th
                        className={styles.tableHeaderCell}
                        onClick={() => handleSort('email')}
                      >
                        <div className={styles.headerContent}>
                          Email
                          {sortField === 'email' && (
                            sortDirection === 'asc' ? <ChevronUp className={styles.sortIcon} /> : <ChevronDown className={styles.sortIcon} />
                          )}
                        </div>
                      </th>
                      <th
                        className={styles.tableHeaderCell}
                      >
                        Phone
                      </th>
                      <th className={styles.tableHeaderCell}>
                        <span className={styles.srOnly}>Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className={styles.loadingCell}>
                          Loading...
                        </td>
                      </tr>
                    ) : getSortedData().length === 0 ? (
                      <tr>
                        <td colSpan="5" className={styles.emptyCell}>
                          No customers found
                        </td>
                      </tr>
                    ) : (
                      getSortedData().map((customer) => (
                        <tr key={customer.id} className={styles.tableRow}>
                          <td className={styles.tableCell}>
                            <div className={styles.nameCell}>{customer.name}</div>
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.contactCell}>{customer.contact_person}</div>
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.emailCell}>{customer.email}</div>
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.phoneCell}>{customer.phone}</div>
                          </td>
                          <td className={styles.actionCell}>
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className={styles.editAction}
                            >
                              <Edit2 className={styles.actionIcon} />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className={styles.deleteAction}
                            >
                              <Trash2 className={styles.actionIcon} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;