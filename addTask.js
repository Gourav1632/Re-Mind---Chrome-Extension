document.addEventListener("DOMContentLoaded", function() {
    const save = document.getElementById("save");
    const discard = document.getElementById("discard");

    discard.addEventListener("click",()=>{ // go back to home page on clicking discard
        window.location.href = "popup.html";
    })
    save.addEventListener("click", () => {
        // get reminder type
        const reminderType = document.querySelector(".type .selected").id;
        // get description of reminder
        const description = document.querySelector("input[name='description']").value;
        let details = {};
        // reminder type : notification
        if (reminderType === "notification") {
            const time = document.querySelector(".time-picker input[type='time']").value;
            const days = Array.from(document.querySelectorAll(".days li.selected-repeat")).map(li => li.textContent);
            details = {
                type: reminderType,
                time: time,
                repeatDays: days,
                description: description,
            }
        // reminder type : tab
        } else if (reminderType === "tab") {
            const time = document.querySelector(".time-picker input[type='time']").value;
            const days = Array.from(document.querySelectorAll(".days li.selected-repeat")).map(li => li.textContent);
            const redirectInput = document.querySelector("input[name='redirect']").value;
            details = {
                type: reminderType,
                time: time,
                repeatDays: days,
                description: description,
                redirectUrl: redirectInput,
            }
        // reminder type : task
        } else if (reminderType === "task") {
            details = {
                type: reminderType,
                description: description,
            }
        }
        // save to chrome storage
        chrome.runtime.sendMessage({ action: 'saveReminder', details: details }, function(response) {
            if (response.success) {
                console.log("Reminder saved successfully");
            }
        });
        // after save go to home page
        window.location.href = "popup.html";
    });

    // styling elements using javascript
    const typeElements = document.querySelectorAll(".type p");
    const dayElements = document.querySelectorAll(".days li");
    const detailsList = document.getElementById("details-list");
    const timePicker = document.querySelector(".time-picker");
    const repeatSection = document.querySelector(".repeat");

    typeElements.forEach(function(typeElement) {
        typeElement.addEventListener("click", function() {
            typeElements.forEach(function(el) {
                el.classList.remove("selected");
            });
            this.classList.add("selected");

            if (this.id === "tab") {
                addRedirectToInput();
            } else {
                removeRedirectToInput();
            }

            if (this.id === "task") {
                hideTimeAndDays();
            } else {
                showTimeAndDays();
            }
        });
    });

    dayElements.forEach(function(dayElement) {
        dayElement.addEventListener("click", function() {
            this.classList.toggle("selected-repeat");
        });
    });

    function addRedirectToInput() {
        if (!document.getElementById("redirect-to")) {
            const redirectToItem = document.createElement("li");
            redirectToItem.id = "redirect-to";
            redirectToItem.innerHTML = `
                <div class="description">
                    <label for="redirect"><h3>Redirect to</h3></label>
                    <input name="redirect" type="text">
                </div>
            `;
            detailsList.appendChild(redirectToItem);
        }
    }

    function removeRedirectToInput() {
        const redirectToItem = document.getElementById("redirect-to");
        if (redirectToItem) {
            detailsList.removeChild(redirectToItem);
        }
    }

    function hideTimeAndDays() {
        timePicker.style.display = "none";
        repeatSection.style.display = "none";
    }

    function showTimeAndDays() {
        timePicker.style.display = "flex";
        repeatSection.style.display = "block";
    }
});
