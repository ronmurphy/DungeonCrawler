// ========================================
// SUPABASE CONFIGURATION MANAGER
// Handle API keys and configuration storage
// ========================================

// ========================================
// CONFIGURATION STORAGE
// ========================================
class SupabaseConfig {
    constructor() {
        this.storagePrefix = 'st-supabase-';
        this.urlKey = this.storagePrefix + 'url';
        this.keyKey = this.storagePrefix + 'key';
    }

    // Save configuration to browser storage
    saveConfig(supabaseUrl, supabaseKey) {
        try {
            localStorage.setItem(this.urlKey, supabaseUrl);
            localStorage.setItem(this.keyKey, supabaseKey);
            return { success: true, message: 'Configuration saved successfully' };
        } catch (error) {
            console.error('Failed to save configuration:', error);
            return { success: false, message: 'Failed to save configuration' };
        }
    }

    // Load configuration from browser storage
    loadConfig() {
        try {
            const supabaseUrl = localStorage.getItem(this.urlKey);
            const supabaseKey = localStorage.getItem(this.keyKey);
            
            if (supabaseUrl && supabaseKey) {
                return { 
                    success: true, 
                    data: { supabaseUrl, supabaseKey } 
                };
            } else {
                return { 
                    success: false, 
                    message: 'No configuration found' 
                };
            }
        } catch (error) {
            console.error('Failed to load configuration:', error);
            return { success: false, message: 'Failed to load configuration' };
        }
    }

    // Clear stored configuration
    clearConfig() {
        try {
            localStorage.removeItem(this.urlKey);
            localStorage.removeItem(this.keyKey);
            localStorage.removeItem(this.deployedUrlKey);
            return { success: true, message: 'Configuration cleared' };
        } catch (error) {
            console.error('Failed to load configuration:', error);
            return { success: false, message: 'Failed to load configuration' };
        }
    }

    // Clear stored configuration
    clearConfig() {
        try {
            localStorage.removeItem(this.urlKey);
            localStorage.removeItem(this.keyKey);
            return { success: true, message: 'Configuration cleared' };
        } catch (error) {
            console.error('Failed to clear configuration:', error);
            return { success: false, message: 'Failed to clear configuration' };
        }
    }

    // Check if configuration exists
    hasConfig() {
        const config = this.loadConfig();
        return config.success;
    }

