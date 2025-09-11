/**
 * Chat Image Upload Integration
 * Integrates image upload buttons into existing chat interfaces
 */

class ChatImageUploadIntegration {
    constructor() {
        this.initialized = false;
        this.fileInput = null;
        this.currentButton = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        if (this.initialized) return;
        
        // Wait for image hosting system to be ready
        if (!window.multiImageHost) {
            setTimeout(() => this.init(), 500);
            return;
        }

        this.setupButtons();
        this.initialized = true;
        console.log('✅ Chat Image Upload Integration initialized');
    }

    setupButtons() {
        // Setup StoryTeller chat toolbar button
        const storytellerBtn = document.getElementById('chat-image-upload-btn');
        if (storytellerBtn) {
            storytellerBtn.onclick = () => this.handleUploadClick(storytellerBtn);
            console.log('📷 StoryTeller image upload button connected');
        }

        // Setup V4-network tools button
        const v4Btn = document.getElementById('v4-image-upload-btn');
        if (v4Btn) {
            v4Btn.onclick = () => this.handleUploadClick(v4Btn);
            console.log('📷 V4-network image upload button connected');
        }

        // Create reusable hidden file input
        this.createFileInput();
    }

    createFileInput() {
        if (this.fileInput) {
            this.fileInput.remove();
        }

        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'image/*';
        this.fileInput.style.display = 'none';
        this.fileInput.onchange = (e) => this.handleFileSelected(e);
        
        document.body.appendChild(this.fileInput);
    }

    async handleUploadClick(button) {
        if (!window.multiImageHost) {
            this.showError('Image hosting system not ready. Please wait...');
            return;
        }

        // Check if we have a token
        let hasToken = false;
        if (window.githubTokenStorage) {
            try {
                const token = await window.githubTokenStorage.getToken();
                hasToken = !!token;
            } catch (error) {
                // Fallback check
                hasToken = !!localStorage.getItem('github_api_token');
            }
        } else {
            hasToken = !!localStorage.getItem('github_api_token');
        }

        if (!hasToken) {
            this.showError('GitHub API token not configured. Please use /github:TOKEN command first.');
            return;
        }

        this.currentButton = button;
        this.fileInput.click();
    }

