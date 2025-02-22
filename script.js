const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Add debounce function at the top
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

// Modify input handlers to use debounce
function handleYearInput(event) {
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        validateYearInput();
        if (event.key === 'Tab') {
            document.getElementById('monthInput').focus();
        } else if (event.key === 'Enter' && document.getElementById('yearInput').value) {
            document.getElementById('monthInput').focus();
        }
        return;
    }
    debouncedUpdate();
}

function validateYearInput() {
    let input = document.getElementById('yearInput');
    let year = parseInt(input.value, 10);
    let currentYear = new Date().getFullYear();
    
    if (input.value.length === 2) {
        year = 2000 + year;
        if (year > currentYear) {
            year -= 100;
        }
    }
    
    if (isNaN(year) || year < currentYear - 150 || year > currentYear) {
        input.value = '';
        return;
    }
    
    input.value = year.toString();
    updateDayOptions();
    checkAndCalculate();
}

// Modify handleMonthInput to include predictive text
function handleMonthInput(event) {
    let input = document.getElementById('monthInput');
    let value = input.value.toLowerCase();

    if (event.key === 'Backspace' || event.key === 'Delete') {
        updateMonthOptions(value);
        debouncedUpdate();
        return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        if (input.value) {
            confirmMonthInput();
            if (event.key === 'Tab') {
                document.getElementById('dayInput').focus();
            } else if (event.key === 'Enter') {
                document.getElementById('dayInput').focus();
            }
        }
        return;
    }

    updateMonthOptions(value);
    debouncedUpdate();
}

function confirmMonthInput() {
    let input = document.getElementById('monthInput');
    let selectedOption = document.querySelector('#months option');
    if (selectedOption) {
        input.value = selectedOption.value;
        updateDayOptions();
        checkAndCalculate();
    }
}

function updateMonthOptions(value) {
    let datalist = document.getElementById('months');
    datalist.innerHTML = '';

    if (!value) return;

    value = value.toLowerCase();
    
    // Handle numeric input
    let monthNumber = value.match(/^(\d{1,2})/);
    if (monthNumber) {
        let monthIndex = parseInt(monthNumber[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            let monthValue = `${monthNames[monthIndex]} - (${(monthIndex + 1).toString().padStart(2, '0')})`;
            addMonthOption(datalist, monthValue);
            return;
        }
    }
    
    // Handle text input
    let matchingMonths = monthNames.filter(month => 
        month.toLowerCase().startsWith(value)
    );
    
    matchingMonths.forEach(month => {
        let monthValue = `${month} - (${(monthNames.indexOf(month) + 1).toString().padStart(2, '0')})`;
        addMonthOption(datalist, monthValue);
    });
}

function addMonthOption(datalist, value) {
    let option = document.createElement('option');
    option.value = value;
    datalist.appendChild(option);
}

function updateDayOptions() {
    let yearInput = document.getElementById('yearInput').value;
    let monthInput = document.getElementById('monthInput').value;
    let dayInput = document.getElementById('dayInput');
    let dayValue = dayInput.value;
    
    let year = parseInt(yearInput, 10);
    let monthMatch = monthInput.match(/\((\d{2})\)/);
    
    if (isNaN(year) || !monthMatch) {
        dayInput.setAttribute('placeholder', 'DD');
        return;
    }
    
    let month = parseInt(monthMatch[1], 10);
    let daysInMonth = new Date(year, month, 0).getDate();

    let daysList = document.getElementById('days');
    daysList.innerHTML = '';
    
    for (let i = 1; i <= daysInMonth; i++) {
        let option = document.createElement('option');
        option.value = i.toString().padStart(2, '0');
        daysList.appendChild(option);
    }

    // Filter days based on user input
    if (dayValue) {
        let filteredDays = Array.from(daysList.options)
            .filter(option => option.value.startsWith(dayValue))
            .map(option => option.value);

        // Auto-complete if there's only one match
        if (filteredDays.length === 1 && filteredDays[0] !== dayValue) {
            dayInput.value = filteredDays[0];
        }
    }

    dayInput.setAttribute('placeholder', `DD (1-${daysInMonth})`);
}

function handleDayInput(event) {
    updateDayOptions();
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        let input = document.getElementById('dayInput');
        if (input.value) {
            confirmDayInput();
            if (event.key === 'Enter') {
                input.blur(); // Remove focus from input
                checkAndCalculate();
            }
        }
    }
    debouncedUpdate();
}

