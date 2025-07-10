// Diagnostic tests for presence tracking and user lookup functionality
import { supabase } from '../lib/supabase';
import { friendlyService } from '../services/friendlyService';

export interface DiagnosticResult {
  test: string;
  passed: boolean;
  result?: any;
  error?: string;
}

export class PresenceDiagnostics {
  /**
   * Test user lookup by username
   */
  async testUserLookup(username: string): Promise<DiagnosticResult> {
    try {
      console.log(`🔍 Testing user lookup for: ${username}`);
      
      const user = await friendlyService.getUserByUsername(username);
      
      return {
        test: 'User Lookup',
        passed: !!user,
        result: user,
        error: user ? undefined : 'User not found'
      };
    } catch (error) {
      return {
        test: 'User Lookup',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test presence tracking for a user
   */
  async testPresenceTracking(username: string): Promise<DiagnosticResult> {
    try {
      console.log(`🟢 Testing presence tracking for: ${username}`);
      
      // First get user by username
      const user = await friendlyService.getUserByUsername(username);
      if (!user) {
        return {
          test: 'Presence Tracking',
          passed: false,
          error: 'User not found for presence check'
        };
      }

      // Check presence using user ID
      const isOnlineById = await friendlyService.isUserOnlineById(user.id);
      
      // Check presence using username (this is the buggy method)
      const isOnlineByUsername = await friendlyService.isUserOnline(username);
      
      return {
        test: 'Presence Tracking',
        passed: true,
        result: {
          userId: user.id,
          username: user.username,
          isOnlineById,
          isOnlineByUsername,
          mismatch: isOnlineById !== isOnlineByUsername
        }
      };
    } catch (error) {
      return {
        test: 'Presence Tracking',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test direct database query for user presence
   */
  async testDirectPresenceQuery(username: string): Promise<DiagnosticResult> {
    try {
      console.log(`🔍 Testing direct presence query for: ${username}`);
      
      // First get user by username
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username)
        .single();

      if (userError) throw userError;
      if (!user) {
        return {
          test: 'Direct Presence Query',
          passed: false,
          error: 'User not found'
        };
      }

      // Now check presence
      const { data: presence, error: presenceError } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (presenceError && presenceError.code !== 'PGRST116') throw presenceError;

      return {
        test: 'Direct Presence Query',
        passed: true,
        result: {
          user,
          presence,
          hasPresenceRecord: !!presence,
          isOnline: presence?.is_online || false,
          lastSeen: presence?.last_seen
        }
      };
    } catch (error) {
      return {
        test: 'Direct Presence Query',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test current user authentication
   */
  async testCurrentUserAuth(): Promise<DiagnosticResult> {
    try {
      console.log(`🔐 Testing current user authentication`);
      
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      
      if (!authUser.user) {
        return {
          test: 'Current User Auth',
          passed: false,
          error: 'No authenticated user'
        };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', authUser.user.id)
        .single();

      if (profileError) throw profileError;

      return {
        test: 'Current User Auth',
        passed: true,
        result: {
          authUserId: authUser.user.id,
          profile
        }
      };
    } catch (error) {
      return {
        test: 'Current User Auth',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test presence initialization
   */
  async testPresenceInitialization(): Promise<DiagnosticResult> {
    try {
      console.log(`🚀 Testing presence initialization`);
      
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        return {
          test: 'Presence Initialization',
          passed: false,
          error: 'No authenticated user'
        };
      }

      // Initialize presence
      await friendlyService.initializePresence(authUser.user.id, 'diagnostic_test');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if presence was created
      const { data: presence, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', authUser.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        test: 'Presence Initialization',
        passed: !!presence,
        result: {
          userId: authUser.user.id,
          presence,
          isOnline: presence?.is_online || false
        }
      };
    } catch (error) {
      return {
        test: 'Presence Initialization',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run all diagnostic tests
   */
  async runAllTests(targetUsername: string): Promise<DiagnosticResult[]> {
    console.log(`🧪 Running all diagnostic tests for username: ${targetUsername}`);
    
    const results: DiagnosticResult[] = [];
    
    // Test current user auth
    results.push(await this.testCurrentUserAuth());
    
    // Test presence initialization
    results.push(await this.testPresenceInitialization());
    
    // Test user lookup
    results.push(await this.testUserLookup(targetUsername));
    
    // Test direct presence query
    results.push(await this.testDirectPresenceQuery(targetUsername));
    
    // Test presence tracking
    results.push(await this.testPresenceTracking(targetUsername));
    
    return results;
  }

  /**
   * Print test results
   */
  printResults(results: DiagnosticResult[]): void {
    console.log('\n📋 Diagnostic Test Results:');
    console.log('='.repeat(50));
    
    results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.test}: ${status}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.result) {
        console.log(`   Result:`, result.result);
      }
      
      console.log('');
    });
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`Summary: ${passedTests}/${totalTests} tests passed`);
    console.log('='.repeat(50));
  }
}

// Export a singleton instance
export const presenceDiagnostics = new PresenceDiagnostics(); 