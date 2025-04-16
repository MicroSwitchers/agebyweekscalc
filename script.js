// Array of month names for display and parsing
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * @function debounce
 * @description Limits the rate at which a function can fire.
 * Useful for input events to prevent excessive calculations or updates.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * @function handleYearInput
 * @description Handles keydown event for the year input field.
 * Validates input on Enter/Tab and moves focus.
 * @param {Event} event - The keydown event object.
 */
function handleYearInput(event) {
    // On Enter or Tab, prevent default behavior, validate the year, and move focus
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        validateYearInput(); // Final validation and formatting
        // Check if input is now valid before moving focus
        if (document.getElementById('yearInput').value) {
             if (event.key === 'Tab' || event.key === 'Enter') {
                 document.getElementById('monthInput').focus();
            }
        }
        return; // Stop further processing for Enter/Tab
    }
    // For other key presses, trigger a debounced update (via input listener)
}

/**
 * @function validateYearInput
 * @description Validates and formats the year input value on blur or Enter/Tab.
 * Converts 2-digit years to 4-digit years (assuming 20xx or 19xx).
 * Ensures the year is within a reasonable range (current year - 150 to current year).
 * Updates day options and recalculates age if valid.
 */
function validateYearInput() {
    let input = document.getElementById('yearInput');
    let originalValue = input.value; // Store original value for comparison
    let year = parseInt(input.value, 10);
    let currentYear = new Date().getFullYear();
    let valueChanged = false;

    // Handle 2-digit year input (e.g., '23' -> 2023, '99' -> 1999)
    if (input.value.length === 2 && !isNaN(year)) { // Check length and if it's a number
        let potentialYear = 2000 + year;
        // Simple rule: if 20xx is more than 1 year in future, assume 19xx
        if (potentialYear > currentYear + 1) {
            year = 1900 + year; // Assume 19xx
        } else {
            year = potentialYear; // Assume 20xx
        }
    }

    // Validate the calculated year (Allow years up to the current year)
    if (isNaN(year) || year < currentYear - 150 || year > currentYear) {
        if (input.value !== '') {
            input.value = ''; // Clear invalid input
            valueChanged = true;
        }
    } else {
        // Set the formatted 4-digit year back to the input
        const formattedYear = year.toString();
        if (input.value !== formattedYear) {
            input.value = formattedYear;
            valueChanged = true;
        }
    }

    // Always update day options after year validation attempt
    updateDayOptions();
    // Trigger calculation only if value changed or was cleared
    if (valueChanged) {
         checkAndCalculate();
    }
}

/**
 * @function handleMonthInput
 * @description Handles keydown events for the month input field.
 * Confirms input on Enter/Tab and moves focus. Suggestion updates are handled by the 'input' event.
 * @param {Event} event - The keydown event object.
 */
function handleMonthInput(event) {
    let input = document.getElementById('monthInput');

    // Handle Enter/Tab: Confirm the current best suggestion or entered value
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
         // Confirm input *before* changing focus
        confirmMonthInput();
        // Check if input is now valid before moving focus
        if (input.value) {
             if (event.key === 'Tab' || event.key === 'Enter') {
                document.getElementById('dayInput').focus();
            }
        }
        return; // Stop further processing
    }
     // Backspace/Delete is handled by the 'input' event triggering updates
}

/**
 * @function confirmMonthInput
 * @description Validates and formats the month input when the user leaves the field (blur) or presses Enter/Tab,
 * or selects a datalist option (detected via input event). It takes the best matching suggestion from the datalist if available,
 * otherwise attempts to parse the input.
 * **AI/Developer Note:** This function is triggered by `blur`, `Enter/Tab` keydown, and the `input` event
 * when a datalist suggestion is selected.
 */
function confirmMonthInput() {
    let input = document.getElementById('monthInput');
    let datalist = document.getElementById('months');
    let currentInput = input.value.trim(); // Trim whitespace, keep case for comparison
    let currentInputLower = currentInput.toLowerCase();
    let bestMatch = null;
    let valueChanged = false; // Flag to track if we modify the value

    // If the input is empty, clear and exit
    if (!currentInput) {
        if (input.value !== '') valueChanged = true;
        input.value = '';
        if(valueChanged) { updateDayOptions(); checkAndCalculate(); }
        return;
    }

    // *** CHECK ***: Check if input already matches the final format "MMM - (NN)"
    const finalFormatRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) - \(\d{2}\)$/i;
    if (finalFormatRegex.test(currentInput)) {
        // Value is already good, but still update dependencies in case year changed etc.
        updateDayOptions(); // Ensure day options are correct for this month/year
        checkAndCalculate();
        return; // Don't proceed with other matching/clearing logic
    }

    // Check if the current input exactly matches any option value (case-insensitive)
    // This prioritizes confirming a selection the user clicked from the list
    for (let option of datalist.options) {
        if (option.value.localeCompare(currentInput, undefined, { sensitivity: 'base' }) === 0) {
            bestMatch = option.value; // Use the option's casing
            break;
        }
    }

    // If no exact match from datalist, check if the *current input text* can be parsed
    if (!bestMatch) {
        // Attempt to parse numeric month first (allow '1', '01', '10' etc.)
        let monthNumber = parseInt(currentInputLower, 10);
        if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
             // Check if the input *only* contains digits (and maybe whitespace)
             if (/^\d+\s*$/.test(currentInput)) {
                bestMatch = `${monthNames[monthNumber - 1]} - (${monthNumber.toString().padStart(2, '0')})`;
             }
        }

        // If numeric parse didn't yield a match, try text parse (e.g., "ja", "sep")
        if (!bestMatch) {
            let matchedMonth = monthNames.find(name => name.toLowerCase().startsWith(currentInputLower));
            if (matchedMonth) {
                let monthIndex = monthNames.indexOf(matchedMonth);
                bestMatch = `${matchedMonth} - (${(monthIndex + 1).toString().padStart(2, '0')})`;
            }
        }
    }

    // If a best match was found (either from datalist or parsing), use it
    if (bestMatch) {
        if (input.value !== bestMatch) {
             input.value = bestMatch;
             valueChanged = true;
        }
    } else {
        // Clear if completely invalid after all checks
        if (input.value !== '') {
            input.value = '';
            valueChanged = true;
        }
    }

    // After confirming, update day options and recalculate
    updateDayOptions(); // Always update day options after month confirm
    checkAndCalculate(); // Always recalculate after month confirm
}


