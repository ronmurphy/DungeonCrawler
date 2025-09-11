/**
 * Session Timer Module
 * Provides clock display and session management with notifications
 */

class SessionTimer {
    constructor() {
        this.sessionStartTime = null;
        this.sessionEndTime = null;
        this.warningShown = false;
        this.warningMinutes = 30; // Default warning time
        this.clockElement = null;
        this.timerInterval = null;
        this.notificationInterval = null;
        
        this.init();
    }

    init() {
        this.createClockDisplay();
        this.startClock();
        this.loadSessionData();
    }

    createClockDisplay() {
        // Find the Quick Connect section to position the clock inside it
        const quickConnectSection = document.querySelector('.quick-connect-section');
        if (!quickConnectSection) return;

        // Create clock container
        const clockContainer = document.createElement('div');
        clockContainer.className = 'session-clock-container';
        clockContainer.innerHTML = `
            <div class="clock-display">
                <div class="current-time" id="current-time">--:-- --</div>
                <div class="session-info" id="session-info">No session</div>
            </div>
            <div class="clock-controls">
                <button class="clock-btn" onclick="sessionTimer.showSessionDialog()" title="Set Session Timer">
                    <i class="material-icons">schedule</i>
                </button>
            </div>
        `;

        // Insert at the beginning of the quick-connect-section (before the Quick Connect button)
        quickConnectSection.insertBefore(clockContainer, quickConnectSection.firstChild);
        
        this.clockElement = document.getElementById('current-time');
        this.sessionInfoElement = document.getElementById('session-info');
    }

    startClock() {
        this.updateClock();
        this.timerInterval = setInterval(() => {
            this.updateClock();
            this.checkSessionTime();
        }, 1000);
    }

    updateClock() {
        if (!this.clockElement) return;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        this.clockElement.textContent = timeString;
        this.updateSessionInfo();
    }

