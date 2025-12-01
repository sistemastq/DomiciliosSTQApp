// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_KEY en el archivo .env');
}

// IMPORTANTE: esta key es service_role, solo debe usarse en el backend
export const supabase = createClient(supabaseUrl, supabaseKey);