/**
 * @function updateMonthOptions
 * @description Populates the month datalist (#months) with suggestions based on user input.
 * Handles specific numeric inputs ('0', '1') and text input.
 *
 * **AI/Developer Note:** This function provides predictive suggestions:
 * 1.  **Numeric Start:**
 * - If input is '0': Suggests Jan (01) through Sep (09).
 * - If input is '1': Suggests Jan (01), Oct (10), Nov (11), Dec (12).
 * - If input is '2'-'9': Suggests the single corresponding month (e.g., '2' -> Feb (02)).
 * - If input is '10', '11', '12': Suggests the single corresponding month.
 * - If input is '01'-'09': Suggests the single corresponding month.
 * - *Numeric suggestions are shown ONLY if the input contains ONLY digits.*
 * 2.  **Text Start:** If the input contains letters, it suggests months starting
 * with the typed text (case-insensitive, e.g., 'ap' -> Apr (04)).
 *
 * @param {string} value - The current value entered in the month input field.
 */
function updateMonthOptions(value) {
    let datalist = document.getElementById('months');
    datalist.innerHTML = ''; // Clear previous suggestions
    if (!value) return; // No input, no suggestions

    value = value.trim(); // Trim whitespace
    let valueLower = value.toLowerCase();

    // Determine if input looks numeric (only digits) or textual (contains letters)
    const isPurelyNumeric = /^\d+$/.test(value);
    const containsLetters = /[a-z]/i.test(value);

    // --- Numeric Suggestion Logic ---
    if (isPurelyNumeric && !containsLetters) {
        // Handle '0' specifically -> suggest 01-09
        if (value === '0') {
            monthNames.slice(0, 9).forEach((month, index) => { // Jan to Sep
                addMonthOption(datalist, `${month} - (${(index + 1).toString().padStart(2, '0')})`);
            });
            return; // Only show these for '0'
        }
        // Handle '1' specifically -> suggest 01, 10, 11, 12
        if (value === '1') {
            [0, 9, 10, 11].forEach(index => { // Jan, Oct, Nov, Dec
                 addMonthOption(datalist, `${monthNames[index]} - (${(index + 1).toString().padStart(2, '0')})`);
            });
            return; // Only show these for '1'
        }

        // Handle other potential numbers ('2'...'9', '10','11','12', '01'...'09')
        let potentialMonthNum = parseInt(value, 10);
        if (!isNaN(potentialMonthNum) && potentialMonthNum >= 1 && potentialMonthNum <= 12) {
             let monthIndex = potentialMonthNum - 1;
             // If the input *is* a valid complete month number (e.g. '2', '10', '02')
             // show only that single suggestion for clarity.
             addMonthOption(datalist, `${monthNames[monthIndex]} - (${(monthIndex + 1).toString().padStart(2, '0')})`);
             return;
        }
        // If purely numeric but invalid (e.g., '13'), show no suggestions
        return;
    }

    // --- Text Suggestion Logic ---
    // Run if input contains letters OR if it wasn't handled by numeric logic
    if (containsLetters || !isPurelyNumeric) {
        let matchingMonths = monthNames.filter(month =>
            month.toLowerCase().startsWith(valueLower)
        );
        matchingMonths.forEach(month => {
            let monthIndex = monthNames.indexOf(month);
            let monthValue = `${month} - (${(monthIndex + 1).toString().padStart(2, '0')})`;
            addMonthOption(datalist, monthValue);
        });
    }
}


/**
 * @function addMonthOption
 * @description Helper function to create and add an <option> element to a datalist.
 * @param {HTMLDataListElement} datalist - The datalist element to add the option to.
 * @param {string} value - The value for the option.
 */
function addMonthOption(datalist, value) {
    let option = document.createElement('option');
    option.value = value;
    datalist.appendChild(option);
}

/**
 * @function updateDayOptions
 * @description Populates the day datalist (#days) with valid day numbers for the selected month and year.
 * Also updates the placeholder text to indicate the valid range.
 * **AI/Developer Note:** This function is called when Year or Month is confirmed.
 * It populates the datalist for the browser's prediction mechanism.
 */
function updateDayOptions() {
    updateDayDatalist('yearInput', 'monthInput', 'days');
}

/**
 * @function getDaysInMonth
 * @description Returns the number of days in a given month and year.
 * @param {number} year - The year.
 * @param {number} month - The month (1-based, 1=Jan, 12=Dec).
 * @returns {number} - The number of days in the month.
 */
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

/**
 * @function updateDayDatalist
 * @description Updates the day datalist with valid day numbers for the given year and month inputs.
 * @param {string} yearInputId - The ID of the year input element.
 * @param {string} monthInputId - The ID of the month input element.
 * @param {string} dayDatalistId - The ID of the day datalist element.
 */
function updateDayDatalist(yearInputId, monthInputId, dayDatalistId) {
    const year = parseInt(document.getElementById(yearInputId).value, 10);
    const monthVal = document.getElementById(monthInputId).value;
    let month = parseInt(monthVal, 10);

    // Try to parse month if user entered a name (e.g. "Feb")
    if (isNaN(month)) {
        const idx = monthNames.findIndex(
            m => m.toLowerCase() === monthVal.trim().toLowerCase().slice(0, 3)
        );
        if (idx !== -1) month = idx + 1;
    }

    const datalist = document.getElementById(dayDatalistId);
    datalist.innerHTML = '';
    if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
        const days = getDaysInMonth(year, month);
        for (let d = 1; d <= days; d++) {
            const option = document.createElement('option');
            option.value = d.toString().padStart(2, '0');
            datalist.appendChild(option);
        }
    }
}

// Example for the main input fields
document.addEventListener('DOMContentLoaded', function () {
    const yearInput = document.getElementById('yearInput');
    const monthInput = document.getElementById('monthInput');
    const dayDatalistId = 'days';

    if (yearInput && monthInput) {
        yearInput.addEventListener('input', () => updateDayDatalist('yearInput', 'monthInput', dayDatalistId));
        monthInput.addEventListener('input', () => updateDayDatalist('yearInput', 'monthInput', dayDatalistId));
    }

    // Prevent invalid days, but allow empty input
    const dayInput = document.getElementById('dayInput');
    if (dayInput) {
        dayInput.addEventListener('input', function (e) {
            let val = e.target.value.replace(/\D/g, '');
            if (val === '') {
                e.target.value = '';
                return;
            }
            if (parseInt(val, 10) < 1) val = '1';
            if (parseInt(val, 10) > 31) val = '31';
            e.target.value = val;
        });
    }
});

/**
 * @function handleDayInput
 * @description Handles keydown events for the day input field.
 * Confirms input on Enter/Tab.
 * @param {Event} event - The keydown event object.
 */
function handleDayInput(event) {
    let input = document.getElementById('dayInput');

    // Handle Enter/Tab
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        confirmDayInput();
        // Check if input is now valid before moving focus/blurring
        if (input.value) {
            if (event.key === 'Enter') {
                input.blur();
            }
            // For Tab, focus moves automatically
        } else {
             // If input became invalid/empty after confirm, still move focus on Tab
             if (event.key === 'Tab') {
                 // Let default tab behavior happen after prevention/confirmation
             }
        }
        return;
    }
}


