import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminAccount() {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  const fullName = 'Admin User';

  try {
    // Check if admin already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingUser) {
      console.log('Admin account already exists!');
      return;
    }

    // Create admin user account
    const { data, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (authError) throw authError;

    if (!data.user) {
      throw new Error('Failed to create admin user');
    }

    // Insert admin user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: adminEmail,
        name: fullName,
        role: 'admin',
        is_admin: true,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D8ABC&color=fff`
      });

    if (profileError) throw profileError;

    console.log('Admin account created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('\nPlease change the password after first login.');

  } catch (error: any) {
    console.error('Error creating admin account:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createAdminAccount();