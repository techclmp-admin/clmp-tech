
import { supabase } from '@/integrations/supabase/client';

export const deleteUser = async (userId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId }
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error };
  }
};
