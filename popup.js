document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'updateReminders') {
            updateRemindersList();
        }
    });

    function updateRemindersList() {
        chrome.runtime.sendMessage({ action: 'getReminders' }, function(reminders) {
            const remindersList = document.querySelector('.reminder-list');
            if (!remindersList) {
                console.error("Reminders list not found");
                return;
            }
            remindersList.innerHTML = ''; 

            reminders.forEach(reminder => {
                const reminderElement = document.createElement('div');
                reminderElement.classList.add('reminder-item');

                const type = reminder.type;
                const days = reminder.repeatDays;

                if (type === 'notification') {
                    reminderElement.classList.add("notification");
                    let daysList = '';
                    if (days.length !== 0) {
                        daysList = `
                            <ul class="notification-days">
                                <li class="${days.includes('S') ? 'notification-selected' : ''}">S</li>
                                <li class="${days.includes('M') ? 'notification-selected' : ''}">M</li>
                                <li class="${days.includes('T') ? 'notification-selected' : ''}">T</li>
                                <li class="${days.includes('W') ? 'notification-selected' : ''}">W</li>
                                <li class="${days.includes('Th') ? 'notification-selected' : ''}">Th</li>
                                <li class="${days.includes('F') ? 'notification-selected' : ''}">F</li>
                                <li class="${days.includes('Sa') ? 'notification-selected' : ''}">Sa</li>
                            </ul>`;
                    }
                    reminderElement.innerHTML = `
                    <h3>${reminder.time}</h3>
                    <p>${reminder.description}</p>
                    ${daysList}
                    <button class="remove-btn">-</button>`;
                } else if (type === 'tab') {
                    reminderElement.classList.add("tab");
                    let daysList = '';
                    if (days.length !== 0) {
                        daysList = `
                            <ul class="tab-days">
                                <li class="${days.includes('S') ? 'tab-selected' : ''}">S</li>
                                <li class="${days.includes('M') ? 'tab-selected' : ''}">M</li>
                                <li class="${days.includes('T') ? 'tab-selected' : ''}">T</li>
                                <li class="${days.includes('W') ? 'tab-selected' : ''}">W</li>
                                <li class="${days.includes('Th') ? 'tab-selected' : ''}">Th</li>
                                <li class="${days.includes('F') ? 'tab-selected' : ''}">F</li>
                                <li class="${days.includes('Sa') ? 'tab-selected' : ''}">Sa</li>
                            </ul>`;
                    }
                    reminderElement.innerHTML = `
                    <h3>${reminder.time}</h3>
                    <p>${reminder.description}</p>
                    <p style="color: #34343c">${reminder.redirectUrl}</p>
                    ${daysList}
                    <button class="remove-btn">-</button>`;
                } else if (type === 'task') {
                    reminderElement.classList.add("task");
                    reminderElement.innerHTML = `
                    <h3>Task</h3>
                    <p>${reminder.description}</p>
                    <button class="remove-btn">-</button>`;
                }

                const removeButton = reminderElement.querySelector('.remove-btn');
                if (removeButton) {
                    removeButton.addEventListener('click', function() {
                        removeReminder(reminder);
                        reminderElement.remove();
                    });
                }

                remindersList.appendChild(reminderElement);
            });
        });
    }

    function removeReminder(reminder) {
        if (reminder.type === 'notification') {
            chrome.alarms.clear(reminder.description);
        } else if (reminder.type === 'tab') {
            chrome.alarms.clear(reminder.description + '_tab');
        }

        chrome.storage.sync.get('reminders', function(data) {
            let reminders = data.reminders || [];
            reminders = reminders.filter(r => r.description !== reminder.description);
            chrome.storage.sync.set({ reminders: reminders });
            chrome.runtime.sendMessage({ action: 'updateReminders' });
        });
    }

    updateRemindersList();
});
