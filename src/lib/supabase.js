import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ollvfucunjqunkwdchjy.supabase.co'
const supabaseAnonKey = 'sb_publishable_qgNHV7kbI64vvbifrY0prQ_WauwkYjE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)