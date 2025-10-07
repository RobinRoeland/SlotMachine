document.addEventListener('DOMContentLoaded', function () {
    var showPrizesListCheckbox = document.getElementById('showPrizesList');
    var showOddsCheckbox = document.getElementById('showOdds');
    var showOddsContainer = document.getElementById('showOddsContainer');
    var enablePitySystemCheckbox = document.getElementById('enablePitySystem');
    var settingsSaved = document.getElementById('settingsSaved');
    
    // Load settings from localStorage
    function loadSettings() {
        var showPrizesList = localStorage.getItem('settings_show_prizes_list');
        var showOdds = localStorage.getItem('settings_show_odds');
        var enablePitySystem = localStorage.getItem('settings_enable_pity_system');
        
        // Default to true if not set
        if (showPrizesList === null) {
            showPrizesList = 'true';
        }
        if (showOdds === null) {
            showOdds = 'true';
        }
        if (enablePitySystem === null) {
            enablePitySystem = 'false';
        }
        
        if (showPrizesListCheckbox) {
            showPrizesListCheckbox.checked = showPrizesList === 'true';
        }
        
        if (showOddsCheckbox) {
            showOddsCheckbox.checked = showOdds === 'true';
        }
        
        if (enablePitySystemCheckbox) {
            enablePitySystemCheckbox.checked = enablePitySystem === 'true';
        }
        
        // Update odds toggle state based on prizes list visibility
        updateOddsToggleState();
    }
    
    // Update the state of the odds toggle
    function updateOddsToggleState() {
        if (!showPrizesListCheckbox || !showOddsContainer || !showOddsCheckbox) return;
        
        if (!showPrizesListCheckbox.checked) {
            // Disable odds toggle and set to false
            showOddsContainer.classList.add('disabled');
            showOddsCheckbox.checked = false;
            saveSettings();
        } else {
            // Enable odds toggle
            showOddsContainer.classList.remove('disabled');
        }
    }
    
    // Save settings to localStorage
    function saveSettings() {
        if (showPrizesListCheckbox) {
            localStorage.setItem('settings_show_prizes_list', showPrizesListCheckbox.checked.toString());
        }
        
        if (showOddsCheckbox) {
            localStorage.setItem('settings_show_odds', showOddsCheckbox.checked.toString());
        }
        
        if (enablePitySystemCheckbox) {
            localStorage.setItem('settings_enable_pity_system', enablePitySystemCheckbox.checked.toString());
        }
        
        // Show saved indicator
        if (settingsSaved) {
            settingsSaved.style.display = 'inline';
            setTimeout(function () {
                settingsSaved.style.display = 'none';
            }, 2000);
        }
    }
    
    // Event listeners
    if (showPrizesListCheckbox) {
        showPrizesListCheckbox.addEventListener('change', function () {
            updateOddsToggleState();
            saveSettings();
        });
    }
    
    if (showOddsCheckbox) {
        showOddsCheckbox.addEventListener('change', function () {
            saveSettings();
        });
    }
    
    if (enablePitySystemCheckbox) {
        enablePitySystemCheckbox.addEventListener('change', function () {
            saveSettings();
        });
    }
    
    // Initialize
    loadSettings();
});

