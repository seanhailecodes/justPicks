// services/auth.ts

export class AuthService {
  static async sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    // Mock implementation for now
    console.log('Sending OTP to:', phone);
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  }

  static async verifyOTP(phone: string, token: string): Promise<{ success: boolean; error?: string }> {
    // Mock implementation
    console.log('Verifying OTP:', token);
    
    // For testing, accept "123456"
    if (token === '123456') {
      return { success: true };
    }
    
    return { success: false, error: 'Invalid code' };
  }
}