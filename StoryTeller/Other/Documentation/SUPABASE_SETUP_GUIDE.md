# Supabase Setup Guide for StoryTeller
**Essential Database Setup Instructions**

## 🎯 Purpose
This guide provides **complete step-by-step instructions** for setting up your own Supabase database for the DCC StoryTeller application. This allows you to use the app with your own free database instead of relying on someone else's setup.

---

## 📋 Why Supabase?
- ✅ **100% Free** for gaming groups (500MB database + 2GB bandwidth monthly)
- ✅ **Real-time messaging** - instant communication between DM and players
- ✅ **Automatic combat processing** - ATTACK commands processed instantly
- ✅ **Session persistence** - chat history saved automatically
- ✅ **No message limits** - unlike PubNub's 200 message restriction
- ✅ **Handles 100+ gaming sessions per month** at zero cost

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Create Free Supabase Account
1. Go to [supabase.com](https://supabase.com/dashboard/sign-up)
2. Sign up with GitHub (recommended) or email
3. Create a new organization (first-time users only)
4. Create a new project:
   - **Name:** DCC-StoryTeller (or any name you like)
   - **Database Password:** ⚠️ **IMPORTANT:** Copy this password! You'll need it later for database access
   - **Region:** Choose closest to your location
   - **Pricing Plan:** Free (default)
5. After creation, you'll see your **Project URL** and **API Keys** - keep this page open!

### Step 2: Set Up Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste this SQL code **EXACTLY**:

```sql
-- Game sessions table
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
CREATE INDEX IF NOT EXISTS idx_sessions_code ON game_sessions(session_code);
```

3. Click **Run** to create the tables
4. You should see "Success. No rows returned" message

### Step 3: Get Your API Keys
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://abc123xyz.supabase.co`)
   - **Public anon key** (long string starting with `eyJ`)

### Step 4: Configure StoryTeller App
1. Open your StoryTeller app
2. Click the **Configure** tab (first tab with ⚙️ icon)
3. Paste your **Project URL** and **API Key** into the form
4. Click **Test Connection** to verify everything works
5. Click **Save Configuration** to store the settings

---

## 🎮 Using Your Database

### Starting a Game Session
1. Open the **Game Chat** tab
2. Click **Start New Session** OR use **Quick Connect**
3. Enter your DM name and create a session code
4. Share the session code with players
5. Players join using the same session code

### Sharing with Players

**Option 1: Share Configuration Link (Recommended)**
After configuring your app, you'll see a **Share Configuration Link** in the Configure tab. Send this link to your players - it will automatically configure their apps with the same settings.

**Option 2: Manual Setup**
Players can manually enter the same Project URL and API Key in their Configure tab.

**Option 3: Quick Connect (Easiest)**
Click the Quick Connect button for instant session creation with auto-copied player URLs.

---

## 🗄️ Database Management

### Storage Limits (Free Tier)
- **500MB Database Storage** total
- **2GB Bandwidth** per month
- **Real-time subscriptions** included

### Managing Storage with CLEAN Commands

Your database will grow over time as messages accumulate. Use the CLEAN command to manage storage:

**From StoryTeller Interface:**
- Click "🧹 Clean Old" to remove messages older than 7 days
- Click "🗑️ Clean All" to remove ALL session messages

**From Chat (DMs only):**
- Type: `CLEAN:session:old` - Remove old messages
- Type: `CLEAN:session:all` - Remove ALL messages (requires confirmation)

### Storage Usage Examples
- **Typical 4-hour session**: ~400KB (200 messages)
- **Weekly campaign**: ~2-3MB total
- **Monthly campaigns**: ~8-12MB total
- **Free tier easily handles**: 40+ campaigns per month

---

## 🔧 Troubleshooting

### Common Issues

**"Connection Failed" Error:**
- Double-check your Project URL (must include `https://`)
- Verify your API key is the **anon public** key, not the secret key
- Make sure you ran the SQL table creation script

**"Tables Not Found" Error:**
- Go back to SQL Editor in Supabase
- Re-run the table creation script
- Verify the script completed without errors

**Messages Not Appearing:**
- Check that real-time subscriptions are enabled: `ALTER PUBLICATION supabase_realtime ADD TABLE game_messages;`
- Test connection in Configure tab
- Try refreshing the page

**Storage Warnings:**
- Use CLEAN commands to remove old messages
- Consider archiving completed campaigns
- Monitor usage in Supabase dashboard

### Getting Help
1. **Check Console**: Open browser developer tools for error messages
2. **Test Connection**: Use the "Test Connection" button in Configure tab
3. **Verify Tables**: Check Supabase dashboard that tables were created
4. **API Keys**: Ensure you're using the correct anon public key

---

## 🎯 What You Get

### Features Enabled by Your Database
- ✅ **Real-time chat** between DM and all players
- ✅ **Combat commands** (ATTACK, ROLL, SKILL, SAVE)
- ✅ **Session persistence** - chat history saved
- ✅ **Multiple sessions** - run multiple games simultaneously
- ✅ **Command processing** - automatic combat calculations
- ✅ **Database management** - CLEAN commands for storage
- ✅ **Mobile friendly** - auto-reconnection system
- ✅ **Player URLs** - easy sharing for quick joins

### Security & Privacy
- **Your data stays with you** - not shared with other users
- **Free tier** - no credit card required
- **API keys** stored locally in your browser only
- **Session codes** provide access control
- **Storyteller permissions** protect sensitive commands

---

## 📊 Advanced Configuration

### Multiple Projects
You can create multiple Supabase projects for different campaigns:
1. Create separate projects in Supabase dashboard
2. Use different Project URLs for different campaigns
3. Keep API keys organized for each project

### Database Access
Your database password (from Step 1) allows direct database access:
- **Host**: Your project's database URL
- **Port**: 5432
- **Database**: postgres
- **Username**: postgres
- **Password**: The password you copied in Step 1

### Backup & Export
- Supabase provides automatic daily backups on free tier
- You can export data via SQL Editor
- Chat messages are stored in `game_messages` table
- Session info is stored in `game_sessions` table

---

## 🚀 Ready to Game!

After completing this setup:
1. **Your database is ready** for unlimited gaming sessions
2. **Players can join easily** using your configuration
3. **Real-time chat works** for all participants
4. **Combat commands process automatically**
5. **Storage management** keeps you within free limits

**Next Steps:**
1. Test with a friend to verify real-time chat
2. Try combat commands: `ATTACK:TestPlayer:15:8:Sword`
3. Share player URLs with your gaming group
4. Start your first DCC session!

Your StoryTeller setup is now completely independent and ready for epic adventures! 🎲