/**
 * @function confirmDayInput
 * @description Validates and formats the day input ONLY when the user presses Enter/Tab.
 * Ensures the day is numeric, within the valid range for the selected month/year,
 * and formats it with a leading zero if needed. Clears the input if invalid.
 * **AI/Developer Note:** This function is triggered ONLY by `Enter/Tab` keydown on the day input.
 * Confirmation on BLUR is DISABLED to prevent perceived "auto-confirming".
 */
function confirmDayInput() {
    let input = document.getElementById('dayInput');
    let originalValue = input.value;
    let day = parseInt(input.value, 10);
    let valueChanged = false;

    // If the input is empty or non-numeric, ensure it's cleared and exit
    if (isNaN(day)) {
        if (input.value !== '') { input.value = ''; valueChanged = true; }
        // Only calculate if the value was actually cleared (changed)
        if (valueChanged) checkAndCalculate();
        return;
    }

    // Get the max valid day for the current month/year
    let yearInput = document.getElementById('yearInput').value;
    let monthInput = document.getElementById('monthInput').value;
    let year = parseInt(yearInput, 10);
    let monthMatch = monthInput.match(/\((\d{2})\)/);

    // Check if Year and Month inputs are valid before proceeding
    if (isNaN(year) || !monthMatch) {
         // If year/month isn't valid, we can't validate day. Clear if needed.
         if (input.value !== '') { input.value = ''; valueChanged = true; }
         if (valueChanged) checkAndCalculate();
         return;
    }

    let month = parseInt(monthMatch[1], 10);
    let maxDay = 31; // Default fallback
    try { maxDay = new Date(year, month, 0).getDate(); }
    catch (e) {
        console.error("Error getting days for validation:", e);
        if (input.value !== '') { input.value = ''; valueChanged = true; }
        if (valueChanged) checkAndCalculate();
        return;
    }

    // Validate and format
    if (day >= 1 && day <= maxDay) {
        // Valid day, format with leading zero
        let formattedDay = day.toString().padStart(2, '0');
        if (input.value !== formattedDay) { input.value = formattedDay; valueChanged = true; }
    } else {
        // Invalid day for the month, clear the input
        if (input.value !== '') { input.value = ''; valueChanged = true; }
    }

    // Recalculate after confirming/validating, only if value changed
    if (valueChanged) {
        checkAndCalculate();
    }
}


/**
 * @function checkAndCalculate
 * @description Checks which tab is active and triggers the appropriate calculation function.
 * Clears results if inputs are incomplete or invalid.
 * **AI/Developer Note:** Prevents calculation if day input length is less than 2.
 */
function checkAndCalculate() {
    let activeTabElement = document.querySelector('.tab-button.active');
    if (!activeTabElement) return;
    let activeTab = activeTabElement.dataset.tab;

    if (activeTab === 'manual') {
        let yearStr = document.getElementById('yearInput').value;
        let monthInputVal = document.getElementById('monthInput').value;
        let dayStr = document.getElementById('dayInput').value;

        // AI/Dev Note: Prevent calculation if day is incomplete (e.g., user typed '1' and paused)
        // Also check year and month are filled before checking day length.
        if (yearStr && monthInputVal && dayStr && dayStr.length < 2) {
             // Do not calculate, do not clear results, just wait for confirmation.
             return;
        }

        // Ensure all manual fields are filled and look potentially valid before parsing
        if (yearStr && monthInputVal && dayStr) {
            let monthMatch = monthInputVal.match(/\((\d{2})\)/);
            let yearNum = parseInt(yearStr, 10);
            let dayNum = parseInt(dayStr, 10);

            // Proceed only if parsing looks okay and day has 2 digits (or was confirmed valid)
            if (monthMatch && !isNaN(yearNum) && !isNaN(dayNum) && dayStr.length === 2) {
                let monthNumber = parseInt(monthMatch[1], 10);
                 try {
                    const checkTimestamp = Date.UTC(yearNum, monthNumber - 1, dayNum);
                    if (isNaN(checkTimestamp)) { clearResult(); return; }
                    const checkDate = new Date(checkTimestamp);

                    // Final validation using UTC methods
                    if (checkDate.getUTCFullYear() === yearNum &&
                        checkDate.getUTCMonth() === monthNumber - 1 &&
                        checkDate.getUTCDate() === dayNum)
                    {
                        calculateAdvancedAge(new Date(checkTimestamp));
                    } else { clearResult(); }
                 } catch (e) { console.error("Error in final date check:", e); clearResult(); }
            } else { clearResult(); } // Clear if parsing failed or day incomplete
        } else { clearResult(); } // Clear if not all fields are filled
    }
    // REMOVED Date Picker Logic
    else if (activeTab === 'time-between') {
        calculateTimeBetween();
    }
}

// Create debounced update function for age calculation tabs
const debouncedUpdate = debounce(() => {
    let activeTabElement = document.querySelector('.tab-button.active');
    if (!activeTabElement) return;
    let activeTab = activeTabElement.dataset.tab;
    // Only run calculation for the manual tab now
    if (activeTab === 'manual') {
         checkAndCalculate();
    }
}, 300);

// Create debounced update function for time between calculations
const debouncedTimeBetweenUpdate = debounce(() => {
     let activeTabElement = document.querySelector('.tab-button.active');
     if (!activeTabElement) return;
     let activeTab = activeTabElement.dataset.tab;
     if (activeTab === 'time-between') {
         calculateTimeBetween();
     }
}, 300);


/**
 * @function setLoadingState
 * @description Visually indicates loading/processing by dimming inputs.
 * Removed 'datePicker' from the list of inputs.
 * @param {boolean} isLoading - Whether to show the loading state.
 */
function setLoadingState(isLoading) {
    const inputs = ['yearInput', 'monthInput', 'dayInput', /*'datePicker',*/ 'startYearInput', 'startMonthInput', 'startDayInput', 'endYearInput', 'endMonthInput', 'endDayInput'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.opacity = isLoading ? '0.7' : '1';
            element.disabled = isLoading;
        }
    });
    const resultsContainer = document.querySelector('.results-container');
     if (resultsContainer) {
         resultsContainer.style.opacity = isLoading ? '0.7' : '1';
     }
}

/**
 * @function calculateAdvancedAge
 * @description Calculates age in years, months, and total months based on a birthday.
 * Updates the UI with the results, age category, and JK eligibility.
 * Includes a pseudo-loading state for better UX.
 * @param {Date} birthday - The date of birth. Assumed to be a valid Date object.
 */
