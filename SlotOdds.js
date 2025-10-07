document.addEventListener('DOMContentLoaded', function () {
    var oddsList = document.getElementById('oddsList');
    var resetOddsBtn = document.getElementById('resetOdds');
    var saveOddsBtn = document.getElementById('saveOdds');
    var oddsError = document.getElementById('oddsError');
    var unsavedIndicator = document.getElementById('unsavedIndicator');
    var rollerCountInput = document.getElementById('rollerCount');
    var saveRollerCountBtn = document.getElementById('saveRollerCount');
    var rollerUnsaved = document.getElementById('rollerUnsaved');
    var pityValueInput = document.getElementById('pityValue');
    var savePityValueBtn = document.getElementById('savePityValue');
    var pityUnsaved = document.getElementById('pityUnsaved');
    var pityDisabledNote = document.getElementById('pityDisabledNote');
    var items = [];
    var odds = {};
    var savedOdds = {};
    var savedRollerCount = null;
    var savedPityValue = null;

    function showError(msg) {
        if (oddsError) oddsError.textContent = msg || '';
    }

    function loadItems() {
        // Try to get items from localStorage draft first, then from slotitems/items.json
        var draft = localStorage.getItem('slot_items_draft');
        if (draft) {
            try {
                items = JSON.parse(draft);
                return Promise.resolve();
            } catch (e) {
                // fall through to fetch
            }
        }
        
        return fetch('slotitems/items.json', { cache: 'no-cache' })
            .then(function (r) { 
                if (!r.ok) throw new Error('Failed to load items.json'); 
                return r.json(); 
            })
            .then(function (data) {
                items = data;
            })
            .catch(function () {
                items = [];
            });
    }

    function loadOdds() {
        var stored = localStorage.getItem('slot_odds');
        if (stored) {
            try {
                odds = JSON.parse(stored);
                savedOdds = JSON.parse(stored);
            } catch (e) {
                odds = {};
                savedOdds = {};
            }
        }
    }
    
    function checkForChanges() {
        var hasChanges = JSON.stringify(odds) !== JSON.stringify(savedOdds);
        if (unsavedIndicator) {
            unsavedIndicator.style.display = hasChanges ? 'inline' : 'none';
        }
    }

    function normalizeOdds() {
        var total = 0;
        items.forEach(function (item) {
            var weight = odds[item.name] || 1;
            total += weight;
        });
        
        var normalized = {};
        items.forEach(function (item) {
            var weight = odds[item.name] || 1;
            normalized[item.name] = weight / total;
        });
        return normalized;
    }

    function updateAllPercentages() {
        var normalized = normalizeOdds();
        var sliders = oddsList.querySelectorAll('.odds-slider');
        sliders.forEach(function (slider) {
            var itemName = slider.dataset.item;
            var percentageEl = slider.parentElement.querySelector('.odds-percentage');
            var percentage = (normalized[itemName] * 100).toFixed(1);
            percentageEl.textContent = percentage + '%';
        });
    }

    function renderOdds() {
        if (!oddsList) return;
        
        oddsList.innerHTML = '';
        var normalized = normalizeOdds();
        
        items.forEach(function (item) {
            var currentWeight = odds[item.name] || 1;
            var percentage = (normalized[item.name] * 100).toFixed(1);
            
            var itemEl = document.createElement('div');
            itemEl.className = 'odds-item';
            
            itemEl.innerHTML = `
                <img src="${item.imageSrc}" alt="${item.name}" />
                <div class="odds-item-info">
                    <div class="odds-item-name">${item.name}</div>
                </div>
                <input type="range" class="odds-slider" min="0.1" max="10" step="0.1" value="${currentWeight}" 
                       data-item="${item.name}" />
                <div class="odds-value">${currentWeight}</div>
                <div class="odds-percentage">${percentage}%</div>
            `;
            
            oddsList.appendChild(itemEl);
        });
        
        // Add event listeners to sliders
        var sliders = oddsList.querySelectorAll('.odds-slider');
        sliders.forEach(function (slider) {
            slider.addEventListener('input', function () {
                var itemName = this.dataset.item;
                var value = parseFloat(this.value);
                odds[itemName] = value;
                
                // Update display
                var valueEl = this.parentElement.querySelector('.odds-value');
                valueEl.textContent = value;
                
                // Update all percentages to ensure they sum to 100%
                updateAllPercentages();
                
                // Check for unsaved changes
                checkForChanges();
            });
        });
    }

    function resetToEqual() {
        items.forEach(function (item) {
            odds[item.name] = 1;
        });
        renderOdds();
        checkForChanges();
    }

    function saveOdds() {
        try {
            localStorage.setItem('slot_odds', JSON.stringify(odds));
            savedOdds = JSON.parse(JSON.stringify(odds));
            showError('');
            checkForChanges();
        } catch (err) {
            showError('Failed to save odds: ' + err.message);
        }
    }

    // Roller count functions
    function loadRollerCount() {
        var stored = localStorage.getItem('slot_roller_count');
        if (stored && rollerCountInput) {
            rollerCountInput.value = stored;
            savedRollerCount = stored;
        } else if (rollerCountInput) {
            savedRollerCount = rollerCountInput.value;
        }
    }
    
    function checkRollerCountChanges() {
        if (rollerCountInput && rollerUnsaved) {
            var hasChanges = rollerCountInput.value !== savedRollerCount;
            rollerUnsaved.style.display = hasChanges ? 'inline' : 'none';
        }
    }
    
    function saveRollerCount() {
        if (rollerCountInput) {
            var count = parseInt(rollerCountInput.value);
            if (count >= 1 && count <= 10) {
                localStorage.setItem('slot_roller_count', count);
                savedRollerCount = String(count);
                showError('');
                checkRollerCountChanges();
            } else {
                showError('Roller count must be between 1 and 10');
            }
        }
    }

    // Pity value functions
    function loadPityValue() {
        var stored = localStorage.getItem('slot_pity_value');
        if (stored && pityValueInput) {
            pityValueInput.value = stored;
            savedPityValue = stored;
        } else if (pityValueInput) {
            savedPityValue = pityValueInput.value;
        }
        
        // Check if pity system is enabled and update UI
        updatePityInputState();
    }
    
    function updatePityInputState() {
        var pityEnabled = localStorage.getItem('settings_enable_pity_system') === 'true';
        
        // Find the pity container by traversing up from the input
        var pityContainer = null;
        if (pityValueInput && pityValueInput.parentElement) {
            pityContainer = pityValueInput.parentElement;
        }
        
        if (pityValueInput) {
            pityValueInput.disabled = !pityEnabled;
        }
        
        if (savePityValueBtn) {
            savePityValueBtn.disabled = !pityEnabled;
        }
        
        if (pityContainer) {
            if (!pityEnabled) {
                pityContainer.style.opacity = '0.5';
                pityContainer.style.pointerEvents = 'none';
            } else {
                pityContainer.style.opacity = '1';
                pityContainer.style.pointerEvents = 'auto';
            }
        }
        
        // Show/hide the disabled note
        if (pityDisabledNote) {
            pityDisabledNote.style.display = pityEnabled ? 'none' : 'block';
        }
    }
    
    function checkPityValueChanges() {
        if (pityValueInput && pityUnsaved) {
            var hasChanges = pityValueInput.value !== savedPityValue;
            pityUnsaved.style.display = hasChanges ? 'inline' : 'none';
        }
    }
    
    function savePityValue() {
        if (pityValueInput) {
            var value = parseInt(pityValueInput.value);
            if (value >= 1 && value <= 1000) {
                localStorage.setItem('slot_pity_value', value);
                savedPityValue = String(value);
                showError('');
                checkPityValueChanges();
            } else {
                showError('Pity value must be between 1 and 1000');
            }
        }
    }

    // Initialize
    loadItems().then(function () {
        loadOdds();
        renderOdds();
        loadRollerCount();
        loadPityValue();
    });

    if (resetOddsBtn) {
        resetOddsBtn.addEventListener('click', resetToEqual);
    }

    if (saveOddsBtn) {
        saveOddsBtn.addEventListener('click', saveOdds);
    }
    
    if (saveRollerCountBtn) {
        saveRollerCountBtn.addEventListener('click', saveRollerCount);
    }
    
    if (rollerCountInput) {
        rollerCountInput.addEventListener('input', checkRollerCountChanges);
    }
    
    if (savePityValueBtn) {
        savePityValueBtn.addEventListener('click', savePityValue);
    }
    
    if (pityValueInput) {
        pityValueInput.addEventListener('input', checkPityValueChanges);
    }
});
