
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // listen to saveReminder action
    if (message.action === 'saveReminder') {
        const details = message.details;
        // reminder type : notification
        if (details.type === 'notification') {
            scheduleNotification(details.time, details.description, details.repeatDays);
        // reminder type : tab
        } else if (details.type === 'tab') {
            scheduleTabOpen(details.time, details.description, details.repeatDays);
        }
        
        // after scheduling reminder , save reminder to storage
        chrome.storage.sync.get('reminders', function(data) {
            let reminders = data.reminders || [];
            reminders.push(details);
            // update the reminder list
            chrome.storage.sync.set({reminders: reminders}, function() {
                chrome.runtime.sendMessage({ action: 'updateReminders' });
                sendResponse({ success: true });
            });
        });
        return true;
    // send reminders list to home page 
    } else if (message.action === 'getReminders') {
        chrome.storage.sync.get('reminders', function(data) {
            let reminders = data.reminders || [];
            sendResponse(reminders);
        });
        return true; // Indicates that sendResponse will be called asynchronously
    }
});

function scheduleNotification(time, description, repeatDays) {
    // get the scheduled time
    const [hours, minutes] = time.split(':');
    const scheduledTime = new Date();
    scheduledTime.setHours(parseInt(hours, 10));
    scheduledTime.setMinutes(parseInt(minutes, 10));
    scheduledTime.setSeconds(0);

    // get the current time
    const currentTime = new Date();

    let timeDiff = scheduledTime - currentTime;
    // check if time is in past, if yes then shift to next day
    if (timeDiff <= 0) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
        timeDiff = scheduledTime - currentTime;
    }

    // if no repeat alarm is set, simply create alarm
    if (repeatDays.length === 0) {
        chrome.alarms.create(description, { when: scheduledTime.getTime() });
        console.log("Alarm scheduled at : ", scheduledTime);
    // if repeat alarm is set, schedule alarm according to the day
    } else {
        repeatDays.forEach(day => {
            const dayIndex = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'].indexOf(day);
            if (dayIndex > -1) {
                // set alarm according to present and repeat day
                const dayDiff = (dayIndex - scheduledTime.getDay() + 7) % 7; 
                const notificationTime = new Date(scheduledTime.getTime());
                notificationTime.setDate(notificationTime.getDate() + dayDiff); 
                console.log("Alarm scheduled at : ", notificationTime, " for ",day);
                chrome.alarms.create(description + '_' + day, { when: notificationTime.getTime() });
            }
        });
    }
}

