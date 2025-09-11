// Notes Panel Module
// Following the patterns established by David and Manus for StoryTeller modules

class NotesManager {
    constructor() {
        this.notes = [];
        this.currentNoteId = null;
        this.autoSaveTimeout = null;
        this.autoSaveDelay = 2000; // Auto-save after 2 seconds of inactivity
        this.unifiedStorageDB = null;
        
        this.init();
    }
    
    async initStorage() {
        if (!this.unifiedStorageDB) {
            this.unifiedStorageDB = new UnifiedStorageDB();
            await this.unifiedStorageDB.init();
            
            // Run migration from localStorage if needed
            await this.unifiedStorageDB.migrateFromLocalStorage();
        }
        return this.unifiedStorageDB;
    }
    
    async init() {
        await this.loadNotes();
        this.setupEventListeners();
        console.log('Notes Manager initialized with IndexedDB');
    }
    
    setupEventListeners() {
        // Auto-save on content change
        document.addEventListener('input', (e) => {
            if (e.target.id === 'note-title-input' || e.target.id === 'session-notes') {
                this.scheduleAutoSave();
                
                // Update preview if in preview mode
                if (e.target.id === 'session-notes') {
                    const preview = document.getElementById('markdown-preview');
                    if (preview && preview.style.display !== 'none') {
                        preview.innerHTML = this.renderMarkdown(e.target.value);
                    }
                }
            }
        });
        
        // Save on Ctrl+S
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCurrentNote();
            }
        });
    }
    
    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentNote();
        }, this.autoSaveDelay);
    }
    
    generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async loadNotes() {
        try {
            await this.initStorage();
            this.notes = await this.unifiedStorageDB.getAllNotes();
            
            // Migrate old notes to include priority and tags
            this.notes.forEach(note => {
                if (!note.priority) note.priority = 'normal';
                if (!note.tags) note.tags = [];
            });
            
            // Save back the migrated structure
            await this.saveNotes();
            
            console.log(`Loaded ${this.notes.length} notes from IndexedDB`);
        } catch (error) {
            console.error('Error loading notes from IndexedDB:', error);
            // Fallback to localStorage
            try {
                const stored = localStorage.getItem('storyteller_notes');
                if (stored) {
                    this.notes = JSON.parse(stored);
                    console.log(`Fallback: Loaded ${this.notes.length} notes from localStorage`);
                } else {
                    this.notes = [];
                }
            } catch (fallbackError) {
                console.error('Error loading fallback notes:', fallbackError);
                this.notes = [];
            }
        }
    }
    
    saveNotes() {
        // Use async operations internally but don't block the caller
        this._saveNotesAsync().catch(error => {
            console.error('Error in async save operation:', error);
        });
        return true; // Return immediately for synchronous callers
    }
    
    async _saveNotesAsync() {
        try {
            if (!this.unifiedStorageDB) {
                await this.initStorage();
            }
            
            // Save all notes to IndexedDB
            for (const note of this.notes) {
                await this.unifiedStorageDB.saveNote(note);
            }
            
            console.log(`Saved ${this.notes.length} notes to IndexedDB`);
        } catch (error) {
            console.error('Error saving notes to IndexedDB:', error);
            // Emergency fallback to localStorage
            try {
                localStorage.setItem('storyteller_notes', JSON.stringify(this.notes));
                console.log('Emergency fallback: Saved to localStorage');
            } catch (fallbackError) {
                console.error('Error with localStorage fallback:', fallbackError);
            }
        }
    }
    
    createNote(title = 'New Note', content = '') {
        const note = {
            id: this.generateId(),
            title: title,
            content: content,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            charCount: content.length,
            wordCount: content.trim().split(/\s+/).filter(w => w.length > 0).length,
            tags: [], // For storing tags like 'hot', 'new-idea', 'important'
            priority: 'normal' // normal, hot, new-idea, important
        };
        
        this.notes.unshift(note); // Add to beginning of array
        this.saveNotes();
        this.renderNotesList();
        this.selectNote(note.id);
        
        // Ensure new notes start in editor mode
        setTimeout(() => {
            this.setMarkdownView(false);
            // Focus on title input for new notes
            const titleInput = document.getElementById('note-title-input');
            if (titleInput) {
                titleInput.focus();
                titleInput.select();
            }
        }, 100);
        
        // Add chat notification
        if (typeof addChatMessage === 'function') {
            addChatMessage(`📝 Created new note: "${note.title}"`, 'system');
        }
        
        return note;
    }
    
    updateNote(id, updates) {
        const noteIndex = this.notes.findIndex(n => n.id === id);
        if (noteIndex === -1) return false;
        
        const note = this.notes[noteIndex];
        const oldTitle = note.title;
        
        // Update fields
        Object.assign(note, updates);
        note.modified = new Date().toISOString();
        
        // Update word count if content changed
        if (updates.content !== undefined) {
            note.wordCount = updates.content.trim().split(/\s+/).filter(w => w.length > 0).length;
        }
        
        this.saveNotes();
        this.renderNotesList();
        
        // Add chat notification for title changes
        if (updates.title && updates.title !== oldTitle && typeof addChatMessage === 'function') {
            addChatMessage(`📝 Renamed note: "${oldTitle}" → "${updates.title}"`, 'system');
        }
        
        return true;
    }
    
    deleteNote(id) {
        const noteIndex = this.notes.findIndex(n => n.id === id);
        if (noteIndex === -1) return false;
        
        const note = this.notes[noteIndex];
        const title = note.title;
        
        // Confirm deletion
        if (!confirm(`Delete note "${title}"?\n\nThis action cannot be undone.`)) {
            return false;
        }
        
        this.notes.splice(noteIndex, 1);
        this.saveNotes();
        this.renderNotesList();
        
        // Clear editor if this was the current note
        if (this.currentNoteId === id) {
            this.currentNoteId = null;
            this.renderEditor();
        }
        
        // Add chat notification
        if (typeof addChatMessage === 'function') {
            addChatMessage(`🗑️ Deleted note: "${title}"`, 'system');
        }
        
        return true;
    }
    
    selectNote(id) {
        // Save current note before switching
        if (this.currentNoteId && this.currentNoteId !== id) {
            this.saveCurrentNote();
        }
        
        this.currentNoteId = id;
        
        this.renderNotesList();
        this.renderEditor();
        
        // Auto-switch to markdown view for existing notes (after rendering)
        setTimeout(() => {
            const note = this.notes.find(n => n.id === id);
            if (note && note.content && note.content.trim()) {
                this.setMarkdownView(true);
            } else {
                this.setMarkdownView(false);
            }
        }, 100);
    }
    
    saveCurrentNote() {
        if (!this.currentNoteId) return false;
        
        const titleInput = document.getElementById('note-title-input');
        const contentTextarea = document.getElementById('session-notes');
        
        if (!titleInput || !contentTextarea) return false;
        
        const title = titleInput.value.trim() || 'Untitled Note';
        const content = contentTextarea.value;
        
        const updated = this.updateNote(this.currentNoteId, { title, content });
        
        if (updated) {
            this.updateNotesStats();
            // Visual feedback
            const saveBtn = document.querySelector('.notes-btn.save');
            if (saveBtn) {
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="material-icons">check</i>Saved';
                setTimeout(() => {
                    saveBtn.innerHTML = originalText;
                }, 1000);
            }
        }
        
        return updated;
    }
    
    getCurrentNote() {
        if (!this.currentNoteId) return null;
        return this.notes.find(n => n.id === this.currentNoteId);
    }
    
    // Priority and tagging methods
    setNotePriority(noteId, priority) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return false;
        
        note.priority = priority;
        note.modified = new Date().toISOString();
        this.saveNotes();
        this.renderNotesList();
        
        // Add chat notification
        if (typeof addChatMessage === 'function') {
            const priorityEmoji = {
                'hot': '🔥',
                'new-idea': '💡',
                'important': '⭐',
                'normal': '📝'
            };
            addChatMessage(`${priorityEmoji[priority]} Set note priority: "${note.title}" → ${priority}`, 'system');
        }
        
        return true;
    }
    
    toggleNoteTag(noteId, tag) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return false;
        
        if (!note.tags) note.tags = [];
        
        const tagIndex = note.tags.indexOf(tag);
        if (tagIndex === -1) {
            note.tags.push(tag);
        } else {
            note.tags.splice(tagIndex, 1);
        }
        
        note.modified = new Date().toISOString();
        this.saveNotes();
        this.renderNotesList();
        
        return true;
    }
    
    getPriorityColor(priority) {
        const colors = {
            'hot': '#ff4757',        // Red
            'new-idea': '#ffa502',   // Orange  
            'important': '#2ed573',  // Green
            'normal': 'transparent'  // No color
        };
        return colors[priority] || colors.normal;
    }
    
    getPriorityEmoji(priority) {
        const emojis = {
            'hot': '🔥',
            'new-idea': '💡',
            'important': '⭐',
            'normal': ''
        };
        return emojis[priority] || '';
    }
    
    showPriorityMenu(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        
        const priorities = [
            { key: 'normal', label: '📝 Normal', desc: 'Regular note' },
            { key: 'new-idea', label: '💡 New Idea', desc: 'Fresh creative concept' },
            { key: 'important', label: '⭐ Important', desc: 'High priority content' },
            { key: 'hot', label: '🔥 Hot', desc: 'Urgent or exciting!' }
        ];
        
        const options = priorities.map(p => `${p.label} - ${p.desc}`).join('\n');
        const choice = prompt(`Set priority for "${note.title}":\n\n${options}\n\nEnter: normal, new-idea, important, or hot`, note.priority || 'normal');
        
        if (choice && priorities.find(p => p.key === choice.toLowerCase())) {
            this.setNotePriority(noteId, choice.toLowerCase());
        }
    }
    
    filterByPriority(priority) {
        const container = document.getElementById('notes-list');
        if (!container) return;
        
        let filteredNotes = this.notes;
        
        if (priority) {
            filteredNotes = this.notes.filter(note => (note.priority || 'normal') === priority);
        }
        
        if (filteredNotes.length === 0) {
            const priorityLabels = {
                'hot': '🔥 Hot',
                'new-idea': '💡 New Ideas',
                'important': '⭐ Important', 
                'normal': '📝 Normal'
            };
            
            container.innerHTML = `
                <div class="notes-empty">
                    <i class="material-icons">filter_list_off</i>
                    <h5>No ${priorityLabels[priority] || 'Notes'} Found</h5>
                    <p>No notes found with this priority level.</p>
                    <button class="notes-btn" onclick="document.getElementById('priority-filter').value=''; window.notesManager.renderNotesList()">
                        <i class="material-icons">clear</i>Show All Notes
                    </button>
                </div>
            `;
            return;
        }
        
        // Render filtered notes (similar to renderNotesList but with filteredNotes)
        const html = filteredNotes.map(note => {
            const isActive = note.id === this.currentNoteId;
            const preview = note.content.slice(0, 100).replace(/\n/g, ' ') || 'No content';
            const dateStr = new Date(note.modified).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const notePriority = note.priority || 'normal';
            const tags = note.tags || [];
            const priorityColor = this.getPriorityColor(notePriority);
            const priorityEmoji = this.getPriorityEmoji(notePriority);
            
            return `
                <div class="note-item ${isActive ? 'active' : ''} priority-${notePriority}" 
                     onclick="window.notesManager.selectNote('${note.id}')"
                     style="border-left: 4px solid ${priorityColor};">
                    <div class="note-content">
                        <div class="note-title">
                            ${priorityEmoji ? `<span class="priority-indicator">${priorityEmoji}</span>` : ''}
                            ${this.escapeHtml(note.title)}
                        </div>
                        <div class="note-preview">${this.escapeHtml(preview)}</div>
                        ${tags.length > 0 ? `<div class="note-tags">${tags.map(tag => `<span class="note-tag">#${tag}</span>`).join(' ')}</div>` : ''}
                    </div>
                    <div class="note-meta">
                        <span class="note-date">${dateStr}</span>
                        <div class="note-actions">
                            <button class="note-action-btn priority-btn" onclick="event.stopPropagation(); window.notesManager.showPriorityMenu('${note.id}')" title="Set Priority">
                                <i class="material-icons">flag</i>
                            </button>
                            <button class="note-action-btn" onclick="event.stopPropagation(); window.notesManager.duplicateNote('${note.id}')" title="Duplicate">
                                <i class="material-icons">content_copy</i>
                            </button>
                            <button class="note-action-btn danger" onclick="event.stopPropagation(); window.notesManager.deleteNote('${note.id}')" title="Delete">
                                <i class="material-icons">delete</i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }
    
    renderNotesList() {
        const container = document.getElementById('notes-list');
        if (!container) return;
        
        if (this.notes.length === 0) {
            container.innerHTML = `
                <div class="notes-empty">
                    <i class="material-icons">note_add</i>
                    <h5>No Notes Yet</h5>
                    <p>Create your first note to start organizing your session thoughts and ideas.</p>
                    <button class="notes-btn new" onclick="window.notesManager.createNote()">
                        <i class="material-icons">add</i>Create First Note
                    </button>
                </div>
            `;
            return;
        }
        
        const html = this.notes.map(note => {
            const isActive = note.id === this.currentNoteId;
            const preview = note.content.slice(0, 100).replace(/\n/g, ' ') || 'No content';
            const dateStr = new Date(note.modified).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Handle priority and tags for backward compatibility
            const priority = note.priority || 'normal';
            const tags = note.tags || [];
            const priorityColor = this.getPriorityColor(priority);
            const priorityEmoji = this.getPriorityEmoji(priority);
            
            return `
                <div class="note-item ${isActive ? 'active' : ''} priority-${priority}" 
                     onclick="window.notesManager.selectNote('${note.id}')"
                     style="border-left: 4px solid ${priorityColor};">
                    <div class="note-content">
                        <div class="note-title">
                            ${priorityEmoji ? `<span class="priority-indicator">${priorityEmoji}</span>` : ''}
                            ${this.escapeHtml(note.title)}
                        </div>
                        <div class="note-preview">${this.escapeHtml(preview)}</div>
                        ${tags.length > 0 ? `<div class="note-tags">${tags.map(tag => `<span class="note-tag">#${tag}</span>`).join(' ')}</div>` : ''}
                    </div>
                    <div class="note-meta">
                        <span class="note-date">${dateStr}</span>
                        <div class="note-actions">
                            <button class="note-action-btn priority-btn" onclick="event.stopPropagation(); window.notesManager.showPriorityMenu('${note.id}')" title="Set Priority">
                                <i class="material-icons">flag</i>
                            </button>
                            <button class="note-action-btn" onclick="event.stopPropagation(); window.notesManager.duplicateNote('${note.id}')" title="Duplicate">
                                <i class="material-icons">content_copy</i>
                            </button>
                            <button class="note-action-btn danger" onclick="event.stopPropagation(); window.notesManager.deleteNote('${note.id}')" title="Delete">
                                <i class="material-icons">delete</i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }
    
    renderEditor() {
        const titleInput = document.getElementById('note-title-input');
        const contentTextarea = document.getElementById('session-notes');
        
        if (!titleInput || !contentTextarea) return;
        
        const note = this.getCurrentNote();
        
        if (note) {
            titleInput.value = note.title;
            contentTextarea.value = note.content;
            titleInput.disabled = false;
            contentTextarea.disabled = false;
            contentTextarea.placeholder = "Write your session notes here...";
        } else {
            titleInput.value = '';
            contentTextarea.value = '';
            titleInput.disabled = true;
            contentTextarea.disabled = true;
            contentTextarea.placeholder = "Select a note to start editing, or create a new one";
        }
        
        this.updateNotesStats();
    }
    
    updateNotesStats() {
        const statsContainer = document.getElementById('notes-stats');
        if (!statsContainer) return;
        
        const note = this.getCurrentNote();
        
        if (note) {
            const wordCount = note.content.trim().split(/\s+/).filter(w => w.length > 0).length;
            const charCount = note.content.length;
            const lineCount = note.content.split('\n').length;
            
            statsContainer.innerHTML = `
                <div class="notes-stats-item">
                    <i class="material-icons">description</i>
                    <span>${wordCount} words</span>
                </div>
                <div class="notes-stats-item">
                    <i class="material-icons">text_fields</i>
                    <span>${charCount} characters</span>
                </div>
                <div class="notes-stats-item">
                    <i class="material-icons">format_list_numbered</i>
                    <span>${lineCount} lines</span>
                </div>
                <div class="notes-stats-item">
                    <i class="material-icons">schedule</i>
                    <span>Modified: ${new Date(note.modified).toLocaleTimeString()}</span>
                </div>
            `;
        } else {
            statsContainer.innerHTML = `
                <div class="notes-stats-item">
                    <i class="material-icons">info</i>
                    <span>No note selected</span>
                </div>
            `;
        }
    }
    
    duplicateNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return false;
        
        const newNote = this.createNote(
            `${note.title} (Copy)`,
            note.content
        );
        
        return newNote;
    }
    
    exportNotes(format = 'json') {
        const data = {
            exportDate: new Date().toISOString(),
            noteCount: this.notes.length,
            notes: this.notes
        };
        
        let content, filename, mimeType;
        
        switch (format) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                filename = `storyteller_notes_${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json';
                break;
                
            case 'txt':
                content = this.notes.map(note => {
                    return `# ${note.title}\n\nCreated: ${new Date(note.created).toLocaleString()}\nModified: ${new Date(note.modified).toLocaleString()}\n\n${note.content}\n\n${'='.repeat(50)}\n\n`;
                }).join('');
                filename = `storyteller_notes_${new Date().toISOString().split('T')[0]}.txt`;
                mimeType = 'text/plain';
                break;
                
            case 'md':
                content = `# Session Notes Export\n\nExported: ${new Date().toLocaleString()}\nTotal Notes: ${this.notes.length}\n\n---\n\n` +
                    this.notes.map(note => {
                        return `## ${note.title}\n\n**Created:** ${new Date(note.created).toLocaleString()}  \n**Modified:** ${new Date(note.modified).toLocaleString()}\n\n${note.content}\n\n---\n\n`;
                    }).join('');
                filename = `storyteller_notes_${new Date().toISOString().split('T')[0]}.md`;
                mimeType = 'text/markdown';
                break;
                
            default:
                throw new Error('Unsupported export format');
        }
        
        this.downloadFile(content, filename, mimeType);
        
        // Add chat notification
        if (typeof addChatMessage === 'function') {
            addChatMessage(`📤 Exported ${this.notes.length} notes as ${format.toUpperCase()}`, 'system');
        }
        
        return true;
    }
    
    importNotes(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (!data.notes || !Array.isArray(data.notes)) {
                throw new Error('Invalid notes format');
            }
            
            const importedCount = data.notes.length;
            let addedCount = 0;
            
            // Add imported notes
            data.notes.forEach(note => {
                // Generate new ID to avoid conflicts
                const newNote = {
                    ...note,
                    id: this.generateId(),
                    imported: new Date().toISOString()
                };
                
                this.notes.unshift(newNote);
                addedCount++;
            });
            
            this.saveNotes();
            this.renderNotesList();
            
            // Add chat notification
            if (typeof addChatMessage === 'function') {
                addChatMessage(`📥 Imported ${addedCount} notes successfully`, 'system');
            }
            
            return { success: true, imported: addedCount };
            
        } catch (error) {
            console.error('Import error:', error);
            
            if (typeof addChatMessage === 'function') {
                addChatMessage(`❌ Import failed: ${error.message}`, 'system');
            }
            
            return { success: false, error: error.message };
        }
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Format text with simple markdown-like syntax
    formatText(type) {
        const textarea = document.getElementById('session-notes');
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);
        
        let formattedText = selectedText;
        
        switch (type) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'highlight':
                formattedText = `==${selectedText}==`;
                break;
            case 'strikethrough':
                formattedText = `~~${selectedText}~~`;
                break;
            case 'heading':
                formattedText = `# ${selectedText}`;
                break;
            case 'bullet':
                formattedText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
                break;
            case 'number':
                formattedText = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
                break;
        }
        
        textarea.value = beforeText + formattedText + afterText;
        textarea.focus();
        textarea.setSelectionRange(start, start + formattedText.length);
        
        this.scheduleAutoSave();
    }
    
    // Toggle between markdown preview and editor view
    toggleMarkdownView() {
        const textarea = document.getElementById('session-notes');
        const preview = document.getElementById('markdown-preview');
        const toggleBtn = document.getElementById('markdown-view-toggle');
        
        if (!textarea || !preview || !toggleBtn) return;
        
        const isPreviewMode = preview.style.display !== 'none';
        this.setMarkdownView(!isPreviewMode);
    }
    
    // Set markdown view state
    setMarkdownView(showPreview) {
        const textarea = document.getElementById('session-notes');
        const preview = document.getElementById('markdown-preview');
        const toggleBtn = document.getElementById('markdown-view-toggle');
        
        if (!textarea || !preview || !toggleBtn) return;
        
        if (showPreview) {
            // Switch to preview mode
            const content = textarea.value;
            preview.innerHTML = this.renderMarkdown(content);
            preview.style.display = 'block';
            textarea.style.display = 'none';
            toggleBtn.querySelector('i').textContent = 'edit';
            toggleBtn.title = 'Edit Markdown';
            toggleBtn.classList.add('active');
        } else {
            // Switch to editor mode
            preview.style.display = 'none';
            textarea.style.display = 'block';
            toggleBtn.querySelector('i').textContent = 'visibility';
            toggleBtn.title = 'Toggle Markdown Preview';
            toggleBtn.classList.remove('active');
        }
    }
    
    // Enhanced markdown renderer
    renderMarkdown(text) {
        if (!text) return '<p class="placeholder-text">No content to preview</p>';
        
        let html = this.escapeHtml(text);
        
        // Convert code blocks first (before other formatting)
        html = html.replace(/```([^`]*?)```/gs, '<pre><code>$1</code></pre>');
        
        // Convert inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Convert headings
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
        
        // Convert highlighting (using ==text== syntax like Obsidian)
        html = html.replace(/==(.+?)==/g, '<mark class="highlight">$1</mark>');
        
        // Convert strikethrough text
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
        
        // Convert bold text
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Convert italic text
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Convert bullet lists
        html = html.replace(/^• (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Convert numbered lists
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        // This is a simplified approach - in a real implementation you'd want better list handling
        
        // Convert line breaks to paragraphs
        html = html.split('\n\n').map(paragraph => {
            if (paragraph.trim() && !paragraph.match(/^<[hul]/)) {
                return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
            }
            return paragraph;
        }).join('\n');
        
        return html;
    }
    
    // Search notes
    searchNotes(query) {
        if (!query.trim()) {
            this.renderNotesList();
            return;
        }
        
        const results = this.notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        );
        
        // Render filtered results
        const container = document.getElementById('notes-list');
        if (!container) return;
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="notes-empty">
                    <i class="material-icons">search_off</i>
                    <h5>No Results</h5>
                    <p>No notes found matching "${this.escapeHtml(query)}"</p>
                    <button class="notes-btn" onclick="window.notesManager.renderNotesList()">
                        <i class="material-icons">clear</i>Clear Search
                    </button>
                </div>
            `;
            return;
        }
        
        // Similar to renderNotesList but with filtered results
        const html = results.map(note => {
            const isActive = note.id === this.currentNoteId;
            const preview = note.content.slice(0, 100).replace(/\n/g, ' ') || 'No content';
            const dateStr = new Date(note.modified).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="note-item ${isActive ? 'active' : ''}" onclick="window.notesManager.selectNote('${note.id}')">
                    <div class="note-content">
                        <div class="note-title">${this.escapeHtml(note.title)}</div>
                        <div class="note-preview">${this.escapeHtml(preview)}</div>
                    </div>
                    <div class="note-meta">
                        <span class="note-date">${dateStr}</span>
                        <div class="note-actions">
                            <button class="note-action-btn" onclick="event.stopPropagation(); window.notesManager.duplicateNote('${note.id}')" title="Duplicate">
                                <i class="material-icons">content_copy</i>
                            </button>
                            <button class="note-action-btn danger" onclick="event.stopPropagation(); window.notesManager.deleteNote('${note.id}')" title="Delete">
                                <i class="material-icons">delete</i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }
    
    quickSetPriority(priority) {
        if (!this.currentNoteId) {
            alert('Please select a note first');
            return;
        }
        
        this.setNotePriority(this.currentNoteId, priority);
    }
}