    updateSessionInfo() {
        if (!this.sessionInfoElement) return;
        
        if (!this.sessionStartTime || !this.sessionEndTime) {
            this.sessionInfoElement.textContent = 'No session';
            this.sessionInfoElement.className = 'session-info';
            return;
        }

        const now = new Date();
        const endTime = new Date(this.sessionEndTime);
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            this.sessionInfoElement.textContent = 'Session ended';
            this.sessionInfoElement.className = 'session-info ended';
            return;
        }

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            this.sessionInfoElement.textContent = `${hours}h ${minutes}m left`;
        } else {
            this.sessionInfoElement.textContent = `${minutes}m left`;
        }

        // Color coding based on time left
        if (timeLeft <= 30 * 60 * 1000) { // 30 minutes
            this.sessionInfoElement.className = 'session-info warning';
        } else if (timeLeft <= 60 * 60 * 1000) { // 1 hour
            this.sessionInfoElement.className = 'session-info caution';
        } else {
            this.sessionInfoElement.className = 'session-info active';
        }
    }

    checkSessionTime() {
        if (!this.sessionEndTime) return;

        const now = new Date();
        const endTime = new Date(this.sessionEndTime);
        const timeLeft = endTime - now;

        // Show warning at the specified minutes before session end
        const warningTime = this.warningMinutes * 60 * 1000; // Convert to milliseconds
        if (timeLeft <= warningTime && timeLeft > (warningTime - 60000) && !this.warningShown) {
            this.showTimeWarning(Math.floor(timeLeft / (1000 * 60)));
            this.warningShown = true;
        }

        // Reset warning flag if we're past the warning time
        if (timeLeft > (warningTime + 60000)) {
            this.warningShown = false;
        }

        // Show session ended notification
        if (timeLeft <= 0 && timeLeft > -60000) { // Show once when session ends
            this.showSessionEndedNotification();
        }
    }

    showTimeWarning(minutesLeft) {
        if (window.showNotification) {
            window.showNotification(`⏰ Session ending in ${minutesLeft} minutes!`, 'warning');
        }
    }

    showSessionEndedNotification() {
        if (window.showNotification) {
            window.showNotification('🎲 Session time has ended!', 'info');
        }
    }

    showSessionDialog() {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: false 
        }).slice(0, 5); // Get HH:MM format
        const currentPeriod = now.getHours() >= 12 ? 'PM' : 'AM';
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content session-timer-modal">
                <div class="modal-header">
                    <h3><i class="material-icons">schedule</i> Session Timer</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="material-icons">close</i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="timer-form">
                        ${this.sessionEndTime ? `
                            <div class="current-session">
                                <h4>Active Session</h4>
                                <p><strong>Started:</strong> ${this.sessionStartTime ? this.sessionStartTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Unknown'}</p>
                                <p><strong>Ends:</strong> ${this.sessionEndTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                                <button class="btn btn-danger full-width" onclick="sessionTimer.endSession()">
                                    <i class="material-icons">stop</i> End Session
                                </button>
                            </div>
                        ` : `
                            <div class="new-session">
                                <h4>Set Session End Time</h4>
                                
                                <div class="time-input-group">
                                    <label>End Time:</label>
                                    <div class="time-controls">
                                        <input type="time" id="session-end-time" value="${currentTime}">
                                        <div class="ampm-toggle">
                                            <button type="button" class="ampm-btn ${currentPeriod === 'AM' ? 'active' : ''}" data-period="AM" onclick="sessionTimer.toggleAMPM('AM')">AM</button>
                                            <button type="button" class="ampm-btn ${currentPeriod === 'PM' ? 'active' : ''}" data-period="PM" onclick="sessionTimer.toggleAMPM('PM')">PM</button>
                                        </div>
                                    </div>
                                </div>

                                <div class="quick-add-section">
                                    <label>Quick Add:</label>
                                    <div class="quick-add-buttons">
                                        <button class="quick-btn" onclick="sessionTimer.addMinutes(15)">+15 min</button>
                                        <button class="quick-btn" onclick="sessionTimer.addMinutes(30)">+30 min</button>
                                        <button class="quick-btn" onclick="sessionTimer.addMinutes(45)">+45 min</button>
                                    </div>
                                </div>

                                <div class="warning-section">
                                    <label>Warning Alert:</label>
                                    <div class="warning-buttons">
                                        <button class="warning-btn ${this.warningMinutes === 15 ? 'active' : ''}" onclick="sessionTimer.setWarningMinutes(15)">15 min</button>
                                        <button class="warning-btn ${this.warningMinutes === 30 ? 'active' : ''}" onclick="sessionTimer.setWarningMinutes(30)">30 min</button>
                                        <button class="warning-btn ${this.warningMinutes === 45 ? 'active' : ''}" onclick="sessionTimer.setWarningMinutes(45)">45 min</button>
                                    </div>
                                </div>

                                <div class="session-actions">
                                    <button class="btn btn-primary full-width" onclick="sessionTimer.saveSession()">
                                        <i class="material-icons">play_arrow</i> Start Session
                                    </button>
                                </div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    toggleAMPM(period) {
        // Update button states
        document.querySelectorAll('.ampm-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
    }

    addMinutes(minutes) {
        const timeInput = document.getElementById('session-end-time');
        if (!timeInput) return;
        
        const currentTime = timeInput.value;
        if (!currentTime) return;
        
        // Parse current time
        const [hours, mins] = currentTime.split(':').map(Number);
        const currentDate = new Date();
        currentDate.setHours(hours, mins, 0, 0);
        
        // Add minutes
        currentDate.setMinutes(currentDate.getMinutes() + minutes);
        
        // Update input
        const newTime = currentDate.toTimeString().slice(0, 5);
        timeInput.value = newTime;
    }

    setWarningMinutes(minutes) {
        this.warningMinutes = minutes;
        
        // Update button states
        document.querySelectorAll('.warning-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.warning-btn[onclick="sessionTimer.setWarningMinutes(${minutes})"]`).classList.add('active');
    }

    saveSession() {
        const timeInput = document.getElementById('session-end-time');
        const activePeriod = document.querySelector('.ampm-btn.active')?.dataset.period || 'PM';
        
        if (!timeInput || !timeInput.value) {
            alert('Please set an end time');
            return;
        }

        const [hours, minutes] = timeInput.value.split(':').map(Number);
        let adjustedHours = hours;
        
        // Convert to 24-hour format
        if (activePeriod === 'PM' && hours !== 12) {
            adjustedHours = hours + 12;
        } else if (activePeriod === 'AM' && hours === 12) {
            adjustedHours = 0;
        }

        const now = new Date();
        const endTime = new Date();
        endTime.setHours(adjustedHours, minutes, 0, 0);
        
        // If end time is before current time, assume it's for tomorrow
        if (endTime <= now) {
            endTime.setDate(endTime.getDate() + 1);
        }

        this.sessionStartTime = new Date(now);
        this.sessionEndTime = endTime;
        this.warningShown = false;
        
        // Set default warning if none selected
        if (!this.warningMinutes) {
            this.warningMinutes = 30;
        }
        
        this.saveSessionData();
        
        // Close modal
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
        
        if (window.showNotification) {
            window.showNotification(`🎲 Session started! Will end at ${this.sessionEndTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`, 'success');
        }
    }

    endSession() {
        this.sessionStartTime = null;
        this.sessionEndTime = null;
        this.warningShown = false;
        this.warningMinutes = 30; // Reset to default
        this.saveSessionData();
        
        // Close modal
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
        
        if (window.showNotification) {
            window.showNotification('🎲 Session ended', 'info');
        }
    }

    saveSessionData() {
        const sessionData = {
            startTime: this.sessionStartTime ? this.sessionStartTime.toISOString() : null,
            endTime: this.sessionEndTime ? this.sessionEndTime.toISOString() : null,
            warningShown: this.warningShown,
            warningMinutes: this.warningMinutes
        };
        localStorage.setItem('dcc-session-timer', JSON.stringify(sessionData));
    }

    loadSessionData() {
        try {
            const saved = localStorage.getItem('dcc-session-timer');
            if (saved) {
                const sessionData = JSON.parse(saved);
                this.sessionStartTime = sessionData.startTime ? new Date(sessionData.startTime) : null;
                this.sessionEndTime = sessionData.endTime ? new Date(sessionData.endTime) : null;
                this.warningShown = sessionData.warningShown || false;
                this.warningMinutes = sessionData.warningMinutes || 30;
            }
        } catch (error) {
            console.warn('Failed to load session timer data:', error);
        }
    }

    destroy() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }
    }
}

// Initialize the session timer when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.sessionTimer = new SessionTimer();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionTimer;
}
