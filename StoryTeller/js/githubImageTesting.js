/**
 * GitHub Image Testing and Debugging Functions
 * Provides console functions for testing the image hosting system
 */

// Test file picker and upload function
window.testImageUpload = function() {
    console.log('🧪 Creating image upload test button...');
    
    // Check if MultiImageHost is available
    if (!window.multiImageHost) {
        console.error('❌ MultiImageHost not found - system not initialized');
        return;
    }
    
    // Create a visible button for user to click
    const button = document.createElement('button');
    button.textContent = '📷 Select Image to Upload';
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 10px 20px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    
    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log(`📁 Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            
            // Remove the test button
            document.body.removeChild(button);
            document.body.removeChild(input);
            
            if (window.multiImageHost) {
                console.log('⬆️ Starting upload...');
                window.multiImageHost.uploadImage(file)
                    .then(result => {
                        console.log('✅ Upload success:', result);
                        console.log(`🔗 Image URL: ${result.url}`);
                        alert(`✅ Upload successful!\nURL: ${result.url}`);
                    })
                    .catch(error => {
                        console.error('❌ Upload failed:', error);
                        alert(`❌ Upload failed: ${error.message}`);
                    });
            }
        } else {
            console.log('❌ No file selected');
            // Remove the test button
            document.body.removeChild(button);
            document.body.removeChild(input);
        }
    };
    
    // Button click handler
    button.onclick = function() {
        input.click();
    };
    
    // Add elements to page
    document.body.appendChild(input);
    document.body.appendChild(button);
    
    console.log('🎯 Click the green button to select an image!');
};

// Check system status
window.checkImageHostingStatus = function() {
    console.log('🔍 Checking GitHub Image Hosting Status...');
    console.log('==========================================');
    
    // Check MultiImageHost
    if (window.multiImageHost) {
        console.log('✅ MultiImageHost: Available');
        console.log(`🔧 Services: ${window.multiImageHost.services?.map(s => s.name).join(', ') || 'none'}`);
        
        // Check GitHub host specifically
        if (window.multiImageHost.githubHost) {
            console.log('✅ GitHubImageHost: Available');
            const config = window.multiImageHost.githubHost.config;
            console.log(`🏪 Repository: ${config.owner}/${config.repo}`);
            console.log(`🔑 Token: ${config.apiToken ? 'Present' : 'Missing'}`);
            console.log(`📁 Session: ${window.multiImageHost.githubHost.sessionCode || 'default'}`);
        } else {
            console.log('❌ GitHubImageHost: Not found');
        }
    } else {
        console.log('❌ MultiImageHost: Not available');
    }
    
    // Check ChatImageSystem
    if (window.ChatImageSystem) {
        console.log('✅ ChatImageSystem: Available');
    } else {
        console.log('❌ ChatImageSystem: Not available');
    }
    
    // Check token storage
    if (window.githubTokenStorage) {
        console.log('✅ GitHubTokenStorage: Available');
        window.githubTokenStorage.getToken().then(token => {
            console.log(`🔑 Stored Token: ${token ? 'Present' : 'Missing'}`);
        }).catch(err => {
            console.log('❌ Token retrieval error:', err);
        });
    } else {
        // Fallback to localStorage check
        const localToken = localStorage.getItem('github_api_token');
        console.log(`🔑 localStorage Token: ${localToken ? 'Present' : 'Missing'}`);
    }
    
    console.log('==========================================');
};

// Initialize MultiImageHost if not present
window.initializeImageHosting = function() {
    console.log('🚀 Initializing Image Hosting System...');
    
    if (window.multiImageHost) {
        console.log('✅ MultiImageHost already initialized');
        return;
    }
    
    try {
        // Get token from storage
        let token = localStorage.getItem('github_api_token');
        
        const config = {
            githubOwner: 'ronmurphy',
            githubRepo: 'dcc-image-storage',
            githubToken: token
        };
        
        window.multiImageHost = new MultiImageHost(config);
        console.log('✅ MultiImageHost initialized manually');
        
        // Check status
        window.checkImageHostingStatus();
    } catch (error) {
        console.error('❌ Failed to initialize MultiImageHost:', error);
    }
};

// Quick test function
window.quickImageTest = function() {
    console.log('⚡ Quick Image Hosting Test');
    
    // Check status first
    window.checkImageHostingStatus();
    
    // If everything looks good, create upload button
    if (window.multiImageHost && window.multiImageHost.githubHost?.config?.apiToken) {
        console.log('💡 System ready! Creating upload button...');
        window.testImageUpload();
    } else {
        console.log('⚠️ System not ready. Try: window.initializeImageHosting()');
    }
};

// Create permanent upload button for testing
window.createUploadButton = function() {
    // Remove any existing test button
    const existing = document.getElementById('github-test-button');
    if (existing) {
        existing.remove();
    }
    
    // Create a permanent test button
    const button = document.createElement('button');
    button.id = 'github-test-button';
    button.textContent = '📷 Test GitHub Upload';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        padding: 12px 24px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;
    
    button.onmouseover = function() {
        this.style.background = '#45a049';
        this.style.transform = 'scale(1.05)';
    };
    
    button.onmouseout = function() {
        this.style.background = '#4CAF50';
        this.style.transform = 'scale(1)';
    };
    
    button.onclick = function() {
        if (!window.multiImageHost) {
            alert('❌ Image hosting system not initialized.\nTry running: window.initializeImageHosting()');
            return;
        }
        
        // Create file input for this click
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log(`📁 Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
                
                button.textContent = '⬆️ Uploading...';
                button.disabled = true;
                
                window.multiImageHost.uploadImage(file)
                    .then(result => {
                        console.log('✅ Upload success:', result);
                        button.textContent = '✅ Upload Success!';
                        button.style.background = '#28a745';
                        
                        // Show success popup
                        alert(`✅ Upload successful!\n\nService: ${result.service}\nURL: ${result.url}`);
                        
                        // Reset button after delay
                        setTimeout(() => {
                            button.textContent = '📷 Test GitHub Upload';
                            button.style.background = '#4CAF50';
                            button.disabled = false;
                        }, 3000);
                    })
                    .catch(error => {
                        console.error('❌ Upload failed:', error);
                        button.textContent = '❌ Upload Failed';
                        button.style.background = '#dc3545';
                        
                        alert(`❌ Upload failed:\n${error.message}`);
                        
                        // Reset button after delay
                        setTimeout(() => {
                            button.textContent = '📷 Test GitHub Upload';
                            button.style.background = '#4CAF50';
                            button.disabled = false;
                        }, 3000);
                    });
            }
            
            // Clean up input
            document.body.removeChild(input);
        };
        
        // Add input and trigger click
        document.body.appendChild(input);
        input.click();
    };
    
    document.body.appendChild(button);
    console.log('🎯 Permanent upload button created (bottom right corner)');
};

// Auto-check status when script loads
console.log('🔧 GitHub Image Testing functions loaded');
console.log('💡 Available functions:');
console.log('  - window.testImageUpload() - Creates temporary upload button');
console.log('  - window.createUploadButton() - Creates permanent upload button');
console.log('  - window.checkImageHostingStatus() - Check system status');
console.log('  - window.initializeImageHosting() - Manual initialization');
console.log('  - window.quickImageTest() - All-in-one test');

// Auto-check if DOM is ready
if (document.readyState === 'complete') {
    setTimeout(() => {
        window.checkImageHostingStatus();
    }, 1000);
}
