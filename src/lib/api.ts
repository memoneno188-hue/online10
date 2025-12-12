import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'https://customs-backend-9sku.onrender.com';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor to handle errors
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as any;

                // If 401 and not already retried, try to refresh token
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = localStorage.getItem('refreshToken');
                        if (refreshToken) {
                            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                                refreshToken,
                            });

                            const { accessToken } = response.data;
                            localStorage.setItem('accessToken', accessToken);

                            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                            return this.client(originalRequest);
                        }
                    } catch (refreshError) {
                        // Refresh failed, logout user
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // Auth
    async login(username: string, password: string) {
        const response = await this.client.post('/auth/login', { username, password });
        return response.data;
    }

    async refreshToken(refreshToken: string) {
        const response = await this.client.post('/auth/refresh', { refreshToken });
        return response.data;
    }

    // Customers
    async getCustomers(params?: any) {
        const response = await this.client.get('/customers', { params });
        return response.data;
    }

    async getCustomer(id: string) {
        const response = await this.client.get(`/customers/${id}`);
        return response.data;
    }

    async createCustomer(data: any) {
        const response = await this.client.post('/customers', data);
        return response.data;
    }

    async updateCustomer(id: string, data: any) {
        const response = await this.client.patch(`/customers/${id}`, data);
        return response.data;
    }

    async deleteCustomer(id: string) {
        const response = await this.client.delete(`/customers/${id}`);
        return response.data;
    }

    async getCustomerStats() {
        const response = await this.client.get('/customers/stats');
        return response.data;
    }

    // Invoices
    async getInvoices(params?: any) {
        const response = await this.client.get('/invoices', { params });
        return response.data;
    }

    async getInvoice(id: string) {
        const response = await this.client.get(`/invoices/${id}`);
        return response.data;
    }

    async createInvoice(data: any) {
        const response = await this.client.post('/invoices', data);
        return response.data;
    }

    async updateInvoice(id: string, data: any) {
        const response = await this.client.patch(`/invoices/${id}`, data);
        return response.data;
    }

    async deleteInvoice(id: string) {
        const response = await this.client.delete(`/invoices/${id}`);
        return response.data;
    }

    async getInvoiceStats(params?: any) {
        const response = await this.client.get('/invoices/stats', { params });
        return response.data;
    }

    // Agents
    async getAgents(params?: any) {
        const response = await this.client.get('/agents', { params });
        return response.data;
    }

    async getAgent(id: string) {
        const response = await this.client.get(`/agents/${id}`);
        return response.data;
    }

    async createAgent(data: any) {
        const response = await this.client.post('/agents', data);
        return response.data;
    }

    async updateAgent(id: string, data: any) {
        const response = await this.client.patch(`/agents/${id}`, data);
        return response.data;
    }

    async deleteAgent(id: string) {
        const response = await this.client.delete(`/agents/${id}`);
        return response.data;
    }

    // Trips
    async getTrips(params?: any) {
        const response = await this.client.get('/agents/trips', { params });
        return response.data;
    }

    async createTrip(data: any) {
        const response = await this.client.post('/agents/trips', data);
        return response.data;
    }

    async updateTrip(id: string, data: any) {
        const response = await this.client.patch(`/agents/trips/${id}`, data);
        return response.data;
    }

    async deleteTrip(id: string) {
        const response = await this.client.delete(`/agents/trips/${id}`);
        return response.data;
    }

    // Additional Fees
    async getFees(params?: any) {
        const response = await this.client.get('/agents/fees', { params });
        return response.data;
    }

    async createFee(data: any) {
        const response = await this.client.post('/agents/fees', data);
        return response.data;
    }

    async updateFee(id: string, data: any) {
        const response = await this.client.patch(`/agents/fees/${id}`, data);
        return response.data;
    }

    async deleteFee(id: string) {
        const response = await this.client.delete(`/agents/fees/${id}`);
        return response.data;
    }

    // Agent Statement
    async getAgentStatement(agentId: string, params?: any) {
        const response = await this.client.get(`/agents/${agentId}/statement`, { params });
        return response.data;
    }

    // Vouchers
    async getVouchers(params?: any) {
        const response = await this.client.get('/vouchers', { params });
        return response.data;
    }

    async getVoucher(id: string) {
        const response = await this.client.get(`/vouchers/${id}`);
        return response.data;
    }

    async createVoucher(data: any) {
        const response = await this.client.post('/vouchers', data);
        return response.data;
    }

    async updateVoucher(id: string, data: any) {
        const response = await this.client.patch(`/vouchers/${id}`, data);
        return response.data;
    }

    async deleteVoucher(id: string) {
        const response = await this.client.delete(`/vouchers/${id}`);
        return response.data;
    }

    // Treasury
    async getTreasuryBalance() {
        const response = await this.client.get('/treasury/balance');
        return response.data;
    }

    async getTreasuryTransactions(params?: any) {
        const response = await this.client.get('/treasury/transactions', { params });
        return response.data;
    }

    async getTreasuryReport(params?: any) {
        const response = await this.client.get('/treasury/report', { params });
        return response.data;
    }

    async setTreasuryOpeningBalance(data: any) {
        const response = await this.client.post('/treasury/opening-balance', data);
        return response.data;
    }

    async updateTreasurySettings(data: any) {
        const response = await this.client.patch('/treasury/settings', data);
        return response.data;
    }

    // Banks
    async getBanks(params?: any) {
        const response = await this.client.get('/banks', { params });
        return response.data;
    }

    async getBank(id: string) {
        const response = await this.client.get(`/banks/${id}`);
        return response.data;
    }

    async createBank(data: any) {
        const response = await this.client.post('/banks', data);
        return response.data;
    }

    async updateBank(id: string, data: any) {
        const response = await this.client.patch(`/banks/${id}`, data);
        return response.data;
    }

    async deleteBank(id: string) {
        const response = await this.client.delete(`/banks/${id}`);
        return response.data;
    }

    // Bank Accounts
    async getBankAccounts(params?: any) {
        const response = await this.client.get('/banks/accounts', { params });
        return response.data;
    }

    async getBankAccount(id: string) {
        const response = await this.client.get(`/banks/accounts/${id}`);
        return response.data;
    }

    async createBankAccount(data: any) {
        const response = await this.client.post('/banks/accounts', data);
        return response.data;
    }

    async updateBankAccount(id: string, data: any) {
        const response = await this.client.patch(`/banks/accounts/${id}`, data);
        return response.data;
    }

    async deleteBankAccount(id: string) {
        const response = await this.client.delete(`/banks/accounts/${id}`);
        return response.data;
    }

    async getBankAccountTransactions(id: string, params?: any) {
        const response = await this.client.get(`/banks/accounts/${id}/transactions`, { params });
        return response.data;
    }

    // Employees
    async getEmployees(params?: any) {
        const response = await this.client.get('/payroll/employees', { params });
        return response.data;
    }

    async getEmployee(id: string) {
        const response = await this.client.get(`/payroll/employees/${id}`);
        return response.data;
    }

    async createEmployee(data: any) {
        const response = await this.client.post('/payroll/employees', data);
        return response.data;
    }

    async updateEmployee(id: string, data: any) {
        const response = await this.client.patch(`/payroll/employees/${id}`, data);
        return response.data;
    }

    async deleteEmployee(id: string) {
        const response = await this.client.delete(`/payroll/employees/${id}`);
        return response.data;
    }

    // Payroll
    async getPayrollRuns(params?: any) {
        const response = await this.client.get('/payroll/runs', { params });
        return response.data;
    }

    async getPayrollRun(id: string) {
        const response = await this.client.get(`/payroll/runs/${id}`);
        return response.data;
    }

    async createPayrollRun(data: any) {
        const response = await this.client.post('/payroll/runs', data);
        return response.data;
    }

    async updatePayrollRun(id: string, data: any) {
        const response = await this.client.patch(`/payroll/runs/${id}`, data);
        return response.data;
    }

    async approvePayrollRun(data: any) {
        const response = await this.client.post('/payroll/runs/approve', data);
        return response.data;
    }

    async deletePayrollRun(id: string) {
        const response = await this.client.delete(`/payroll/runs/${id}`);
        return response.data;
    }

    // Reports
    async getTreasuryReportData(params?: any) {
        const response = await this.client.get('/reports/treasury', { params });
        return response.data;
    }

    async getBankReportData(accountId: string, params?: any) {
        const response = await this.client.get(`/reports/bank/${accountId}`, { params });
        return response.data;
    }

    async getCustomerStatement(id: string, params?: any) {
        const response = await this.client.get(`/reports/customer/${id}`, { params });
        return response.data;
    }

    async getAgentStatementReport(id: string, params?: any) {
        const response = await this.client.get(`/reports/agent/${id}`, { params });
        return response.data;
    }

    async getIncomeStatement(params?: any) {
        const response = await this.client.get('/reports/income-statement', { params });
        return response.data;
    }

    async getGeneralJournal(params?: any) {
        const response = await this.client.get('/reports/general-journal', { params });
        return response.data;
    }

    async getTrialBalance(params?: any) {
        const response = await this.client.get('/reports/trial-balance', { params });
        return response.data;
    }

    async getCustomsReport(params?: any) {
        const response = await this.client.get('/reports/customs', { params });
        return response.data;
    }

    // Expense Categories
    async getExpenseCategories() {
        const response = await this.client.get('/expense-categories');
        return response.data;
    }

    async createExpenseCategory(data: { name: string }) {
        const response = await this.client.post('/expense-categories', data);
        return response.data;
    }

    async deleteExpenseCategory(id: string) {
        const response = await this.client.delete(`/expense-categories/${id}`);
        return response.data;
    }

    // Invoice Item Templates
    async getInvoiceItemTemplates() {
        const response = await this.client.get('/invoice-item-templates');
        return response.data;
    }

    async searchInvoiceItemTemplates(query: string) {
        const response = await this.client.get('/invoice-item-templates/search', { params: { q: query } });
        return response.data;
    }

    async createInvoiceItemTemplate(data: { description: string; vatRate?: number }) {
        const response = await this.client.post('/invoice-item-templates', data);
        return response.data;
    }

    async deleteInvoiceItemTemplate(id: string) {
        const response = await this.client.delete(`/invoice-item-templates/${id}`);
        return response.data;
    }

    // Income Statement Settings
    async getIncomeStatementSettings() {
        const response = await this.client.get('/settings/income-statement');
        return response.data;
    }

    async updateIncomeStatementSettings(data: {
        revenueItemTemplateIds: string[];
        expenseCategoryIds: string[];
    }) {
        const response = await this.client.put('/settings/income-statement', data);
        return response.data;
    }

    // Settings
    async getSettings() {
        const response = await this.client.get('/settings');
        return response.data;
    }

    async getCompanySettings() {
        const response = await this.client.get('/settings/company');
        return response.data;
    }

    async updateCompanySettings(data: any) {
        const response = await this.client.put('/settings/company', data);
        return response.data;
    }

    async uploadCompanyLogo(formData: FormData) {
        const response = await this.client.post('/settings/company/logo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async getAppSettings() {
        const response = await this.client.get('/settings/app');
        return response.data;
    }

    async updateAppSettings(data: any) {
        const response = await this.client.put('/settings/app', data);
        return response.data;
    }

    async getPrintSettings() {
        const response = await this.client.get('/settings/print');
        return response.data;
    }

    async updatePrintSettings(data: any) {
        const response = await this.client.put('/settings/print', data);
        return response.data;
    }

    // Users Management
    async getUsers() {
        const response = await this.client.get('/users');
        return response.data;
    }

    async getUser(id: string) {
        const response = await this.client.get(`/users/${id}`);
        return response.data;
    }

    async getCurrentUser() {
        const response = await this.client.get('/users/me');
        return response.data;
    }

    async getCurrentUserPermissions() {
        const response = await this.client.get('/users/me/permissions');
        return response.data;
    }

    async createUser(data: any) {
        const response = await this.client.post('/users', data);
        return response.data;
    }

    async updateUser(id: string, data: any) {
        const response = await this.client.patch(`/users/${id}`, data);
        return response.data;
    }

    async deleteUser(id: string) {
        const response = await this.client.delete(`/users/${id}`);
        return response.data;
    }

    async changeUserPassword(id: string, data: any) {
        const response = await this.client.patch(`/users/${id}/password`, data);
        return response.data;
    }

    async getUserPermissions(id: string) {
        const response = await this.client.get(`/users/${id}/permissions`);
        return response.data;
    }

    async updateUserPermissions(id: string, data: any) {
        const response = await this.client.patch(`/users/${id}/permissions`, data);
        return response.data;
    }

    async toggleUserActive(id: string, isActive: boolean) {
        const response = await this.client.patch(`/users/${id}/toggle-active`, { isActive });
        return response.data;
    }

    // Additional Payroll Methods
    async updatePayrollRun(id: string, data: any) {
        const response = await this.client.patch(`/payroll/runs/${id}`, data);
        return response.data;
    }

    async unapprovePayrollRun(id: string) {
        const response = await this.client.put(`/payroll/runs/${id}/unapprove`, {});
        return response.data;
    }
}

export const apiClient = new ApiClient();
export default apiClient;