    // Validate configuration format
    validateConfig(supabaseUrl, supabaseKey) {
        const errors = [];

        // Validate URL format
        if (!supabaseUrl || !supabaseUrl.trim()) {
            errors.push('Supabase URL is required');
        } else if (!supabaseUrl.includes('supabase.co')) {
            errors.push('URL should contain "supabase.co"');
        } else if (!supabaseUrl.startsWith('https://')) {
            errors.push('URL should start with "https://"');
        }

        // Validate API key format
        if (!supabaseKey || !supabaseKey.trim()) {
            errors.push('Supabase API key is required');
        } else if (!supabaseKey.startsWith('eyJ')) {
            errors.push('API key should start with "eyJ"');
        } else if (supabaseKey.length < 100) {
            errors.push('API key seems too short');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // Check if configuration exists
    hasConfig() {
        const config = this.loadConfig();
        return config.success;
    }

    // Validate configuration format
    validateConfig(supabaseUrl, supabaseKey) {
        const errors = [];

        // Validate URL format
        if (!supabaseUrl || !supabaseUrl.trim()) {
            errors.push('Supabase URL is required');
        } else if (!supabaseUrl.includes('supabase.co')) {
            errors.push('URL should contain "supabase.co"');
        } else if (!supabaseUrl.startsWith('https://')) {
            errors.push('URL should start with "https://"');
        }

        // Validate API key format
        if (!supabaseKey || !supabaseKey.trim()) {
            errors.push('Supabase API key is required');
        } else if (!supabaseKey.startsWith('eyJ')) {
            errors.push('API key should start with "eyJ"');
        } else if (supabaseKey.length < 100) {
            errors.push('API key seems too short');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Global configuration manager instance
const supabaseConfig = new SupabaseConfig();

// ========================================
// CONFIGURATION TAB CREATION
// ========================================
function addConfigurationTab() {
    // Get tab navigation container
    const tabNav = document.querySelector('.tab-nav');
    if (!tabNav) return;
    
    // Create tab button
    const configTabBtn = document.createElement('button');
    configTabBtn.className = 'tab-btn';
    configTabBtn.setAttribute('data-tab', 'config');
    configTabBtn.innerHTML = `
        <span class="tab-icon"><i class="material-icons">settings</i></span>
        <span class="tab-label">Configure</span>
        <span class="config-status" id="config-status-indicator">⚠️</span>
    `;
    
    // Insert before the first tab or at the beginning
    tabNav.insertBefore(configTabBtn, tabNav.firstChild);
    
    // Add tab content
    const tabContainer = document.querySelector('.tab-container');
    if (!tabContainer) return;
    
    const configTab = document.createElement('section');
    configTab.className = 'tab-content';
    configTab.id = 'config';
    configTab.innerHTML = createConfigTabContent();
    tabContainer.appendChild(configTab);
    
    // Add event listener for tab switching
    configTabBtn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        configTabBtn.classList.add('active');
        configTab.classList.add('active');
    });
}

function createConfigTabContent() {
    return `
        <div class="content-wrapper">
            <!-- Configuration Status Card -->
            <div class="card config-status-card">
                <div class="card-header">
                    <i class="material-icons">info</i>
                    <h3>Real-Time Chat Configuration</h3>
                    <div class="config-status-display" id="config-status-display">
                        <span class="status-dot offline"></span>
                        <span class="status-text">Not Configured</span>
                    </div>
                </div>
                
                <div class="config-explanation">
                    <p><strong>Why do I need this?</strong></p>
                    <p>To enable real-time chat between players and DMs, you need a free Supabase account. This allows:</p>
                    <ul>
                        <li>✅ <strong>Remote gaming</strong> - Players can join from anywhere</li>
                        <li>✅ <strong>Automatic combat processing</strong> - Attack rolls sent instantly</li>
                        <li>✅ <strong>Map sharing</strong> - DM shares maps in real-time</li>
                        <li>✅ <strong>Session persistence</strong> - Chat history is saved</li>
                        <li>✅ <strong>100% Free</strong> for gaming groups (500MB/month limit)</li>
                    </ul>
                </div>
            </div>
            
            <!-- Quick Setup Card -->
            <div class="card quick-setup-card">
                <div class="card-header">
                    <i class="material-icons">rocket_launch</i>
                    <h3>Quick Setup (5 minutes)</h3>
                </div>
                
                <div class="setup-steps">
                    <div class="setup-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>Create Free Supabase Account</h4>
                            <p>Sign up and create a new project (completely free)</p>
                            <button class="external-link-btn" onclick="openSupabaseSignup()">
                                <i class="material-icons">open_in_new</i>
                                Open Supabase Signup
                            </button>
                        </div>
                    </div>
                    
                    <div class="setup-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>Set Up Database Tables</h4>
                            <p>Copy SQL from setup guide and run in Supabase SQL Editor</p>
                            <button class="copy-sql-btn" onclick="copySetupSQL()">
                                <i class="material-icons">content_copy</i>
                                Copy Setup SQL
                            </button>
                        </div>
                    </div>
                    
                    <div class="setup-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h4>Get API Keys</h4>
                            <p>Copy your Project URL and public API key from Settings > API</p>
                            <button class="external-link-btn" onclick="openSupabaseGuide()">
                                <i class="material-icons">help</i>
                                View Setup Guide
                            </button>
                        </div>
                    </div>
                    
                    <div class="setup-step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h4>Configure Below</h4>
                            <p>Paste your keys into the form below and test connection</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Configuration Form Card -->
            <div class="card config-form-card">
                <div class="card-header">
                    <i class="material-icons">vpn_key</i>
                    <h3>Supabase Configuration</h3>
                </div>
                
                <div class="config-form">
                    <div class="form-group">
                        <label for="deployed-url-input">
                            Deployed App URL (GitHub Pages/Netlify/etc.)
                            <span class="field-help">Your actual deployed URL (e.g., https://yourusername.github.io/DCC-custom/StoryTeller/)</span>
                        </label>
                        <input type="url" id="deployed-url-input" placeholder="https://yourusername.github.io/DCC-custom/StoryTeller/" class="config-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="supabase-url-input">
                            Supabase Project URL
                            <span class="field-help">Found in Settings > API (looks like: https://xyz123.supabase.co)</span>
                        </label>
                        <input type="url" id="supabase-url-input" placeholder="https://your-project.supabase.co" class="config-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="supabase-key-input">
                            Supabase Public API Key (anon key)
                            <span class="field-help">Found in Settings > API (long string starting with "eyJ")</span>
                        </label>
                        <textarea id="supabase-key-input" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." class="config-input key-input" rows="3"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button class="test-connection-btn" onclick="testSupabaseConnection()">
                            <i class="material-icons">wifi_find</i>
                            Test Connection
                        </button>
                        <button class="save-config-btn" onclick="saveSupabaseConfig()">
                            <i class="material-icons">save</i>
                            Save Configuration
                        </button>
                        <button class="clear-config-btn" onclick="clearSupabaseConfig()">
                            <i class="material-icons">clear</i>
                            Clear Configuration
                        </button>
                    </div>
                    
                    <div class="config-feedback" id="config-feedback"></div>
                </div>
            </div>
            
            <!-- Sharing Instructions Card -->
            <div class="card sharing-card" id="sharing-card" style="display: none;">
                <div class="card-header">
                    <i class="material-icons">share</i>
                    <h3>Share with Players</h3>
                </div>
                
                <div class="sharing-instructions">
                    <p><strong>For players to join your games, they need the same configuration:</strong></p>
                    
                    <div class="sharing-options">
                        <div class="sharing-option">
                            <h4>🔗 Share Configuration Link</h4>
                            <p>Send this link to players - it will auto-configure their apps:</p>
                            <div class="share-link-container">
                                <input type="text" id="config-share-link" readonly class="share-link-input">
                                <button class="copy-share-link-btn" onclick="copyConfigShareLink()">
                                    <i class="material-icons">content_copy</i>
                                    Copy Link
                                </button>
                            </div>
                        </div>
                        
                        <div class="sharing-option">
                            <h4>📋 Manual Setup</h4>
                            <p>Or players can manually enter the same keys in their Configure tab:</p>
                            <div class="manual-config">
                                <div class="config-item">
                                    <strong>Project URL:</strong> 
                                    <span id="display-url" class="config-value">Not configured</span>
                                    <button onclick="copyToClipboard(document.getElementById('display-url').textContent)" class="mini-copy-btn">📋</button>
                                </div>
                                <div class="config-item">
                                    <strong>API Key:</strong> 
                                    <span id="display-key" class="config-value">Not configured</span>
                                    <button onclick="copyToClipboard(document.getElementById('display-key').textContent)" class="mini-copy-btn">📋</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// CONFIGURATION FUNCTIONS
// ========================================
function refreshConfigDisplay() {
    const config = supabaseConfig.loadConfig();
    const statusDisplay = document.getElementById('config-status-display');
    const statusIndicator = document.getElementById('config-status-indicator');
    const sharingCard = document.getElementById('sharing-card');
    
    if (config.success) {
        // Update status indicators
        statusDisplay.innerHTML = `
            <span class="status-dot connected"></span>
            <span class="status-text">Configured</span>
        `;
        statusIndicator.textContent = '✅';
        statusIndicator.style.color = '#10b981';
        
        // Fill form with existing values
        document.getElementById('supabase-url-input').value = config.data.supabaseUrl;
        document.getElementById('supabase-key-input').value = config.data.supabaseKey;
        if (config.data.deployedUrl) {
            document.getElementById('deployed-url-input').value = config.data.deployedUrl;
        }
        
        // Show sharing card and update values
        sharingCard.style.display = 'block';
        document.getElementById('display-url').textContent = config.data.supabaseUrl;
        document.getElementById('display-key').textContent = config.data.supabaseKey.substring(0, 20) + '...';
        
        // Generate share link
        const shareLink = generateConfigShareUrl(config.data.supabaseUrl, config.data.supabaseKey);
        document.getElementById('config-share-link').value = shareLink;
        
    } else {
        // Update status indicators
        statusDisplay.innerHTML = `
            <span class="status-dot offline"></span>
            <span class="status-text">Not Configured</span>
        `;
        statusIndicator.textContent = '⚠️';
        statusIndicator.style.color = '#f59e0b';
        
        // Hide sharing card
        sharingCard.style.display = 'none';
    }
}

function saveSupabaseConfig() {
    const supabaseUrl = document.getElementById('supabase-url-input').value.trim();
    const supabaseKey = document.getElementById('supabase-key-input').value.trim();
    const deployedUrl = document.getElementById('deployed-url-input').value.trim();
    
    // Validate input
    const validation = supabaseConfig.validateConfig(supabaseUrl, supabaseKey);
    
    if (!validation.valid) {
        showConfigFeedback(validation.errors.join('<br>'), 'error');
        return;
    }
    
    // Save configuration
    const result = supabaseConfig.saveConfig(supabaseUrl, supabaseKey, deployedUrl);
    
    if (result.success) {
        showConfigFeedback('Configuration saved successfully! You can now use the Game Chat.', 'success');
        refreshConfigDisplay();
        
        // Reinitialize Supabase with new config
        if (typeof initializeSupabase === 'function') {
            initializeSupabase();
        }
    } else {
        showConfigFeedback(result.message, 'error');
    }
}

async function testSupabaseConnection() {
    const supabaseUrl = document.getElementById('supabase-url-input').value.trim();
    const supabaseKey = document.getElementById('supabase-key-input').value.trim();
    
    // Validate input first
    const validation = supabaseConfig.validateConfig(supabaseUrl, supabaseKey);
    
    if (!validation.valid) {
        showConfigFeedback(validation.errors.join('<br>'), 'error');
        return;
    }
    
    showConfigFeedback('Testing connection...', 'info');
    
    try {
        // Create temporary Supabase client for testing
        const testClient = window.supabase?.createClient(supabaseUrl, supabaseKey);
        
        if (!testClient) {
            throw new Error('Supabase library not loaded');
        }
        
        // Test connection by trying to query a simple table or function
        const { data, error } = await testClient
            .from('game_sessions')
            .select('id')
            .limit(1);
        
        if (error && error.code === 'PGRST116') {
            // Table doesn't exist - this is expected if SQL hasn't been run
            showConfigFeedback('✅ Connection successful! Please run the setup SQL in your Supabase dashboard.', 'warning');
        } else if (error) {
            throw error;
        } else {
            showConfigFeedback('✅ Connection successful! Tables are set up correctly.', 'success');
        }
        
    } catch (error) {
        console.error('Connection test failed:', error);
        showConfigFeedback(`❌ Connection failed: ${error.message}`, 'error');
    }
}

function clearSupabaseConfig() {
    if (confirm('Are you sure you want to clear the Supabase configuration?')) {
        const result = supabaseConfig.clearConfig();
        
        if (result.success) {
            showConfigFeedback('Configuration cleared', 'info');
            document.getElementById('supabase-url-input').value = '';
            document.getElementById('supabase-key-input').value = '';
            document.getElementById('deployed-url-input').value = '';
            refreshConfigDisplay();
        } else {
            showConfigFeedback(result.message, 'error');
        }
    }
}

function showConfigFeedback(message, type) {
    const feedback = document.getElementById('config-feedback');
    feedback.className = `config-feedback ${type}`;
    feedback.innerHTML = message;
    feedback.style.display = 'block';
    
    // Auto-hide after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 5000);
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function generateAppBaseUrl() {
    // Check if we have a configured deployed URL
    const config = supabaseConfig.loadConfig();
    if (config.success && config.data.deployedUrl) {
        // Use the configured deployed URL
        return config.data.deployedUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    
    // Fallback to current location (for development)
    return `${window.location.origin}${window.location.pathname}`;
}

function generateSessionUrl(sessionCode) {
    // Generate a session URL using the Supabase connection URL + session parameter
    // This is what players use to connect to the same database session
    const config = supabaseConfig.loadConfig();
    if (config.success && config.data.supabaseUrl) {
        // Use the stored Supabase URL with session parameter
        return `${config.data.supabaseUrl}?session=${sessionCode}`;
    }
    
    // Fallback - shouldn't happen if properly configured
    console.warn('No Supabase URL found in configuration');
    return `Not available - Configure Supabase first`;
}

function generateConfigShareUrl(supabaseUrl, supabaseKey) {
    // Generate a config sharing URL
    const shareData = btoa(JSON.stringify({
        url: supabaseUrl,
        key: supabaseKey
    }));
    const baseUrl = generateAppBaseUrl();
    return `${baseUrl}?config=${shareData}`;
}

// ========================================
// EXTERNAL LINKS AND HELPERS
// ========================================
function openSupabaseSignup() {
    window.open('https://supabase.com/dashboard/sign-up', '_blank');
}

function openSupabaseGuide() {
    // Could link to your own detailed guide or Supabase docs
    window.open('https://supabase.com/docs/guides/api/api-keys', '_blank');
}

function copySetupSQL() {
    const sql = `-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(10) UNIQUE NOT NULL,
    dm_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT true
);

-- Game messages table  
CREATE TABLE IF NOT EXISTS game_messages (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(10) REFERENCES game_sessions(session_code),
    player_name VARCHAR(100) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    message_text TEXT,
    game_data JSONB,
    is_storyteller BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE game_messages;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_session ON game_messages(session_code, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON game_sessions(session_code);`;
    
    copyToClipboard(sql);
    showConfigFeedback('Setup SQL copied to clipboard!', 'success');
}

function copyConfigShareLink() {
    const shareLink = document.getElementById('config-share-link').value;
    copyToClipboard(shareLink);
    showConfigFeedback('Share link copied to clipboard!', 'success');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Success handled by caller
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    });
}

// ========================================
// AUTO-CONFIGURATION FROM URL
// ========================================
function checkForSharedConfig() {
    const urlParams = new URLSearchParams(window.location.search);
    const configData = urlParams.get('config');
    
    if (configData) {
        try {
            const config = JSON.parse(atob(configData));
            
            if (config.url && config.key) {
                // Fill the form
                document.getElementById('supabase-url-input').value = config.url;
                document.getElementById('supabase-key-input').value = config.key;
                
                // Switch to config tab
                switchTab('config');
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('[data-tab="config"]').classList.add('active');
                
                // Show notification
                showConfigFeedback('Configuration loaded from shared link! Click "Save Configuration" to apply.', 'info');
                
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error('Failed to parse shared config:', error);
        }
    }
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        addConfigurationTab();
        checkForSharedConfig();
        
        // Check if we should start with config tab active
        if (!supabaseConfig.hasConfig()) {
            // Switch to config tab if not configured
            switchTab('config');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-tab="config"]').classList.add('active');
        }
    }, 500);
});

// Export for use by other modules
if (typeof window !== 'undefined') {
    window.supabaseConfigManager = {
        supabaseConfig,
        refreshConfigDisplay,
        saveSupabaseConfig,
        testSupabaseConnection,
        clearSupabaseConfig,
        generateAppBaseUrl,
        generateSessionUrl,
        generateConfigShareUrl
    };
}