function confirmDayInput() {
    let input = document.getElementById('dayInput');
    let day = parseInt(input.value, 10);
    let monthInput = document.getElementById('monthInput').value;
    let monthMatch = monthInput.match(/\((\d{2})\)/);
    if (monthMatch) {
        let month = parseInt(monthMatch[1], 10);
        let year = parseInt(document.getElementById('yearInput').value, 10);
        let daysInMonth = new Date(year, month, 0).getDate();
        if (day >= 1 && day <= daysInMonth) {
            input.value = day.toString().padStart(2, '0');
        } else {
            input.value = '';
        }
    } else {
        if (day >= 1 && day <= 31) {
            input.value = day.toString().padStart(2, '0');
        } else {
            input.value = '';
        }
    }
    checkAndCalculate();
}

function checkAndCalculate() {
    let activeTab = document.querySelector('.tab-button.active').dataset.tab;
    if (activeTab === 'manual') {
        let year = document.getElementById('yearInput').value;
        let month = document.getElementById('monthInput').value;
        let day = document.getElementById('dayInput').value;
        
        if (year && month && day) {
            let monthMatch = month.match(/\((\d{2})\)/);
            if (monthMatch) {
                let monthNumber = parseInt(monthMatch[1], 10);
                calculateAdvancedAge(new Date(year, monthNumber - 1, day));
            }
        } else {
            clearResult();
        }
    } else {
        let datePickerValue = document.getElementById('datePicker').value;
        if (datePickerValue) {
            let [year, month, day] = datePickerValue.split('-');
            calculateAdvancedAge(new Date(year, month - 1, day));
        } else {
            clearResult();
        }
    }
}

// Create debounced update function
const debouncedUpdate = debounce(() => {
    updateDayOptions();
    checkAndCalculate();
}, 150);

// Add loading state management
function setLoadingState(isLoading) {
    const inputs = ['yearInput', 'monthInput', 'dayInput', 'datePicker'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.opacity = isLoading ? '0.7' : '1';
            element.style.pointerEvents = isLoading ? 'none' : 'auto';
        }
    });
}

// Modify calculateAdvancedAge to handle loading states
function calculateAdvancedAge(birthday) {
    setLoadingState(true);
    
    setTimeout(() => {
        var today = new Date();
        if (birthday > today || isNaN(birthday)) {
            clearResult();
            setLoadingState(false);
            return;
        }

        var ageMonths = calculateAgeInMonths(birthday, today);
        var ageYears = Math.floor(ageMonths / 12);
        var remainingMonths = ageMonths % 12;

        document.getElementById('result').innerHTML = 
            `<strong>${ageYears} year${ageYears !== 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}</strong>`;
        document.getElementById('result-weeks').textContent = 
            `(${ageMonths} Month${ageMonths !== 1 ? 's' : ''})`;
        determineCategory(ageMonths);
        calculateJKEligibility(birthday);
        
        setLoadingState(false);
    }, 0);
}

function calculateAgeInMonths(birthday, today) {
    var months = (today.getFullYear() - birthday.getFullYear()) * 12;
    months -= birthday.getMonth();
    months += today.getMonth();
    if (today.getDate() < birthday.getDate()) {
        months--;
    }
    return months;
}

function determineCategory(months) {
    let category;
    if (months <= 17) category = 'Infant';
    else if (months <= 30) category = 'Toddler';
    else if (months <= 43) category = 'Preschool';
    else if (months <= 55) category = 'JK';
    else if (months <= 71) category = 'SK';
    else category = 'Aged Out - (Over 6)';

    document.getElementById('category').innerText = `Age Category: ${category}`;
}

function calculateJKEligibility(birthday) {
    let birthYear = birthday.getFullYear();
    let currentYear = new Date().getFullYear();
    let eligibilityYear = birthYear + 4;
    let jkEligibilityElement = document.getElementById('jk-eligibility');

    // Determine if the child is eligible this year or next year
    if (currentYear === eligibilityYear) {
        jkEligibilityElement.innerHTML = `September ${eligibilityYear}<br><span class="jk-note">(Eligible this year)</span>`;
    } else if (currentYear + 1 === eligibilityYear) {
        jkEligibilityElement.innerHTML = `September ${eligibilityYear}<br><span class="jk-note">(Eligible next year)</span>`;
    } else {
        jkEligibilityElement.textContent = `September ${eligibilityYear}`;
    }
}

function clearResult() {
    document.getElementById('result').innerText = '';
    document.getElementById('result-weeks').innerText = '';
    document.getElementById('category').innerText = '';
    document.getElementById('jk-eligibility').innerText = '';
}

