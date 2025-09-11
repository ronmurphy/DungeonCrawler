# DLCHAR Command Usage Guide

## Overview
The `/dlchar:URL` command allows players and Story Tellers to download character files directly from GitHub URLs and import them into the V4-network character sheet application.

## Command Format
```
DLCHAR:PlayerName:GitHub_URL
```

## Usage Examples

### Basic Usage
```
DLCHAR:TestPlayer:https://raw.githubusercontent.com/username/repo/main/characters/test-character.json
```

### With GitHub Regular URL (auto-converted to raw)
```
DLCHAR:TestPlayer:https://github.com/username/repo/blob/main/characters/test-character.dcw
```

## Supported File Types
- `.json` - JSON character files
- `.dcw` - DCC character files (must contain valid JSON)

## How It Works

1. **Send Command**: Type the DLCHAR command in chat
2. **URL Validation**: System checks if URL is from GitHub
3. **URL Conversion**: Automatically converts GitHub blob URLs to raw.githubusercontent.com format
4. **Download**: Fetches the character file from the URL
5. **Parse**: Validates and parses the JSON content
6. **Import**: Attempts to import using the character manager if available
7. **Feedback**: Shows success/error message in chat

## Features

### Automatic URL Conversion
The system automatically converts these URL formats:
- `github.com/user/repo/blob/main/file.json` → `raw.githubusercontent.com/user/repo/main/file.json`

### Error Handling
- Invalid URLs (non-GitHub)
- Network errors (404, timeout)
- Invalid JSON format
- Missing character data
- Import failures

### Character Manager Integration
- If `window.characterManager.importCharacterFromData()` is available, automatically imports
- If not available, stores in localStorage for manual import
- Provides feedback on storage location

## Chat Integration

### Silent Command Processing
- Original command is hidden from chat display
- Only success/error messages are shown
- Messages appear from "Character System"

### Success Messages
```
Character "Sluuupy the Brave" downloaded and imported successfully!
```

### Error Messages
```
❌ Character download failed: Invalid JSON format in character file
```

## Security Features

### URL Validation
- Only GitHub URLs are accepted
- Prevents arbitrary file downloads
- Validates file extensions

### JSON Validation
- Ensures valid JSON format
- Checks for required character fields
- Safe parsing with error handling

## Example Character File Structure

### JSON Format
```json
{
  "name": "Sluuupy the Brave",
  "character_name": "Sluuupy",
  "level": 3,
  "class": "Warrior",
  "stats": {
    "strength": 16,
    "dexterity": 12,
    "constitution": 14,
    "intelligence": 10,
    "wisdom": 13,
    "charisma": 8
  },
  "inventory": [
    "Sword of Testing",
    "Shield of Debugging"
  ]
}
```

## Testing the Command

### Step 1: Create Test Character
1. Create a JSON character file
2. Upload to GitHub repository
3. Get the raw URL

### Step 2: Use Command
1. Join a chat session
2. Type: `DLCHAR:TestPlayer:https://raw.githubusercontent.com/your-repo/character.json`
3. Watch for success/error message

### Step 3: Verify Import
1. Check character manager for new character
2. Or check localStorage for temporary storage key

## Troubleshooting

### Common Issues

**"URL must be from GitHub"**
- Ensure URL contains 'github' or 'githubusercontent'
- Use proper GitHub repository URLs

**"Failed to fetch character file: 404"**
- Check URL is correct and publicly accessible
- Verify file exists at the specified path

**"Invalid JSON format"**
- Validate JSON syntax in your character file
- Ensure proper character structure

**"Character import failed"**
- Check if character manager is available
- Look for temporary storage in localStorage

### Debug Information
All DLCHAR operations are logged to browser console with:
- 📥 Command reception
- 🔄 URL processing and fetching
- ✅ Success confirmations
- ❌ Error details

## Integration with Android 15 Workaround

This command specifically addresses Android 15 file access restrictions:
- No local file system access required
- Works entirely through network requests
- Bypasses Android 15 scoped storage limitations
- Provides cloud-based character sharing solution

## Future Enhancements

Potential improvements:
- Support for other git hosting services
- Batch character download
- Character validation before import
- Version control integration
- Character sharing marketplace

---

## Technical Implementation

The DLCHAR command is implemented in:
- `chatCommandParser.js` - Command pattern matching and processing
- `supabase-chat.js` - Chat integration and message handling
- Pattern: `/^(DLCHAR):([^:]+):(.+)$/i`
- Function: `handleDlcharCommand(targetPlayer, charUrl, senderName)`

Built into both:
- V4-network main application
- Cordova mobile builds

Ready for Android 15 testing with signed APK!