chrome.alarms.onAlarm.addListener(function(alarm) {
    // reminder type : tab
    if (alarm.name.endsWith('_tab')) {
        // get triggered alarm name
        const description = alarm.name;
        // get reminders list from chrome storage
        chrome.storage.sync.get('reminders', function(data) {
            let reminders = data.reminders || [];
            // find reminder whose description is equal to the triggered alarm name
            const reminder = reminders.find(reminder => description.includes(reminder.description));

            if (reminder) {
                // send a notification from browser
                chrome.notifications.create('reminder_notification', {
                    type: 'basic',
                    iconUrl: './assets/alert.png',
                    title: 'Reminder',
                    message: "Redirect to : " + reminder.redirectUrl, // Use the reminder description as the message
                    buttons: [
                        { title: 'Yes' },
                        { title: "No" }
                    ]
                });
                // add event listener to buttons of notification
                chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
                    if (notificationId === 'reminder_notification') {
                        if (buttonIndex === 0) { // option : yes
                            chrome.tabs.create({ url: reminder.redirectUrl });
                        } else if (buttonIndex === 1) { // option : no
                            chrome.notifications.clear('reminder_notification');
                        }
                    }
                });

                // for one time alarm
                if(reminder.repeatDays.length === 0){
                    // remove the reminder from reminders list and update list
                    reminders = reminders.filter(rem => rem.description !== reminder.description || rem.type !== reminder.type);
                    chrome.storage.sync.set({ reminders: reminders });
                    chrome.runtime.sendMessage({ action: 'updateReminders' });
                // for repeat alarm
                }else{
                    // store prev alarm details
                    const newReminder = reminder;
                    // remove the triggered alarm from reminders list 
                    reminders = reminders.filter(rem => rem.description !== reminder.description || rem.type !== reminder.type);
                    chrome.storage.sync.set({ reminders: reminders });
                    chrome.runtime.sendMessage({ action: 'updateReminders' });
                    // again schedule a alarm for next repeat day from stored details
                    scheduleTabOpen(newReminder.time,newReminder.description,newReminder.repeatDays);
                    chrome.storage.sync.get('reminders', function(data) {
                        let reminders = data.reminders || [];
                        reminders.push(newReminder);
                        chrome.storage.sync.set({reminders: reminders}, function() {
                            chrome.runtime.sendMessage({ action: 'updateReminders' });
                        });
                    });
                    
                }
            }
        });
    // reminder type : notification
    }else{
        // get triggered alarm name
        const description = alarm.name; 
        chrome.storage.sync.get('reminders', function(data) {
        let reminders = data.reminders || [];
        // find reminder whose description is equal to alarm name
        const reminder = reminders.find(reminder => description.includes(reminder.description));
            if (reminder) {
                // create notification for triggered alarm
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: './assets/alert.png',
                    title: 'Reminder',
                    message: reminder.description 
                });
                // for one time alarm
                if(reminder.repeatDays.length === 0){
                    // remove alarm from the list and update
                    reminders = reminders.filter(rem => rem.description !== reminder.description || rem.type !== reminder.type);
                    chrome.storage.sync.set({ reminders: reminders });
                    chrome.runtime.sendMessage({ action: 'updateReminders' });
                // for repeat alarm 
                }else{
                    // store prev alarm details
                    const newReminder = reminder;
                    // remove alarm from the list and update
                    reminders = reminders.filter(rem => rem.description !== reminder.description || rem.type !== reminder.type);
                    chrome.storage.sync.set({ reminders: reminders });
                    chrome.runtime.sendMessage({ action: 'updateReminders' });
                    // again schedule same alarm for next day
                    scheduleNotification(newReminder.time,newReminder.description,newReminder.repeatDays);
                    chrome.storage.sync.get('reminders', function(data) {
                        let reminders = data.reminders || [];
                        reminders.push(newReminder);
                        chrome.storage.sync.set({reminders: reminders}, function() {
                            chrome.runtime.sendMessage({ action: 'updateReminders' });
                        });
                    });
                    
                }
            }
        });
    }
});

function scheduleTabOpen(time, description, repeatDays) {
    // get scheduled time
    const [hours, minutes] = time.split(':');
    const scheduledTime = new Date();
    scheduledTime.setHours(parseInt(hours, 10));
    scheduledTime.setMinutes(parseInt(minutes, 10));
    scheduledTime.setSeconds(0);
    // get current time
    const currentTime = new Date();

    let timeDiff = scheduledTime - currentTime;
    // check if time is in past, if yes then add 1 day
    if (timeDiff <= 0) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
        timeDiff = scheduledTime - currentTime;
    }
    // for one time notification
    if (repeatDays.length === 0) {
        chrome.alarms.create(description + '_tab', { when: scheduledTime.getTime() });
    // for repeat notification
    } else {
        repeatDays.forEach(day => {
            const dayIndex = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'].indexOf(day);
            if (dayIndex > -1) {
                const dayDiff = (dayIndex - scheduledTime.getDay() + 7) % 7; 
                const alarmTime = new Date(scheduledTime.getTime());
                alarmTime.setDate(alarmTime.getDate() + dayDiff); 
                chrome.alarms.create(description + '_' + day+'_tab', { when: alarmTime.getTime() }, () => {
                    console.log(`Tab alarm created for ${description + '_' + day} at ${alarmTime}`);
                });
            }
        });
    }
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setPopup({ popup: 'popup.html' });
});