function calculateAdvancedAge(birthday) {
    setLoadingState(true);

    setTimeout(() => {
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!birthday || isNaN(birthday.getTime()) || birthday > today) {
            clearResult();
            setLoadingState(false);
            return;
        }

        var ageMonthsTotal = calculateAgeInMonths(birthday, today);
        var ageYears = Math.floor(ageMonthsTotal / 12);
        var remainingMonths = ageMonthsTotal % 12;

        document.getElementById('result').innerHTML =
            `<strong>${ageYears} year${ageYears !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}</strong>`;
        document.getElementById('result-weeks').textContent =
            `(${ageMonthsTotal} Month${ageMonthsTotal !== 1 ? 's' : ''} total)`;
        determineCategory(ageMonthsTotal);
        calculateJKEligibility(birthday);
        setLoadingState(false);
    }, 10);
}

/**
 * @function calculateAgeInMonths
 * @description Helper function to calculate the total number of full months between two dates.
 * @param {Date} startDate - The earlier date (birthday).
 * @param {Date} endDate - The later date (today).
 * @returns {number} - The total number of full months elapsed.
 */
function calculateAgeInMonths(startDate, endDate) {
     if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) {
        return 0;
    }

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    let totalMonths = years * 12 + months;

    if (days < 0) {
        totalMonths--;
    }

    return Math.max(0, totalMonths);
}

/**
 * @function determineCategory
 * @description Determines the age category based on the total number of months.
 * Updates the category display in the UI.
 * @param {number} months - Total age in months.
 */
function determineCategory(months) {
    let category;
    if (months <= 17) category = 'Infant';
    else if (months <= 30) category = 'Toddler';
    else if (months <= 43) category = 'Preschool';
    else if (months <= 55) category = 'JK';
    else if (months <= 71) category = 'SK';
    else category = 'Aged Out (6+)';
    document.getElementById('category').innerText = `${category}`;
}

/**
 * @function calculateJKEligibility
 * @description Calculates the year a child is eligible to start JK in Ontario
 * (September of the year they turn 4). Updates the UI.
 * @param {Date} birthday - The date of birth.
 */
function calculateJKEligibility(birthday) {
     if (!birthday || isNaN(birthday.getTime())) {
         document.getElementById('jk-eligibility').innerText = '--';
         return;
     }

    let birthYear = birthday.getFullYear();
    let currentYear = new Date().getFullYear();
    let eligibilityYear = birthYear + 4;
    let jkEligibilityElement = document.getElementById('jk-eligibility');

    let eligibilityText = `Eligible Sept ${eligibilityYear}`;

    if (currentYear === eligibilityYear) {
        eligibilityText += `<br><span class="jk-note">(Eligible this calendar year)</span>`;
    } else if (currentYear + 1 === eligibilityYear) {
        eligibilityText += `<br><span class="jk-note">(Eligible next calendar year)</span>`;
        document.getElementById('jk-eligibility').innerHTML = '<span class="small-tag">(Eligible next calendar year)</span>';
    } else if (currentYear > eligibilityYear) {
         eligibilityText += `<br><span class="jk-note">(Eligibility year has passed)</span>`;
    }

    jkEligibilityElement.innerHTML = eligibilityText;
}

/**
 * @function clearResult
 * @description Clears all calculated results from the UI, resetting to default state.
 */
function clearResult() {
    document.getElementById('result').innerText = '--';
    document.getElementById('result-weeks').innerText = '';
    document.getElementById('category').innerText = '--';
    document.getElementById('jk-eligibility').innerText = '--';
}

/**
 * @function clearAll
 * @description Clears all input fields (for the active tab) and results.
 * Focuses the first input field of the active tab.
 */
function clearAll() {
    let activeTabElement = document.querySelector('.tab-button.active');
    if (!activeTabElement) return;
    let activeTab = activeTabElement.dataset.tab;


    if (activeTab === 'manual') {
        document.getElementById('yearInput').value = '';
        document.getElementById('monthInput').value = '';
        document.getElementById('dayInput').value = '';
        updateDayOptions(); // Clear day options and reset placeholder
        document.getElementById('months').innerHTML = ''; // Clear month suggestions
        document.getElementById('days').innerHTML = ''; // Clear day suggestions
        document.getElementById('yearInput').focus();
    }
    // REMOVED Date Picker Logic
    else if (activeTab === 'time-between') {
        document.getElementById('startYearInput').value = '';
        document.getElementById('startMonthInput').value = '';
        document.getElementById('startDayInput').value = '';
        document.getElementById('endYearInput').value = '';
        document.getElementById('endMonthInput').value = '';
        document.getElementById('endDayInput').value = '';
        // Clear options and placeholders for start date
        updateStartDayOptions();
        document.getElementById('startMonths').innerHTML = '';
        document.getElementById('startDays').innerHTML = '';
        document.getElementById('startDayInput').setAttribute('placeholder', 'DD');
         // Clear options and placeholders for end date
        updateEndDayOptions();
        document.getElementById('endMonths').innerHTML = '';
        document.getElementById('endDays').innerHTML = '';
        document.getElementById('endDayInput').setAttribute('placeholder', 'DD');
        document.getElementById('startYearInput').focus();
    }

    clearResult(); // Clear the results display area
}


// REMOVED handleDatePickerChange function


/**
 * @function switchTab
 * @description Handles switching between the input tabs (Manual, Time Between).
 * Updates active classes, clears results, focuses the appropriate input, and adjusts UI elements.
 * @param {string} tab - The identifier of the tab to switch to ('manual', 'time-between').
 */
