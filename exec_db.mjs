import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL=["']?([^"'\n]+)/);
const keyMatch = env.match(/VITE_SUPABASE_SERVICE_KEY=["']?([^"'\n]+)/);

const SUPABASE_URL = urlMatch ? urlMatch[1] : '';
const SERVICE_KEY = keyMatch ? keyMatch[1] : '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { 
    auth: { persistSession: false }
});

const sql = 'ALTER TABLE courses ADD COLUMN IF NOT EXISTS "sectorId" uuid REFERENCES sectors(id) ON DELETE SET NULL;';

async function run() {
    console.log('Attempting to execute SQL migration via RPC...');
    
    // Try common RPC names for executing raw SQL
    const rpcNames = ['exec_sql', 'run_sql', 'execute_sql', 'sql', 'exec'];
    
    for (const rpcName of rpcNames) {
        try {
            console.log(`Trying RPC: ${rpcName}...`);
            // Try different parameter signatures
            const { data, error } = await supabase.rpc(rpcName, { sql });
            
            if (error) {
                if (error.message.includes('does not exist')) {
                    // Try different parameter name: query
                    const { data: data2, error: error2 } = await supabase.rpc(rpcName, { query: sql });
                    if (error2 && error2.message.includes('does not exist')) {
                        console.log(`❌ RPC ${rpcName} does not exist.`);
                        continue;
                    }
                    if (error2) {
                        console.log(`⚠️ RPC ${rpcName} returned error:`, error2.message);
                        continue;
                    }
                    console.log(`✅ Success with RPC ${rpcName} (query parameter)!`, data2);
                    return;
                }
                console.log(`⚠️ RPC ${rpcName} returned error:`, error.message);
                continue;
            }
            console.log(`✅ Success with RPC ${rpcName}!`, data);
            return;
        } catch (e) {
            console.log(`❌ Exception with RPC ${rpcName}:`, e.message);
        }
    }
    
    console.log('Could not find a raw SQL execution RPC. Manual execution is required.');
}

run();
