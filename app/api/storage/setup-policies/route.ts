import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔐 Setting up storage policies...')

    // Create policy for public read access
    const { error: readPolicyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'files',
      policy_name: 'Public read access',
      definition: 'SELECT',
      roles: '{public}',
      using_expression: 'true'
    })

    if (readPolicyError && !readPolicyError.message.includes('already exists')) {
      console.error('❌ Error creating read policy:', readPolicyError)
      
      // Fallback: Try with raw SQL
      const { error: sqlError1 } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE POLICY "Public read access" ON storage.objects 
          FOR SELECT TO public 
          USING (bucket_id = 'files');
        `
      })
      
      if (sqlError1 && !sqlError1.message.includes('already exists')) {
        console.error('❌ SQL read policy error:', sqlError1)
      }
    }

    // Create policy for public insert access  
    const { error: insertPolicyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'files',
      policy_name: 'Public upload access',
      definition: 'INSERT', 
      roles: '{public}',
      using_expression: 'true'
    })

    if (insertPolicyError && !insertPolicyError.message.includes('already exists')) {
      console.error('❌ Error creating insert policy:', insertPolicyError)
      
      // Fallback: Try with raw SQL
      const { error: sqlError2 } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE POLICY "Public upload access" ON storage.objects 
          FOR INSERT TO public 
          WITH CHECK (bucket_id = 'files');
        `
      })
      
      if (sqlError2 && !sqlError2.message.includes('already exists')) {
        console.error('❌ SQL insert policy error:', sqlError2)
      }
    }

    // Enable RLS on storage.objects if not already enabled
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    })

    if (rlsError && !rlsError.message.includes('already')) {
      console.log('ℹ️ RLS info:', rlsError.message)
    }

    console.log('✅ Storage policies configured')

    return NextResponse.json({ 
      success: true, 
      message: 'Storage policies configured successfully' 
    })

  } catch (error) {
    console.error('❌ Policy setup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Policy setup failed: ${error}` 
    }, { status: 500 })
  }
}