    async handleFileSelected(event) {
        const file = event.target.files[0];
        if (!file) return;

        const button = this.currentButton;
        if (!button) return;

        // Update button state
        const originalText = button.innerHTML;
        button.innerHTML = '<span>⬆️</span><span>Uploading...</span>';
        button.disabled = true;
        button.style.pointerEvents = 'none';

        try {
            console.log(`📁 Uploading: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            
            const result = await window.multiImageHost.uploadImage(file);
            
            // Success feedback
            button.innerHTML = '<span>✅</span><span>Success!</span>';
            button.style.background = 'var(--success, #28a745)';
            button.style.color = 'white';
            button.style.borderColor = 'var(--success, #28a745)';
            
            console.log('✅ Upload successful:', result);
            
            // Send image message to all players via Supabase
            // This will create the public image button when the message comes back from Supabase
            await this.sendImageToChat(result);
            
            // Show brief success message
            this.showSuccess(`Image uploaded successfully! (${result.service})`);
            
        } catch (error) {
            console.error('❌ Upload failed:', error);
            
            // Error feedback
            button.innerHTML = '<span>❌</span><span>Failed</span>';
            button.style.background = 'var(--danger, #dc3545)';
            button.style.color = 'white';
            button.style.borderColor = 'var(--danger, #dc3545)';
            
            this.showError(`Upload failed: ${error.message}`);
        }

        // Reset button after delay
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
            button.style.pointerEvents = '';
            button.style.background = '';
            button.style.color = '';
            button.style.borderColor = '';
        }, 3000);

        // Reset file input
        this.createFileInput();
    }

    async sendImageToChat(uploadResult) {
        // Send image message to all players via Supabase (StoryTeller version)
        try {
            // Create image message with special formatting for chat processing
            const imageMessage = `🖼️ [IMAGE:${uploadResult.url}]`;
            
            console.log('📤 Sending image message to chat:', imageMessage);
            
            // Use StoryTeller's chat functions
            if (typeof window.sendChatMessageAsync === 'function') {
                await window.sendChatMessageAsync(imageMessage);
                console.log('✅ Image message sent to all players via StoryTeller Supabase async');
            } else if (typeof window.sendChatMessage === 'function') {
                await window.sendChatMessage(imageMessage);
                console.log('✅ Image message sent to all players via StoryTeller Supabase sync');
            } else if (window.supabaseChat && typeof window.supabaseChat.sendChatMessage === 'function') {
                await window.supabaseChat.sendChatMessage(imageMessage);
                console.log('✅ Image message sent via StoryTeller supabaseChat');
            } else {
                console.log('⚠️ No Supabase chat functions available - falling back to local display');
                // Fallback to local display if Supabase not available
                this.insertImageIntoChat(uploadResult);
            }
            
        } catch (error) {
            console.error('❌ Failed to send image to chat:', error);
            // Fallback to local display on error
            this.insertImageIntoChat(uploadResult);
        }
    }

    insertImageIntoChat(uploadResult) {
        try {
            // Add as a chat message with just the button info, then inject the button
            if (window.addChatMessage && typeof window.addChatMessage === 'function') {
                // Use a simple placeholder that we'll replace with the actual button
                const placeholderText = `Image shared`;
                window.addChatMessage(placeholderText, 'system');
                
                // Wait for the message to be added, then replace the placeholder
                setTimeout(() => {
                    this.replacePlaceholderWithButton(uploadResult);
                }, 100);
            } else {
                console.log('💡 Image URL for sharing:', uploadResult.url);
                // Fallback: open in new tab if no chat system
                window.open(uploadResult.url, '_blank');
            }
            
        } catch (error) {
            console.error('Failed to insert image into chat:', error);
        }
    }

    replacePlaceholderWithButton(uploadResult) {
        // Find chat messages that contain our placeholder
        const chatMessages = document.querySelectorAll('.chat-message');
        for (let i = chatMessages.length - 1; i >= 0; i--) {
            const message = chatMessages[i];
            if (message.innerHTML && message.innerHTML.includes('Image shared') && !message.querySelector('[data-image-url]')) {
                // Create the button
                const imageButton = document.createElement('button');
                imageButton.setAttribute('data-image-url', uploadResult.url);
                imageButton.style.cssText = `
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 8px;
                    padding: 8px 12px;
                    margin: 4px 8px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: white;
                    font-size: 0.9em;
                    transition: all 0.2s;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    vertical-align: middle;
                `;
                
                imageButton.innerHTML = `
                    <span style="font-size: 1.2em;">📷</span>
                    <span>View Image</span>
                    <small style="opacity: 0.8; font-size: 0.8em;">(${uploadResult.service})</small>
                `;
                
                // Use ChatImageSystem if available
                imageButton.onclick = () => {
                    if (window.chatImageSystem && window.chatImageSystem.openImageModal) {
                        window.chatImageSystem.openImageModal(uploadResult.url, 'You');
                    } else {
                        this.openImageModal(uploadResult);
                    }
                };
                
                imageButton.onmouseover = function() {
                    this.style.transform = 'translateY(-1px)';
                    this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                };
                
                imageButton.onmouseout = function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
                };

                // Replace the "Image shared" text with just "📷" and append button
                message.innerHTML = message.innerHTML.replace('Image shared', '📷');
                message.appendChild(imageButton);
                
                console.log('✅ Image button added to chat message');
                break;
            }
        }
    }

    openImageModal(uploadResult) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.closeImageModal(overlay);
            }
        };

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.style.maxWidth = '95vw';
        modal.style.maxHeight = '95vh';

        // Create modal header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <h3>
                <span>📷</span>
                <span>Shared Image</span>
                <small style="opacity: 0.8; margin-left: 8px;">(${uploadResult.service})</small>
            </h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                <span style="font-size: 1.2em;">×</span>
            </button>
        `;

        // Create modal body
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.style.padding = '0';
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.style.alignItems = 'center';

        // Create image element
        const img = document.createElement('img');
        img.src = uploadResult.url;
        img.style.cssText = `
            max-width: 100%;
            max-height: 70vh;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 4px;
            margin-bottom: 16px;
        `;
        
        // Add loading state
        img.onload = () => {
            loadingDiv.style.display = 'none';
            img.style.display = 'block';
        };
        
        img.onerror = () => {
            loadingDiv.innerHTML = '❌ Failed to load image';
        };

        // Create loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
            padding: 40px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        `;
        loadingDiv.innerHTML = '⏳ Loading image...';

        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.style.cssText = `
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 0.9em;
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 8px;
            transition: all 0.2s;
        `;
        downloadBtn.innerHTML = `
            <span>📥</span>
            <span>Download Image</span>
        `;
        downloadBtn.onclick = () => this.downloadImage(uploadResult);
        
        downloadBtn.onmouseover = function() {
            this.style.transform = 'translateY(-1px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        };
        
        downloadBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        };

        // Assemble modal
        body.appendChild(loadingDiv);
        body.appendChild(img);
        body.appendChild(downloadBtn);
        
        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);
        
        // Add to document
        document.body.appendChild(overlay);
        
        // Focus trap
        const closeBtn = header.querySelector('.modal-close');
        closeBtn.focus();
        
        // Hide image initially
        img.style.display = 'none';
    }

    closeImageModal(overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 200);
    }

    async downloadImage(uploadResult) {
        try {
            const response = await fetch(uploadResult.url);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = uploadResult.filename || 'shared-image.jpg';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showSuccess('Image downloaded successfully!');
        } catch (error) {
            console.error('Download failed:', error);
            this.showError('Failed to download image');
        }
    }

    showSuccess(message) {
        // Use the existing chat notification system
        if (window.addChatMessage && typeof window.addChatMessage === 'function') {
            window.addChatMessage(`✅ ${message}`, 'system');
        } else {
            console.log('✅', message);
        }
    }

    showError(message) {
        // Use the existing chat notification system
        if (window.addChatMessage && typeof window.addChatMessage === 'function') {
            window.addChatMessage(`❌ ${message}`, 'system');
        } else {
            console.error('❌', message);
        }
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    /* Image button styles for chat messages */
    .chat-message button[data-image-url] {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 8px 12px !important;
        margin: 4px !important;
        cursor: pointer !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        color: white !important;
        font-size: 0.9em !important;
        transition: all 0.2s !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
    }
    
    .chat-message button[data-image-url]:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    }
`;
document.head.appendChild(style);

// Initialize when script loads
window.chatImageUploadIntegration = new ChatImageUploadIntegration();