function switchTab(tab) {
    // Update button active states
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tab);
    });
    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-tab`);
    });

    clearResult(); // Clear results when switching tabs

    // Adjust UI elements based on the new active tab
    const resultLabel = document.querySelector('.result-label');
    const categoryContainer = document.querySelector('.category'); // Direct div
    const jkContainer = document.querySelector('.jk-eligibility'); // Direct div
    const resultWeeksDiv = document.querySelector('.result-weeks'); // The total months display

    // Ensure elements exist before manipulating style/focus
    if (!resultLabel || !categoryContainer || !jkContainer || !resultWeeksDiv) {
        console.error("One or more UI elements for tab switching not found.");
    } else {
        if (tab === 'time-between') {
            resultLabel.textContent = 'Time Between';
            categoryContainer.style.display = 'none'; // Hide category section
            jkContainer.style.display = 'none';       // Hide JK section
            resultWeeksDiv.style.display = 'block'; // Show total months for time between
        } else { // 'manual' tab
            resultLabel.textContent = 'Age';
            categoryContainer.style.display = 'block'; // Show category section
            jkContainer.style.display = 'block';       // Show JK section
            resultWeeksDiv.style.display = 'block'; // Show total months for age
        }
    }

    // Set focus
    try {
        if (tab === 'time-between') {
             document.getElementById('startYearInput').focus();
        } else if (tab === 'manual') {
             document.getElementById('yearInput').focus();
        }
        // REMOVED Date Picker Focus Logic
    } catch (e) { console.error("Error setting focus:", e); }
}


/**
 * @function toggleInfoDrawer
 * @description Toggles the visibility of the information drawer section.
 */
function toggleInfoDrawer() {
    const drawerContent = document.querySelector('.info-drawer-content');
    const toggleButton = document.querySelector('.info-drawer-toggle');
    if (!drawerContent || !toggleButton) {
        console.error("Could not find info drawer elements."); // Add error log
        return; // Exit if elements not found
    }

    drawerContent.classList.toggle('active');
    const isActive = drawerContent.classList.contains('active');
    toggleButton.setAttribute('aria-expanded', isActive);

    // Change button text/icon based on state
    toggleButton.innerHTML = isActive ? 'ℹ️ Hide Information' : 'ℹ️ More Information';
}

// Info drawer toggle logic
document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.querySelector('.info-drawer-toggle');
    const drawerContent = document.getElementById('info-drawer-content');

    if (toggleBtn && drawerContent) {
        toggleBtn.addEventListener('click', function () {
            const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', !expanded);
            drawerContent.style.display = expanded ? 'none' : 'block';
        });

        // Start with drawer closed
        toggleBtn.setAttribute('aria-expanded', 'false');
        drawerContent.style.display = 'none';
    }
});

// Ensure year input validation (optional)
const yearInput = document.getElementById('yearInput');
if (yearInput) {
    yearInput.addEventListener('input', function () {
        // Only allow up to 4 digits
        yearInput.value = yearInput.value.replace(/\D/g, '').slice(0, 4);
    });

    // If spinner is used and box is empty, set to current year
    yearInput.addEventListener('wheel', function () {
        if (yearInput.value === '') {
            yearInput.value = new Date().getFullYear();
            // Optionally trigger validation or calculation
            validateYearInput();
        }
    });

    yearInput.addEventListener('keydown', function (e) {
        // Arrow up/down keys also trigger spinner
        if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && yearInput.value === '') {
            yearInput.value = new Date().getFullYear();
            validateYearInput();
        }
    });
}

// ========================================================
// == Time Between Tab Specific Functions =================
// ========================================================

// --- Input Handlers (similar logic as manual tab, different IDs) ---

function handleStartYearInput(event) {
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        validateStartYearInput();
        if (document.getElementById('startYearInput').value) {
             if (event.key === 'Tab' || event.key === 'Enter') {
                 document.getElementById('startMonthInput').focus();
            }
        }
        return;
    }
    // Debounced update triggered by input listener
}

function handleStartMonthInput(event) {
    let input = document.getElementById('startMonthInput');
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        confirmStartMonthInput();
        if (input.value) {
             if (event.key === 'Tab' || event.key === 'Enter') {
                document.getElementById('startDayInput').focus();
            }
        }
        return;
    }
}

function handleStartDayInput(event) {
    let input = document.getElementById('startDayInput');
     if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        confirmStartDayInput(); // Confirm value on Enter/Tab
        if (input.value) {
             if (event.key === 'Tab' || event.key === 'Enter') {
                 document.getElementById('endYearInput').focus();
            }
        } else if (event.key === 'Enter' || event.key === 'Tab') {
             document.getElementById('endYearInput').focus();
        }
        return;
    }
}

function handleEndYearInput(event) {
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        validateEndYearInput();
        if (document.getElementById('endYearInput').value) {
             if (event.key === 'Tab' || event.key === 'Enter') {
                document.getElementById('endMonthInput').focus();
            }
        }
        return;
    }
     // Debounced update triggered by input listener
}

function handleEndMonthInput(event) {
     let input = document.getElementById('endMonthInput');
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        confirmEndMonthInput();
        if (input.value) {
            if (event.key === 'Tab' || event.key === 'Enter') {
                document.getElementById('endDayInput').focus();
            }
        }
        return;
    }
}

function handleEndDayInput(event) {
    let input = document.getElementById('endDayInput');
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        confirmEndDayInput(); // Confirm value on Enter/Tab
        if (input.value) {
            if (event.key === 'Enter') {
                input.blur();
            }
        }
        return;
    }
}

// --- Validation Functions (similar logic as manual tab, different IDs) ---

function validateStartYearInput() {
    let input = document.getElementById('startYearInput');
    let originalValue = input.value;
    let year = parseInt(input.value, 10);
    let currentYear = new Date().getFullYear();
    let valueChanged = false;

    if (input.value.length === 2 && !isNaN(year)) {
         let potentialYear = 2000 + year;
        if (potentialYear > currentYear + 50) { // Allow future years, adjust century
             year = 1900 + year;
        } else {
             year = potentialYear;
        }
    }

    // Allow a wider range, including future years, but keep it reasonable
    if (isNaN(year) || year < 1900 || year > currentYear + 100) {
         if(input.value !== '') { input.value = ''; valueChanged = true; }
    } else {
        const formattedYear = year.toString();
        if(input.value !== formattedYear) { input.value = formattedYear; valueChanged = true; }
    }
    // Always update day options after validation
    updateStartDayOptions();
    if (valueChanged) {
        calculateTimeBetween();
    }
}

function validateEndYearInput() {
    let input = document.getElementById('endYearInput');
    let originalValue = input.value;
    let year = parseInt(input.value, 10);
    let currentYear = new Date().getFullYear();
    let valueChanged = false;

     if (input.value.length === 2 && !isNaN(year)) {
        let potentialYear = 2000 + year;
         if (potentialYear > currentYear + 50) { // Allow future years
             year = 1900 + year;
        } else {
            year = potentialYear;
        }
    }

     // Allow a wider range, including future years
    if (isNaN(year) || year < 1900 || year > currentYear + 100) {
          if(input.value !== '') { input.value = ''; valueChanged = true; }
    } else {
        const formattedYear = year.toString();
        if(input.value !== formattedYear) { input.value = formattedYear; valueChanged = true; }
    }
     // Always update day options after validation
     updateEndDayOptions();
     if (valueChanged) {
        calculateTimeBetween();
    }
}

// --- Month/Day Option Updates (specific for start/end) ---

/**
 * @function updateStartMonthOptions
 * @description Populates the start month datalist with suggestions based on user input.
 * Handles specific numeric inputs ('0', '1') and text input.
 * (Mirrors updateMonthOptions logic)
 * @param {string} value - The current value entered in the start month input field.
 */
function updateStartMonthOptions(value) {
    let datalist = document.getElementById('startMonths');
    datalist.innerHTML = '';
    if (!value) return;
    value = value.trim();
    let valueLower = value.toLowerCase();
    const isPurelyNumeric = /^\d+$/.test(value);
    const containsLetters = /[a-z]/i.test(value);

    if (isPurelyNumeric && !containsLetters) {
        if (value === '0') {
            monthNames.slice(0, 9).forEach((month, index) => {
                addMonthOption(datalist, `${month} - (${(index + 1).toString().padStart(2, '0')})`);
            });
            return;
        }
        if (value === '1') {
            [0, 9, 10, 11].forEach(index => {
                 addMonthOption(datalist, `${monthNames[index]} - (${(index + 1).toString().padStart(2, '0')})`);
            });
            return;
        }
        let potentialMonthNum = parseInt(value, 10);
        if (!isNaN(potentialMonthNum) && potentialMonthNum >= 1 && potentialMonthNum <= 12) {
             let monthIndex = potentialMonthNum - 1;
             addMonthOption(datalist, `${monthNames[monthIndex]} - (${(monthIndex + 1).toString().padStart(2, '0')})`);
             return;
        }
        return;
    }

    if (containsLetters || !isPurelyNumeric) {
        let matchingMonths = monthNames.filter(month => month.toLowerCase().startsWith(valueLower));
        matchingMonths.forEach(month => {
            let monthIndex = monthNames.indexOf(month);
            let monthValue = `${month} - (${(monthIndex + 1).toString().padStart(2, '0')})`;
            addMonthOption(datalist, monthValue);
        });
    }
}

/**
 * @function updateEndMonthOptions
 * @description Populates the end month datalist with suggestions based on user input.
 * Handles specific numeric inputs ('0', '1') and text input.
 * (Mirrors updateMonthOptions logic)
 * @param {string} value - The current value entered in the end month input field.
 */
function updateEndMonthOptions(value) {
    let datalist = document.getElementById('endMonths');
    datalist.innerHTML = '';
    if (!value) return;
    value = value.trim();
    let valueLower = value.toLowerCase();
    const isPurelyNumeric = /^\d+$/.test(value);
    const containsLetters = /[a-z]/i.test(value);

    if (isPurelyNumeric && !containsLetters) {
        if (value === '0') {
            monthNames.slice(0, 9).forEach((month, index) => {
                addMonthOption(datalist, `${month} - (${(index + 1).toString().padStart(2, '0')})`);
            });
            return;
        }
        if (value === '1') {
            [0, 9, 10, 11].forEach(index => {
                 addMonthOption(datalist, `${monthNames[index]} - (${(index + 1).toString().padStart(2, '0')})`);
            });
            return;
        }
        let potentialMonthNum = parseInt(value, 10);
        if (!isNaN(potentialMonthNum) && potentialMonthNum >= 1 && potentialMonthNum <= 12) {
             let monthIndex = potentialMonthNum - 1;
             addMonthOption(datalist, `${monthNames[monthIndex]} - (${(monthIndex + 1).toString().padStart(2, '0')})`);
             return;
        }
        return;
    }

    if (containsLetters || !isPurelyNumeric) {
        let matchingMonths = monthNames.filter(month => month.toLowerCase().startsWith(valueLower));
        matchingMonths.forEach(month => {
            let monthIndex = monthNames.indexOf(month);
            let monthValue = `${month} - (${(monthIndex + 1).toString().padStart(2, '0')})`;
            addMonthOption(datalist, monthValue);
        });
    }
}

/**
 * @function updateStartDayOptions
 * @description Populates the start day datalist with valid days and updates placeholder.
 * Does NOT clear input based on validity.
 */
function updateStartDayOptions() {
    updateDayDatalist('startYearInput', 'startMonthInput', 'startDays');
}

/**
 * @function updateEndDayOptions
 * @description Populates the end day datalist with valid days and updates placeholder.
 * Does NOT clear input based on validity.
 */
function updateEndDayOptions() {
    updateDayDatalist('endYearInput', 'endMonthInput', 'endDays');
}

// --- Confirmation Functions (specific for start/end) ---

function confirmStartMonthInput() {
    let input = document.getElementById('startMonthInput');
    let datalist = document.getElementById('startMonths');
    let currentInput = input.value.trim();
    let currentInputLower = currentInput.toLowerCase();
    let bestMatch = null;
    let valueChanged = false;

     if (!currentInput) {
        if(input.value !== '') valueChanged = true;
        input.value = '';
        if(valueChanged) { updateStartDayOptions(); calculateTimeBetween(); }
        return;
    }

    const finalFormatRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) - \(\d{2}\)$/i;
    if (finalFormatRegex.test(currentInput)) {
        updateStartDayOptions(); calculateTimeBetween(); // Update dependencies
        return;
    }

    for (let option of datalist.options) {
         if (option.value.localeCompare(currentInput, undefined, { sensitivity: 'base' }) === 0) {
            bestMatch = option.value;
            break;
        }
    }

    if (!bestMatch) {
        let monthNumber = parseInt(currentInputLower, 10);
        if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
             if (/^\d+\s*$/.test(currentInput)) { // Check if only digits
                bestMatch = `${monthNames[monthNumber - 1]} - (${monthNumber.toString().padStart(2, '0')})`;
             }
        }
        if (!bestMatch) { // Only try text match if numeric didn't work
            let matchedMonth = monthNames.find(name => name.toLowerCase().startsWith(currentInputLower));
            if (matchedMonth) {
                let monthIndex = monthNames.indexOf(matchedMonth);
                bestMatch = `${matchedMonth} - (${(monthIndex + 1).toString().padStart(2, '0')})`;
            }
        }
    }

     if (bestMatch) {
         if(input.value !== bestMatch) {
            input.value = bestMatch;
            valueChanged = true;
         }
    } else {
         if(input.value !== '') {
            input.value = '';
            valueChanged = true;
         }
    }

    // Always update dependencies after confirmation attempt
    updateStartDayOptions();
    calculateTimeBetween();

}

function confirmEndMonthInput() {
    let input = document.getElementById('endMonthInput');
    let datalist = document.getElementById('endMonths');
     let currentInput = input.value.trim();
     let currentInputLower = currentInput.toLowerCase();
    let bestMatch = null;
    let valueChanged = false;

     if (!currentInput) {
         if(input.value !== '') valueChanged = true;
        input.value = '';
         if(valueChanged) { updateEndDayOptions(); calculateTimeBetween(); }
        return;
    }

     const finalFormatRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) - \(\d{2}\)$/i;
    if (finalFormatRegex.test(currentInput)) {
        updateEndDayOptions(); calculateTimeBetween(); // Update dependencies
        return;
    }


    for (let option of datalist.options) {
         if (option.value.localeCompare(currentInput, undefined, { sensitivity: 'base' }) === 0) {
            bestMatch = option.value;
            break;
        }
    }

    if (!bestMatch) {
        let monthNumber = parseInt(currentInputLower, 10);
        if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
             if (/^\d+\s*$/.test(currentInput)) { // Check if only digits
                 bestMatch = `${monthNames[monthNumber - 1]} - (${monthNumber.toString().padStart(2, '0')})`;
             }
        }
        if (!bestMatch) { // Only try text match if numeric didn't work
            let matchedMonth = monthNames.find(name => name.toLowerCase().startsWith(currentInputLower));
            if (matchedMonth) {
                let monthIndex = monthNames.indexOf(matchedMonth);
                bestMatch = `${matchedMonth} - (${(monthIndex + 1).toString().padStart(2, '0')})`;
            }
        }
    }

     if (bestMatch) {
         if(input.value !== bestMatch) {
            input.value = bestMatch;
            valueChanged = true;
         }
    } else {
        if(input.value !== '') {
            input.value = '';
            valueChanged = true;
        }
    }

    // Always update dependencies after confirmation attempt
    updateEndDayOptions();
    calculateTimeBetween();

}

/**
 * @function confirmStartDayInput
 * @description Validates and formats the start day input ONLY on Enter/Tab.
 * **AI/Developer Note:** Confirmation on BLUR is DISABLED.
 */
function confirmStartDayInput() {
    let input = document.getElementById('startDayInput');
    let originalValue = input.value;
    let day = parseInt(input.value, 10);
    let valueChanged = false;

     if (isNaN(day)) {
         if(input.value !== '') { input.value = ''; valueChanged = true; }
         if(valueChanged) calculateTimeBetween();
        return;
    }

    let yearInput = document.getElementById('startYearInput').value;
    let monthInput = document.getElementById('startMonthInput').value;
    let year = parseInt(yearInput, 10);
    let monthMatch = monthInput.match(/\((\d{2})\)/);

    if (isNaN(year) || !monthMatch) {
          if(input.value !== '') { input.value = ''; valueChanged = true; }
          if(valueChanged) calculateTimeBetween(); return;
    }

    let month = parseInt(monthMatch[1], 10);
    let maxDay = 31;
    try { maxDay = new Date(year, month, 0).getDate(); }
    catch (e) {
        if(input.value !== '') { input.value = ''; valueChanged = true; }
        if(valueChanged) calculateTimeBetween(); return;
    }


    if (day >= 1 && day <= maxDay) {
        let formattedDay = day.toString().padStart(2, '0');
        if (input.value !== formattedDay) { input.value = formattedDay; valueChanged = true; }
    } else {
         if(input.value !== '') { input.value = ''; valueChanged = true; }
    }
    if(valueChanged) calculateTimeBetween();
}

/**
 * @function confirmEndDayInput
 * @description Validates and formats the end day input ONLY on Enter/Tab.
 * **AI/Developer Note:** Confirmation on BLUR is DISABLED.
 */
function confirmEndDayInput() {
    let input = document.getElementById('endDayInput');
    let originalValue = input.value;
    let day = parseInt(input.value, 10);
    let valueChanged = false;

     if (isNaN(day)) {
         if(input.value !== '') { input.value = ''; valueChanged = true; }
         if(valueChanged) calculateTimeBetween();
        return;
    }

    let yearInput = document.getElementById('endYearInput').value;
    let monthInput = document.getElementById('endMonthInput').value;
    let year = parseInt(yearInput, 10);
    let monthMatch = monthInput.match(/\((\d{2})\)/);

    if (isNaN(year) || !monthMatch) {
          if(input.value !== '') { input.value = ''; valueChanged = true; }
          if(valueChanged) calculateTimeBetween(); return;
    }

    let month = parseInt(monthMatch[1], 10);
    let maxDay = 31;
    try { maxDay = new Date(year, month, 0).getDate(); }
    catch(e) {
        if(input.value !== '') { input.value = ''; valueChanged = true; }
        if(valueChanged) calculateTimeBetween(); return;
    }

    if (day >= 1 && day <= maxDay) {
        let formattedDay = day.toString().padStart(2, '0');
        if (input.value !== formattedDay) { input.value = formattedDay; valueChanged = true; }
    } else {
         if(input.value !== '') { input.value = ''; valueChanged = true; }
    }
    if(valueChanged) calculateTimeBetween();
}

// --- Calculation Function ---

/**
 * @function getDateFromInputs
 * @description Helper function to parse a Date object from a set of year, month, day inputs.
 * Performs validation checks during parsing.
 * **AI/Developer Note:** Added check to prevent parsing if day input length is less than 2.
 * @param {string} prefix - The prefix for the input IDs ('start' or 'end').
 * @returns {Date|null} - The parsed Date object, or null if inputs are invalid/incomplete.
 */
function getDateFromInputs(prefix) {
    const yearStr = document.getElementById(`${prefix}YearInput`).value;
    const monthInputVal = document.getElementById(`${prefix}MonthInput`).value;
    const dayStr = document.getElementById(`${prefix}DayInput`).value;

    // AI/Dev Note: Check if day input is incomplete (e.g., just '1') before proceeding
    if (!yearStr || !monthInputVal || !dayStr || dayStr.length < 2) {
        return null;
    }

    const year = parseInt(yearStr, 10);
    const day = parseInt(dayStr, 10);
    const monthMatch = monthInputVal.match(/\((\d{2})\)/);
    if (isNaN(year) || isNaN(day) || !monthMatch) return null;
    const month = parseInt(monthMatch[1], 10);
    if (month < 1 || month > 12) return null;

    try {
        const checkTimestamp = Date.UTC(year, month - 1, day);
        if (isNaN(checkTimestamp)) return null;
        const checkDate = new Date(checkTimestamp);
        if (checkDate.getUTCFullYear() !== year || checkDate.getUTCMonth() !== month - 1 || checkDate.getUTCDate() !== day) {
            return null;
        }
        return new Date(checkTimestamp);
    } catch (e) {
        console.error(`Error creating date for ${prefix}:`, e);
        return null;
    }
}

/**
 * @function calculateTimeBetween
 * @description Calculates the time difference between the start and end dates.
 * Updates the UI results section specifically for the "Time Between" tab.
 */
function calculateTimeBetween() {
    const startDate = getDateFromInputs('start');
    const endDate = getDateFromInputs('end');

    const resultDiv = document.getElementById('result');
    const resultWeeksDiv = document.getElementById('result-weeks');

    resultDiv.innerHTML = '--';
    resultWeeksDiv.textContent = '';

    // Only calculate if both dates are valid (getDateFromInputs returns non-null)
    if (!startDate || !endDate) return;

    if (endDate < startDate) {
        resultDiv.innerHTML = '<strong>Error: End date must be on or after start date</strong>';
        resultWeeksDiv.textContent = '';
        return;
    }

    const monthsDiff = calculateAgeInMonths(startDate, endDate);
    const years = Math.floor(monthsDiff / 12);
    const months = monthsDiff % 12;

    resultDiv.innerHTML =
        `<strong>${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}</strong>`;
    resultWeeksDiv.textContent =
        `(${monthsDiff} Month${monthsDiff !== 1 ? 's' : ''} total)`;
}


// ========================================================
// == Event Listeners & Initialization ====================
// ========================================================

document.addEventListener('DOMContentLoaded', function() {
    // --- Helper to check if a value matches a datalist option ---
    function matchesDatalistOption(inputElement, dataListElement) {
        if (!inputElement || !dataListElement) return false;
        const currentValue = inputElement.value;
        if (!currentValue) return false;
        for (let option of dataListElement.options) {
             if (option.value.localeCompare(currentValue, undefined, { sensitivity: 'base' }) === 0) {
                return true;
            }
        }
        return false;
    }

    // --- Manual Tab Input Listeners ---
    const yearInput = document.getElementById('yearInput');
    const monthInput = document.getElementById('monthInput');
    const dayInput = document.getElementById('dayInput');
    const monthsDatalist = document.getElementById('months');

    // Year Input Listener
    yearInput.addEventListener('input', debouncedUpdate); // Trigger calc check while typing
    yearInput.addEventListener('keydown', handleYearInput); // Handles Enter/Tab for validation
    yearInput.addEventListener('blur', validateYearInput); // Handles validation

    // Month Input Listener
    monthInput.addEventListener('keydown', handleMonthInput); // Handles Enter/Tab for confirmation
    monthInput.addEventListener('input', (e) => {
        const inputElement = e.target;
        const currentValue = inputElement.value;
        updateMonthOptions(currentValue); // Update suggestions
        // Confirm month immediately if a datalist option is selected
        if (matchesDatalistOption(inputElement, monthsDatalist)) {
            confirmMonthInput();
        } else {
            debouncedUpdate(); // Otherwise, just trigger debounced calc check
        }
    });
    monthInput.addEventListener('blur', confirmMonthInput); // Handles confirmation/validation

    // Day Input Listener
    dayInput.addEventListener('keydown', handleDayInput); // Handles Enter/Tab for confirmation
    dayInput.addEventListener('input', (e) => {
        // AI/Dev Note: 'input' event for DAY field ONLY triggers debounced calc.
        // Datalist population happens when month/year changes.
        // Confirmation/validation happens on Enter or Tab (via keydown). Blur is disabled.
        debouncedUpdate(); // Trigger debounced calculation check
    });
     // AI/Dev Note: Confirmation on blur for day input is intentionally disabled
     // to prevent perceived "auto-confirming" when user types '1' and pauses/clicks away.
     // Confirmation now ONLY happens on Enter or Tab press for the day field.
     // dayInput.addEventListener('blur', confirmDayInput);

    // REMOVED Date Picker Listener

    // --- Time Between Tab Input Listeners ---
    const startYearInput = document.getElementById('startYearInput');
    const startMonthInput = document.getElementById('startMonthInput');
    const startDayInput = document.getElementById('startDayInput');
    const startMonthsDatalist = document.getElementById('startMonths');

    const endYearInput = document.getElementById('endYearInput');
    const endMonthInput = document.getElementById('endMonthInput');
    const endDayInput = document.getElementById('endDayInput');
    const endMonthsDatalist = document.getElementById('endMonths');

    startYearInput.addEventListener('input', debouncedTimeBetweenUpdate);
    startYearInput.addEventListener('keydown', handleStartYearInput);
    startYearInput.addEventListener('blur', validateStartYearInput);

    startMonthInput.addEventListener('keydown', handleStartMonthInput);
    startMonthInput.addEventListener('input', (e) => {
        const inputElement = e.target;
        updateStartMonthOptions(inputElement.value); // Update suggestions
        if (matchesDatalistOption(inputElement, startMonthsDatalist)) {
            confirmStartMonthInput(); // Confirm if selection matches
        } else {
            debouncedTimeBetweenUpdate(); // Otherwise, debounce calc check
        }
    });
    startMonthInput.addEventListener('blur', confirmStartMonthInput); // Confirm on blur

    startDayInput.addEventListener('keydown', handleStartDayInput); // Handles Enter/Tab
     startDayInput.addEventListener('input', (e) => {
        // AI/Dev Note: 'input' for DAY field only triggers debounced calc.
        debouncedTimeBetweenUpdate(); // Trigger debounced calculation check
    });
     // AI/Dev Note: Confirmation on blur for start day input is intentionally disabled.
     // startDayInput.addEventListener('blur', confirmStartDayInput);

    endYearInput.addEventListener('input', debouncedTimeBetweenUpdate);
    endYearInput.addEventListener('keydown', handleEndYearInput);
    endYearInput.addEventListener('blur', validateEndYearInput);

    endMonthInput.addEventListener('keydown', handleEndMonthInput);
    endMonthInput.addEventListener('input', (e) => {
         const inputElement = e.target;
        updateEndMonthOptions(inputElement.value); // Update suggestions
         if (matchesDatalistOption(inputElement, endMonthsDatalist)) {
            confirmEndMonthInput(); // Confirm if selection matches
        } else {
            debouncedTimeBetweenUpdate(); // Otherwise, debounce calc check
        }
    });
    endMonthInput.addEventListener('blur', confirmEndMonthInput); // Confirm on blur

    endDayInput.addEventListener('keydown', handleEndDayInput); // Handles Enter/Tab
     endDayInput.addEventListener('input', (e) => {
         // AI/Dev Note: 'input' for DAY field only triggers debounced calc.
         debouncedTimeBetweenUpdate(); // Trigger debounced calculation check
    });
     // AI/Dev Note: Confirmation on blur for end day input is intentionally disabled.
     // endDayInput.addEventListener('blur', confirmEndDayInput);

    // --- Tab Switching Listener ---
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

     // --- Clear Button Listener ---
     const clearButton = document.querySelector('.clear-button');
     if (clearButton) {
        clearButton.addEventListener('click', clearAll);
     }


     // --- Info Drawer Listener ---
     const infoToggle = document.querySelector('.info-drawer-toggle');
     if (infoToggle) {
        infoToggle.addEventListener('click', toggleInfoDrawer);
     }


    // --- Initial Setup ---
    switchTab('manual'); // Initialize with the manual tab active
    clearResult(); // Start with empty results
});

const el = document.getElementById('some-id');
if (el) {
    el.addEventListener('event', handler);
}