// Global functions to integrate with the panel system
window.notesManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (!window.notesManager) {
        window.notesManager = new NotesManager();
    }
});

// Panel integration functions
function initializeNotesPanel() {
    if (!window.notesManager) {
        window.notesManager = new NotesManager();
    }
    
    // Render the initial state
    window.notesManager.renderNotesList();
    window.notesManager.renderEditor();
}

function saveNotes() {
    if (window.notesManager) {
        return window.notesManager.saveCurrentNote();
    }
    return false;
}

function createNewNote() {
    if (window.notesManager) {
        const title = prompt('Note title:', 'New Note');
        if (title !== null) {
            window.notesManager.createNote(title);
        }
    }
}

function exportNotes() {
    if (window.notesManager) {
        // Show export modal
        showNotesModal('export');
    }
}

function importNotes() {
    if (window.notesManager) {
        // Show import modal
        showNotesModal('import');
    }
}

function showNotesModal(type) {
    const modalHtml = type === 'export' ? getExportModalHtml() : getImportModalHtml();
    
    // Create modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-content notes-modal">
            <div class="modal-header">
                <h3>
                    <i class="material-icons">${type === 'export' ? 'download' : 'upload'}</i>
                    ${type === 'export' ? 'Export' : 'Import'} Notes
                </h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="material-icons">close</i>
                </button>
            </div>
            <div class="modal-body">
                ${modalHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Setup event listeners for the modal
    if (type === 'export') {
        setupExportModal(overlay);
    } else {
        setupImportModal(overlay);
    }
}

function getExportModalHtml() {
    return `
        <div class="export-options">
            <div class="export-option selected" data-format="json">
                <h6>JSON Format</h6>
                <p>Complete data with metadata (recommended)</p>
            </div>
            <div class="export-option" data-format="txt">
                <h6>Text Format</h6>
                <p>Plain text for reading</p>
            </div>
            <div class="export-option" data-format="md">
                <h6>Markdown Format</h6>
                <p>Formatted for documentation</p>
            </div>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button class="btn btn-primary" onclick="performExport()">
                <i class="material-icons">download</i>Export Notes
            </button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                Cancel
            </button>
        </div>
    `;
}

function getImportModalHtml() {
    return `
        <div class="import-area">
            <label>Import from JSON file:</label>
            <div class="file-input-container">
                <input type="file" class="file-input" accept=".json" onchange="handleFileImport(event)">
                <label class="file-input-label">
                    <i class="material-icons">upload_file</i>
                    Choose JSON File
                </label>
            </div>
        </div>
        
        <div class="import-area">
            <label>Or paste JSON data directly:</label>
            <textarea class="import-textarea" placeholder="Paste your exported JSON data here..."></textarea>
        </div>
        
        <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button class="btn btn-primary" onclick="performImport()">
                <i class="material-icons">upload</i>Import Notes
            </button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                Cancel
            </button>
        </div>
    `;
}

function setupExportModal(overlay) {
    const options = overlay.querySelectorAll('.export-option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

function setupImportModal(overlay) {
    // File import handler is set up in the HTML
}

function performExport() {
    const selectedFormat = document.querySelector('.export-option.selected')?.dataset.format || 'json';
    if (window.notesManager) {
        window.notesManager.exportNotes(selectedFormat);
    }
    document.querySelector('.modal-overlay').remove();
}

function performImport() {
    const textarea = document.querySelector('.import-textarea');
    const jsonData = textarea.value.trim();
    
    if (!jsonData) {
        alert('Please paste JSON data to import');
        return;
    }
    
    if (window.notesManager) {
        const result = window.notesManager.importNotes(jsonData);
        if (result.success) {
            document.querySelector('.modal-overlay').remove();
        } else {
            alert(`Import failed: ${result.error}`);
        }
    }
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const textarea = document.querySelector('.import-textarea');
        textarea.value = e.target.result;
    };
    reader.readAsText(file);
}

// Text formatting functions
function formatSelectedText(type) {
    if (window.notesManager) {
        window.notesManager.formatText(type);
    }
}

// Markdown view toggle function
function toggleMarkdownView() {
    if (window.notesManager) {
        window.notesManager.toggleMarkdownView();
    }
}

// Search function
function searchNotes() {
    const query = prompt('Search notes:');
    if (query !== null && window.notesManager) {
        window.notesManager.searchNotes(query);
    }
}
