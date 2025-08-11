// Utility function to fix accounting access for existing Clergy users
import { supabase } from '@/integrations/lib/supabase';

export async function fixAccountingAccessForClergyUsers() {
  try {
    console.log('[fixAccountingAccess] Starting to fix accounting access for Clergy users...');
    
    // Update all Clergy users to have accounting_access = true
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        accounting_access: true,
        updated_at: new Date().toISOString()
      })
      .eq('role', 'Clergy')
      .is('accounting_access', null) // Only update users who don't have this field set
      .select('id, email, role, accounting_access');

    if (error) {
      console.error('[fixAccountingAccess] Error updating Clergy users:', error);
      throw error;
    }

    console.log(`[fixAccountingAccess] Successfully updated ${data?.length || 0} Clergy users with accounting access`);
    return { success: true, updatedCount: data?.length || 0 };
  } catch (err) {
    console.error('[fixAccountingAccess] Failed to fix accounting access:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Alternative function to fix accounting access for a specific user
export async function fixAccountingAccessForUser(userId: string) {
  try {
    console.log(`[fixAccountingAccess] Fixing accounting access for user: ${userId}`);
    
    // Get the user's profile first
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role, accounting_access')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('[fixAccountingAccess] Error fetching user profile:', fetchError);
      throw fetchError;
    }

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Only update if user is Clergy and doesn't have accounting access
    if (profile.role === 'Clergy' && profile.accounting_access !== true) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          accounting_access: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, email, role, accounting_access')
        .single();

      if (error) {
        console.error('[fixAccountingAccess] Error updating user:', error);
        throw error;
      }

      console.log(`[fixAccountingAccess] Successfully granted accounting access to user: ${userId}`);
      return { success: true, profile: data };
    } else {
      console.log(`[fixAccountingAccess] User ${userId} already has accounting access or is not Clergy`);
      return { success: true, profile, alreadyHasAccess: true };
    }
  } catch (err) {
    console.error('[fixAccountingAccess] Failed to fix accounting access for user:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
