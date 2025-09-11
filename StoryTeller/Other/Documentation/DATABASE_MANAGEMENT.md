# Database Management Guide

## Overview
The DCC StoryTeller uses Supabase for real-time chat and data storage. The free tier includes:
- **500MB Database Storage** (includes all messages, sessions, and user data)
- **2GB Bandwidth** per month
- Real-time subscriptions

## CLEAN Command

The CLEAN command helps manage database storage by removing old messages to stay within the 500MB limit.

### Usage

**From Command Center:**
- Click "🧹 Clean Old" to remove messages older than 7 days
- Click "🗑️ Clean All" to remove ALL session messages (requires confirmation)

**From Chat (Storytellers Only):**
- `CLEAN:session:old` - Remove messages older than 7 days
- `CLEAN:session:all` - Remove ALL messages from current session

### Safety Features

1. **Storyteller Only**: Only storytellers can execute CLEAN commands
2. **Session Scoped**: Only cleans current session, never affects other sessions
3. **Confirmation Required**: "Clean All" requires explicit confirmation
4. **Safe Default**: Default behavior is to clean old messages only

### Database Tables

The system uses two main tables:
- `game_sessions` - Session information (minimal storage impact)
- `game_messages` - All chat messages (grows over time)

### Storage Monitoring

Messages are the main storage consumer. A typical session might include:
- Chat messages: ~1KB each
- Command results: ~2KB each  
- Game data: ~3KB each

**Example**: A 4-hour session with 200 messages ≈ 400KB

### Best Practices

1. **Weekly Cleanup**: Run "Clean Old" weekly for active sessions
2. **Session Archival**: Use "Clean All" when ending long campaigns
3. **Monitor Usage**: Check Supabase dashboard for storage usage
4. **Local Backups**: Consider saving important messages locally

### Technical Details

The CLEAN command executes SQL DELETE operations:

```sql
-- Clean Old (7+ days)
DELETE FROM game_messages 
WHERE session_code = 'SESSION' 
AND created_at < (NOW() - INTERVAL '7 days');

-- Clean All
DELETE FROM game_messages 
WHERE session_code = 'SESSION';
```

### Troubleshooting

**Storage Warnings**: If you approach 500MB:
1. Run "Clean Old" on all active sessions
2. Archive completed campaigns with "Clean All"
3. Consider upgrading to Supabase Pro ($25/month) for more storage

**Command Failures**: 
- Ensure you're connected to Supabase
- Verify storyteller permissions
- Check console for detailed error messages