function clearAll() {
    document.getElementById('yearInput').value = '';
    document.getElementById('monthInput').value = '';
    document.getElementById('dayInput').value = '';
    document.getElementById('datePicker').value = '';
    clearResult();
    document.getElementById('yearInput').focus();
}

function handleDatePickerChange() {
    checkAndCalculate();
}

function switchTab(tab) {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`.tab-button[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    clearResult();
    if (tab === 'manual') {
        document.getElementById('yearInput').focus();
    } else {
        document.getElementById('datePicker').focus();
    }
}

function toggleInfoDrawer() {
    const drawerContent = document.querySelector('.info-drawer-content');
    drawerContent.classList.toggle('active');
}

// Add these functions for start date handling
function handleStartYearInput(event) {
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        validateStartYearInput();
        if (event.key === 'Tab') {
            document.getElementById('startMonthInput').focus();
        } else if (event.key === 'Enter' && document.getElementById('startYearInput').value) {
            document.getElementById('startMonthInput').focus();
        }
        return;
    }
    debouncedTimeBetweenUpdate();
}

function handleStartMonthInput(event) {
    let input = document.getElementById('startMonthInput');
    let value = input.value.toLowerCase();

    if (event.key === 'Backspace' || event.key === 'Delete') {
        updateStartMonthOptions(value);
        debouncedTimeBetweenUpdate();
        return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        if (input.value) {
            confirmStartMonthInput();
            if (event.key === 'Tab') {
                document.getElementById('startDayInput').focus();
            } else if (event.key === 'Enter') {
                document.getElementById('startDayInput').focus();
            }
        }
        return;
    }

    updateStartMonthOptions(value);
    debouncedTimeBetweenUpdate();
}

function handleStartDayInput(event) {
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        let input = document.getElementById('startDayInput');
        if (input.value) {
            confirmStartDayInput();
            if (event.key === 'Enter') {
                document.getElementById('endYearInput').focus();
            }
        }
    }
    updateStartDayOptions();
    debouncedTimeBetweenUpdate();
}

function handleEndYearInput(event) {
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        validateEndYearInput();
        if (event.key === 'Tab') {
            document.getElementById('endMonthInput').focus();
        } else if (event.key === 'Enter' && document.getElementById('endYearInput').value) {
            document.getElementById('endMonthInput').focus();
        }
        return;
    }
    debouncedTimeBetweenUpdate();
}

// Add validation functions
function validateStartYearInput() {
    let input = document.getElementById('startYearInput');
    let year = parseInt(input.value, 10);
    let currentYear = new Date().getFullYear();
    
    if (input.value.length === 2) {
        year = 2000 + year;
        if (year > currentYear) {
            year -= 100;
        }
    }
    
    if (isNaN(year) || year < currentYear - 150 || year > currentYear) {
        input.value = '';
        return;
    }
    
    input.value = year.toString();
    updateStartDayOptions();
    calculateTimeBetween();
}

// Add the calculation function
function calculateTimeBetween() {
    const startDate = getDateFromInputs('start');
    const endDate = getDateFromInputs('end');
    
    if (!startDate || !endDate) return;
    
    if (endDate < startDate) {
        document.getElementById('result').innerHTML = 
            '<strong>End date must be after start date</strong>';
        document.getElementById('result-weeks').textContent = '';
        return;
    }
    
    const monthsDiff = calculateMonthsBetween(startDate, endDate);
    const years = Math.floor(monthsDiff / 12);
    const months = monthsDiff % 12;
    
    document.getElementById('result').innerHTML = 
        `<strong>${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}</strong>`;
    document.getElementById('result-weeks').textContent = 
        `(${monthsDiff} Month${monthsDiff !== 1 ? 's' : ''})`;
    
    // Hide category and JK eligibility for time between calculations
    document.querySelector('.category').style.display = 'none';
    document.querySelector('.jk-eligibility').style.display = 'none';
}

// Add helper function for calculating months between dates
function calculateMonthsBetween(startDate, endDate) {
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months += endDate.getMonth() - startDate.getMonth();
    
    // Adjust for day of month
    if (endDate.getDate() < startDate.getDate()) {
        months--;
    }
    
    return months;
}

// Add the debounced update function for time between calculations
const debouncedTimeBetweenUpdate = debounce(() => {
    calculateTimeBetween();
}, 300);

// Add this helper function to get dates from inputs
function getDateFromInputs(prefix) {
    const year = document.getElementById(`${prefix}YearInput`).value;
    const monthInput = document.getElementById(`${prefix}MonthInput`).value;
    const day = document.getElementById(`${prefix}DayInput`).value;
    
    if (!year || !monthInput || !day) return null;
    
    const monthMatch = monthInput.match(/\((\d{2})\)/);
    if (!monthMatch) return null;
    
    return new Date(year, parseInt(monthMatch[1], 10) - 1, parseInt(day, 10));
}

// Add the month options update function for start date
function updateStartMonthOptions(value) {
    let datalist = document.getElementById('startMonths');
    datalist.innerHTML = '';

    if (!value) return;

    value = value.toLowerCase();
    
    // Handle numeric input
    let monthNumber = value.match(/^(\d{1,2})/);
    if (monthNumber) {
        let monthIndex = parseInt(monthNumber[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            let monthValue = `${monthNames[monthIndex]} - (${(monthIndex + 1).toString().padStart(2, '0')})`;
            addMonthOption(datalist, monthValue);
            return;
        }
    }
    
    // Handle text input
    let matchingMonths = monthNames.filter(month => 
        month.toLowerCase().startsWith(value)
    );
    
    matchingMonths.forEach(month => {
        let monthValue = `${month} - (${(monthNames.indexOf(month) + 1).toString().padStart(2, '0')})`;
        addMonthOption(datalist, monthValue);
    });
}

// Add the month options update function for end date
function updateEndMonthOptions(value) {
    let datalist = document.getElementById('endMonths');
    datalist.innerHTML = '';

    if (!value) return;

    value = value.toLowerCase();
    
    // Handle numeric input
    let monthNumber = value.match(/^(\d{1,2})/);
    if (monthNumber) {
        let monthIndex = parseInt(monthNumber[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            let monthValue = `${monthNames[monthIndex]} - (${(monthIndex + 1).toString().padStart(2, '0')})`;
            addMonthOption(datalist, monthValue);
            return;
        }
    }
    
    // Handle text input
    let matchingMonths = monthNames.filter(month => 
        month.toLowerCase().startsWith(value)
    );
    
    matchingMonths.forEach(month => {
        let monthValue = `${month} - (${(monthNames.indexOf(month) + 1).toString().padStart(2, '0')})`;
        addMonthOption(datalist, monthValue);
    });
}

// Add event listeners for the time between inputs
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('startYearInput').addEventListener('keydown', handleStartYearInput);
    document.getElementById('startMonthInput').addEventListener('keydown', handleStartMonthInput);
    document.getElementById('startDayInput').addEventListener('keydown', handleStartDayInput);
    document.getElementById('endYearInput').addEventListener('keydown', handleEndYearInput);
    document.getElementById('endMonthInput').addEventListener('keydown', handleEndMonthInput);
    document.getElementById('endDayInput').addEventListener('keydown', handleEndDayInput);
});

// Add validation functions for end date inputs
function validateEndYearInput() {
    let input = document.getElementById('endYearInput');
    let year = parseInt(input.value, 10);
    let currentYear = new Date().getFullYear();
    
    if (input.value.length === 2) {
        year = 2000 + year;
        if (year > currentYear) {
            year -= 100;
        }
    }
    
    if (isNaN(year) || year < currentYear - 150 || year > currentYear + 50) {
        input.value = '';
        return;
    }
    
    input.value = year.toString();
    updateEndDayOptions();
    calculateTimeBetween();
}

function updateEndDayOptions() {
    let yearInput = document.getElementById('endYearInput').value;
    let monthInput = document.getElementById('endMonthInput').value;
    let dayInput = document.getElementById('endDayInput');
    let dayValue = dayInput.value;
    
    let year = parseInt(yearInput, 10);
    let monthMatch = monthInput.match(/\((\d{2})\)/);
    
    if (isNaN(year) || !monthMatch) {
        dayInput.setAttribute('placeholder', 'DD');
        return;
    }
    
    let month = parseInt(monthMatch[1], 10);
    let daysInMonth = new Date(year, month, 0).getDate();

    let daysList = document.getElementById('endDays');
    daysList.innerHTML = '';
    
    for (let i = 1; i <= daysInMonth; i++) {
        let option = document.createElement('option');
        option.value = i.toString().padStart(2, '0');
        daysList.appendChild(option);
    }

    if (dayValue) {
        let filteredDays = Array.from(daysList.options)
            .filter(option => option.value.startsWith(dayValue))
            .map(option => option.value);

        if (filteredDays.length === 1 && filteredDays[0] !== dayValue) {
            dayInput.value = filteredDays[0];
        }
    }

    dayInput.setAttribute('placeholder', `DD (1-${daysInMonth})`);
}

function handleEndDayInput(event) {
    updateEndDayOptions();
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        let input = document.getElementById('endDayInput');
        if (input.value) {
            confirmEndDayInput();
            if (event.key === 'Enter') {
                input.blur(); // Remove focus from input
                calculateTimeBetween();
            }
        }
    }
    debouncedTimeBetweenUpdate();
}

function confirmEndDayInput() {
    let input = document.getElementById('endDayInput');
    let daysList = document.getElementById('endDays');
    let selectedOption = Array.from(daysList.options)
        .find(option => option.value === input.value);
        
    if (selectedOption) {
        input.value = selectedOption.value;
        calculateTimeBetween();
    }
}

// Add event listeners for end date inputs
document.addEventListener('DOMContentLoaded', function() {
    // ...existing event listeners...
    document.getElementById('endYearInput').addEventListener('keydown', handleEndYearInput);
    document.getElementById('endMonthInput').addEventListener('keydown', handleEndMonthInput);
    document.getElementById('endDayInput').addEventListener('keydown', handleEndDayInput);
});

// Add these functions for start date handling
function updateStartDayOptions() {
    let yearInput = document.getElementById('startYearInput').value;
    let monthInput = document.getElementById('startMonthInput').value;
    let dayInput = document.getElementById('startDayInput');
    let dayValue = dayInput.value;
    
    let year = parseInt(yearInput, 10);
    let monthMatch = monthInput.match(/\((\d{2})\)/);
    
    if (isNaN(year) || !monthMatch) {
        dayInput.setAttribute('placeholder', 'DD');
        return;
    }
    
    let month = parseInt(monthMatch[1], 10);
    let daysInMonth = new Date(year, month, 0).getDate();

    let daysList = document.getElementById('startDays');
    daysList.innerHTML = '';
    
    for (let i = 1; i <= daysInMonth; i++) {
        let option = document.createElement('option');
        option.value = i.toString().padStart(2, '0');
        daysList.appendChild(option);
    }

    if (dayValue) {
        let filteredDays = Array.from(daysList.options)
            .filter(option => option.value.startsWith(dayValue))
            .map(option => option.value);

        if (filteredDays.length === 1 && filteredDays[0] !== dayValue) {
            dayInput.value = filteredDays[0];
        }
    }

    dayInput.setAttribute('placeholder', `DD (1-${daysInMonth})`);
}

function handleStartDayInput(event) {
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        let input = document.getElementById('startDayInput');
        if (input.value) {
            confirmStartDayInput();
            if (event.key === 'Enter') {
                document.getElementById('endYearInput').focus();
            }
        }
    }
    updateStartDayOptions();
    debouncedTimeBetweenUpdate();
}

function confirmStartDayInput() {
    let input = document.getElementById('startDayInput');
    let daysList = document.getElementById('startDays');
    let selectedOption = Array.from(daysList.options)
        .find(option => option.value === input.value);
        
    if (selectedOption) {
        input.value = selectedOption.value;
        calculateTimeBetween();
    }
}

// Add the calculation function for time between dates
function calculateTimeBetween() {
    const startDate = getDateFromInputs('start');
    const endDate = getDateFromInputs('end');
    
    if (!startDate || !endDate) return;
    
    if (endDate < startDate) {
        document.getElementById('result').innerHTML = 
            '<strong>End date must be after start date</strong>';
        document.getElementById('result-weeks').textContent = '';
        return;
    }
    
    const monthsDiff = calculateMonthsBetween(startDate, endDate);
    const years = Math.floor(monthsDiff / 12);
    const months = monthsDiff % 12;
    
    // Update the results in the results container
    document.getElementById('result').innerHTML = 
        `<strong>${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}</strong>`;
    document.getElementById('result-weeks').textContent = 
        `(${monthsDiff} Month${monthsDiff !== 1 ? 's' : ''})`;
    
    // Hide category and JK eligibility for time between calculations
    document.querySelector('.category').style.display = 'none';
    document.querySelector('.jk-eligibility').style.display = 'none';
}

// Add helper function for calculating months between dates
function calculateMonthsBetween(startDate, endDate) {
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months += endDate.getMonth() - startDate.getMonth();
    
    // Adjust for day of month
    if (endDate.getDate() < startDate.getDate()) {
        months--;
    }
    
    return Math.max(0, months);
}

// Add this to your existing tab switching logic
function handleTabSwitch(tabId) {
    // ...existing tab switching code...
    
    // Update result label based on active tab
    const resultLabel = document.querySelector('.result-label');
    if (tabId === 'time-between-tab') {
        resultLabel.textContent = 'Time Between';
    } else {
        resultLabel.textContent = 'Age';
    }
    
    // Update visibility of category and JK eligibility
    const categoryDiv = document.querySelector('.category');
    const jkDiv = document.querySelector('.jk-eligibility');
    
    if (tabId === 'time-between-tab') {
        categoryDiv.style.display = 'none';
        jkDiv.style.display = 'none';
    } else {
        categoryDiv.style.display = 'block';
        jkDiv.style.display = 'block';
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Time Between tab input listeners
    document.getElementById('startYearInput').addEventListener('keydown', handleStartYearInput);
    document.getElementById('startMonthInput').addEventListener('keydown', handleStartMonthInput);
    document.getElementById('startDayInput').addEventListener('keydown', handleStartDayInput);
    document.getElementById('endYearInput').addEventListener('keydown', handleEndYearInput);
    document.getElementById('endMonthInput').addEventListener('keydown', handleEndMonthInput);
    document.getElementById('endDayInput').addEventListener('keydown', handleEndDayInput);
});

// Event listeners
document.getElementById('yearInput').addEventListener('keydown', handleYearInput);
document.getElementById('yearInput').addEventListener('input', handleYearInput);
document.getElementById('yearInput').addEventListener('blur', validateYearInput);
document.getElementById('monthInput').addEventListener('input', handleMonthInput);
document.getElementById('monthInput').addEventListener('keydown', handleMonthInput);
document.getElementById('monthInput').addEventListener('blur', confirmMonthInput);
document.getElementById('dayInput').addEventListener('input', handleDayInput);
document.getElementById('dayInput').addEventListener('keydown', handleDayInput);
document.getElementById('dayInput').addEventListener('blur', confirmDayInput);
document.getElementById('datePicker').addEventListener('change', handleDatePickerChange);

// Add event listeners for start date handling
document.getElementById('startYearInput').addEventListener('keydown', handleStartYearInput);
document.getElementById('startMonthInput').addEventListener('keydown', handleStartMonthInput);
document.getElementById('startDayInput').addEventListener('keydown', handleStartDayInput);
document.getElementById('endYearInput').addEventListener('keydown', handleEndYearInput);
// ... add similar listeners for endMonth and endDay inputs

// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
});

// Initialize
switchTab('manual');

// Add confirmation functions for start date inputs
function confirmStartMonthInput() {
    let input = document.getElementById('startMonthInput');
    let selectedOption = document.querySelector('#startMonths option');
    if (selectedOption) {
        input.value = selectedOption.value;
        updateStartDayOptions();
        calculateTimeBetween();
    }
}

function confirmEndMonthInput() {
    let input = document.getElementById('endMonthInput');
    let selectedOption = document.querySelector('#endMonths option');
    if (selectedOption) {
        input.value = selectedOption.value;
        updateEndDayOptions();
        calculateTimeBetween();
    }
}

// Add handler for end month input
function handleEndMonthInput(event) {
    let input = document.getElementById('endMonthInput');
    let value = input.value.toLowerCase();

    if (event.key === 'Backspace' || event.key === 'Delete') {
        updateEndMonthOptions(value);
        debouncedTimeBetweenUpdate();
        return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        if (input.value) {
            confirmEndMonthInput();
            if (event.key === 'Tab') {
                document.getElementById('endDayInput').focus();
            } else if (event.key === 'Enter') {
                document.getElementById('endDayInput').focus();
            }
        }
        return;
    }

    updateEndMonthOptions(value);
    debouncedTimeBetweenUpdate();
}

// Update event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add blur event listeners for month inputs
    document.getElementById('startMonthInput').addEventListener('blur', confirmStartMonthInput);
    document.getElementById('endMonthInput').addEventListener('blur', confirmEndMonthInput);
    
    // Add input event listeners for month inputs
    document.getElementById('startMonthInput').addEventListener('input', function(event) {
        updateStartMonthOptions(event.target.value);
    });
    document.getElementById('endMonthInput').addEventListener('input', function(event) {
        updateEndMonthOptions(event.target.value);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // ...existing event listeners...
    
    // Add tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab') + '-tab';
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to selected tab
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Handle tab-specific changes
            handleTabSwitch(tabId);
        });
    });
});
