// ========================================
// SUPABASE CLIENT MODULE
// Portable database connection and configuration
// ========================================

class SupabaseClient {
    constructor() {
        this.client = null;
        this.config = null;
    }

    async initialize(url, key) {
        if (!url || !key) {
            throw new Error('Supabase URL and API key are required');
        }

        this.client = supabase.createClient(url, key);
        this.config = { url, key };
        
        console.log('✅ Supabase client initialized');
        return this.client;
    }

    async setupTables() {
        if (!this.client) {
            throw new Error('Supabase client not initialized');
        }

        const createTablesSQL = `
        -- Game Sessions Table
        CREATE TABLE IF NOT EXISTS game_sessions (
            id SERIAL PRIMARY KEY,
            session_code VARCHAR(10) UNIQUE NOT NULL,
            dm_name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Game Messages Table  
        CREATE TABLE IF NOT EXISTS game_messages (
            id SERIAL PRIMARY KEY,
            session_code VARCHAR(10) REFERENCES game_sessions(session_code),
            player_name VARCHAR(100) NOT NULL,
            message_type VARCHAR(20) DEFAULT 'chat',
            message_text TEXT NOT NULL,
            is_storyteller BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_messages_session ON game_messages(session_code, created_at);
        CREATE INDEX IF NOT EXISTS idx_sessions_code ON game_sessions(session_code);
        `;

        try {
            // Test if tables exist by querying them instead of using execute_sql RPC
            console.log('🔍 Checking for required chat tables...');
            
            const { error: sessionsError } = await this.client
                .from('game_sessions')
                .select('id')
                .limit(1);
                
            const { error: messagesError } = await this.client
                .from('game_messages') 
                .select('id')
                .limit(1);
            
            if (sessionsError || messagesError) {
                console.warn('⚠️ Chat tables not found. Please create them manually in Supabase SQL Editor:');
                console.warn(createTablesSQL);
            } else {
                console.log('✅ Database tables verified');
            }
        } catch (error) {
            console.warn('Could not verify tables:', error.message);
        }
    }

    async createSession(sessionCode, dmName) {
        const { data, error } = await this.client
            .from('game_sessions')
            .insert([{
                session_code: sessionCode,
                dm_name: dmName,
                is_active: true
            }])
            .select();

        if (error) throw error;
        return data[0];
    }

    async joinSession(sessionCode) {
        const { data, error } = await this.client
            .from('game_sessions')
            .select('*')
            .eq('session_code', sessionCode)
            .eq('is_active', true)
            .single();

        if (error) throw error;
        return data;
    }

    async sendMessage(sessionCode, playerName, messageText, messageType = 'chat', isStoryteller = false) {
        const { data, error } = await this.client
            .from('game_messages')
            .insert([{
                session_code: sessionCode,
                player_name: playerName,
                message_text: messageText,
                message_type: messageType,
                is_storyteller: isStoryteller
            }])
            .select();

        if (error) throw error;
        return data[0];
    }

    subscribeToMessages(sessionCode, callback) {
        return this.client
            .channel(`game_messages:${sessionCode}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'game_messages',
                filter: `session_code=eq.${sessionCode}`
            }, callback)
            .subscribe();
    }

    getClient() {
        return this.client;
    }

    isInitialized() {
        return this.client !== null;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseClient;
} else {
    window.SupabaseClient = SupabaseClient;
}
