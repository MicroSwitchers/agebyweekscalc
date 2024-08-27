const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function handleYearInput(event) {
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        validateYearInput();
        if (event.key === 'Tab') {
            document.getElementById('monthInput').focus();
        }
    }
    updateDayOptions();
    checkAndCalculate();
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

function handleMonthInput(event) {
    let input = document.getElementById('monthInput');
    let value = input.value.toLowerCase();

    if (event.key === 'Backspace' || event.key === 'Delete') {
        setTimeout(() => {
            updateMonthOptions(input.value.toLowerCase());
            updateDayOptions();
            checkAndCalculate();
        }, 0);
        return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        confirmMonthInput();
        if (event.key === 'Tab') {
            document.getElementById('dayInput').focus();
        }
        return;
    }

    updateMonthOptions(value);
    updateDayOptions();
    checkAndCalculate();
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

    let monthNumber = value.match(/^(\d{1,2})/);
    if (monthNumber) {
        let monthIndex = parseInt(monthNumber[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            let monthValue = `${monthNames[monthIndex]} - (${(monthIndex + 1).toString().padStart(2, '0')})`;
            addMonthOption(datalist, monthValue);
            return;
        }
    }
    
    let matchingMonths = monthNames.filter(month => month.toLowerCase().startsWith(value));
    matchingMonths.forEach((month, index) => {
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
    let filteredDays = Array.from(daysList.options)
        .filter(option => option.value.startsWith(dayValue))
        .map(option => option.value);

    if (filteredDays.length === 1 && filteredDays[0] !== dayValue) {
        dayInput.value = filteredDays[0];
    }

    dayInput.setAttribute('placeholder', `DD (1-${daysInMonth})`);
}

function handleDayInput(event) {
    updateDayOptions();
    if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        confirmDayInput();
    }
    checkAndCalculate();
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

function calculateAdvancedAge(birthday) {
    var today = new Date();
    if (birthday > today || isNaN(birthday)) {
        clearResult();
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

// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
});

// Initialize
switchTab('manual');
