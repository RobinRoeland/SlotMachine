// Load roller count from localStorage, default to 4
rollerCount = parseInt(localStorage.getItem('slot_roller_count')) || 4;

// Data models
class Item {
    constructor(name, imageSrc) {
        this.name = name;
        this.imageSrc = imageSrc;
    }
}

class Roller {
    constructor(items) {
        this.items = Array.isArray(items) ? items : [];
    }
}

document.addEventListener('DOMContentLoaded', function () {
    var rollersContainer = document.querySelector('.rollers');
    var rollButton = document.getElementById('rollButton');
    var prizeListDisplay = document.getElementById('prizeListDisplay');
    var arduinoInstruction = document.getElementById('arduinoInstruction');
    
    // Initialize Arduino Controller
    var arduinoController = null;
    var arduinoUI = null;
    
    // Check if Arduino control is enabled in settings
    var arduinoEnabled = localStorage.getItem('settings_enable_arduino_control') === 'true';
    
    if (window.ArduinoController && window.ArduinoUI && arduinoEnabled) {
        arduinoController = new window.ArduinoController();
        arduinoUI = new window.ArduinoUI(arduinoController);
        arduinoUI.initialize();
        
        // Set up status change callback to toggle UI
        arduinoController.onStatusChange(function(status) {
            if (status === 'connected') {
                // Hide manual button, show Arduino instruction
                if (rollButton) rollButton.style.display = 'none';
                if (arduinoInstruction) arduinoInstruction.style.display = 'block';
            } else {
                // Show manual button, hide Arduino instruction
                if (rollButton) rollButton.style.display = 'block';
                if (arduinoInstruction) arduinoInstruction.style.display = 'none';
            }
        });
    }

    // ---- Slot machine dynamic rollers ----
    if (rollersContainer) {
        // Prefer in-memory draft; fallback to slotitems/items.json
        var baseItems = null;

        function getWeightedItem(items, odds) {
            if (!items || items.length === 0) return null;
            
            // Load odds from localStorage
            var storedOdds = {};
            try {
                storedOdds = JSON.parse(localStorage.getItem('slot_odds') || '{}');
            } catch (e) {
                storedOdds = {};
            }
            
            // Calculate total weight
            var totalWeight = 0;
            items.forEach(function (item) {
                totalWeight += storedOdds[item.name] || 1;
            });
            
            // Select random item based on weights
            var random = Math.random() * totalWeight;
            var currentWeight = 0;
            
            for (var i = 0; i < items.length; i++) {
                currentWeight += storedOdds[items[i].name] || 1;
                if (random <= currentWeight) {
                    return items[i];
                }
            }
            
            // Fallback to first item
            return items[0];
        }

        function createRollerElement(roller, isRolling) {
            var rollerEl = document.createElement('div');
            rollerEl.className = 'roller';
            
            var contentEl = document.createElement('div');
            contentEl.className = 'roller-content';
            
            // Always create exactly 5 items to maintain consistent height
            for (var i = 0; i < 5; i++) {
                var selectedItem = getWeightedItem(roller.items);
                var img = document.createElement('img');
                img.src = selectedItem.imageSrc;
                img.alt = selectedItem.name;
                img.draggable = false;
                
                // Add classes for styling - center item (index 2) is highlighted when not rolling
                if (!isRolling && i === 2) {
                    img.className = 'center-item';
                } else {
                    img.className = 'edge-item';
                }
                
                contentEl.appendChild(img);
            }
            
            rollerEl.appendChild(contentEl);
            return rollerEl;
        }

        function renderRollers(count, isRolling) {
            rollersContainer.innerHTML = '';
            for (var i = 0; i < count; i++) {
                var roller = new Roller(baseItems);
                rollersContainer.appendChild(createRollerElement(roller, isRolling));
            }
        }

        function checkForWin(rollers) {
            // Get center items from all rollers
            var centerItems = [];
            rollers.forEach(function (roller) {
                var images = roller.querySelectorAll('img');
                if (images[2]) { // Center item is at index 2
                    centerItems.push(images[2].alt);
                }
            });
            
            // Load prizes
            var prizes = [];
            try {
                var storedPrizes = localStorage.getItem('slot_prizes');
                if (storedPrizes) {
                    prizes = JSON.parse(storedPrizes);
                }
            } catch (e) {
                prizes = [];
            }
            
            // Filter prizes by roller count
            var currentRollerCount = rollers.length;
            prizes = prizes.filter(function (prize) {
                return prize.pattern && prize.pattern.length === currentRollerCount;
            });
            
            // Check if current result matches any prize
            for (var i = 0; i < prizes.length; i++) {
                var prize = prizes[i];
                var matches = true;
                
                for (var j = 0; j < prize.pattern.length; j++) {
                    if (prize.pattern[j] !== '*' && prize.pattern[j] !== centerItems[j]) {
                        matches = false;
                        break;
                    }
                }
                
                if (matches) {
                    return prize;
                }
            }
            
            return null;
        }
        
        function forcePityWin(rollers) {
            // Load prizes that match roller count
            var allPrizes = [];
            var pityOdds = {};
            try {
                var storedPrizes = localStorage.getItem('slot_prizes');
                if (storedPrizes) {
                    allPrizes = JSON.parse(storedPrizes);
                }
                var storedPityOdds = localStorage.getItem('slot_pity_odds');
                if (storedPityOdds) {
                    pityOdds = JSON.parse(storedPityOdds);
                }
            } catch (e) {
                allPrizes = [];
                pityOdds = {};
            }
            
            var currentRollerCount = rollers.length;
            
            // Build array of valid prizes with their original indices
            var validPrizes = [];
            allPrizes.forEach(function (prize, index) {
                if (prize.pattern && prize.pattern.length === currentRollerCount) {
                    validPrizes.push({ prize: prize, originalIndex: index });
                }
            });
            
            if (validPrizes.length === 0) return;
            
            // Calculate total weight
            var totalWeight = 0;
            validPrizes.forEach(function (item) {
                totalWeight += pityOdds[item.originalIndex] || 1;
            });
            
            // Select a weighted random prize
            var random = Math.random() * totalWeight;
            var currentWeight = 0;
            var selectedPrize = validPrizes[0].prize;
            
            for (var i = 0; i < validPrizes.length; i++) {
                currentWeight += pityOdds[validPrizes[i].originalIndex] || 1;
                if (random <= currentWeight) {
                    selectedPrize = validPrizes[i].prize;
                    break;
                }
            }
            
            // Set each roller to show the prize pattern
            rollers.forEach(function (roller, index) {
                var contentEl = roller.querySelector('.roller-content');
                var images = contentEl.querySelectorAll('img');
                var targetItemName = selectedPrize.pattern[index];
                
                // If wildcard, pick a random item
                if (targetItemName === '*') {
                    targetItemName = baseItems[Math.floor(Math.random() * baseItems.length)].name;
                }
                
                // Find the target item
                var targetItem = baseItems.find(function (item) { return item.name === targetItemName; });
                
                if (targetItem) {
                    // Set the center item (index 2) to the target
                    images[2].src = targetItem.imageSrc;
                    images[2].alt = targetItem.name;
                }
            });
        }

        function rollAllRollers() {
            if (!rollButton || !rollersContainer || !baseItems || baseItems.length === 0) return;
            
            // Check pity system
            var pityEnabled = localStorage.getItem('settings_enable_pity_system') === 'true';
            var pityValue = parseInt(localStorage.getItem('slot_pity_value')) || 10;
            var spinsWithoutWin = parseInt(localStorage.getItem('slot_spins_without_win')) || 0;
            var forcePity = pityEnabled && spinsWithoutWin >= pityValue;
            
            // Disable button during roll
            rollButton.disabled = true;
            rollButton.textContent = 'ROLLING...';
            
            // Update Arduino instruction text
            if (arduinoInstruction && arduinoInstruction.style.display !== 'none') {
                arduinoInstruction.textContent = 'ROLLING...';
                arduinoInstruction.style.animation = 'none'; // Stop pulsing during roll
            }
            
            // Add rolling animation to all rollers
            var rollers = rollersContainer.querySelectorAll('.roller');
            rollers.forEach(function (roller) {
                roller.classList.add('rolling');
            });
            
            // Start with fast scrolling animation
            var animationSpeed = 0.03; // Start ultra fast (30ms)
            var startTime = Date.now();
            var totalDuration = 4000; // 4 seconds total
            
            rollers.forEach(function (roller) {
                var contentEl = roller.querySelector('.roller-content');
                contentEl.style.animation = 'continuousScroll ' + animationSpeed + 's linear infinite';
            });
            
            // Function to update items
            function updateItems() {
                rollers.forEach(function (roller) {
                    var contentEl = roller.querySelector('.roller-content');
                    var images = contentEl.querySelectorAll('img');
                    
                    // Shift all images up (move each image to the position above it)
                    for (var i = 0; i < images.length - 1; i++) {
                        images[i].src = images[i + 1].src;
                        images[i].alt = images[i + 1].alt;
                    }
                    
                    // Add new item at bottom (last position)
                    var newItem = getWeightedItem(baseItems);
                    if (newItem && images[images.length - 1]) {
                        images[images.length - 1].src = newItem.imageSrc;
                        images[images.length - 1].alt = newItem.name;
                    }
                });
            }
            
            // Gradually slow down the rolling
            function scheduleNextUpdate() {
                var elapsed = Date.now() - startTime;
                if (elapsed >= totalDuration) {
                    return; // Stop scheduling
                }
                
                // Calculate progress (0 to 1)
                var progress = elapsed / totalDuration;
                
                // Ease out: slow down over time
                // Speed goes from 30ms to 350ms
                var currentInterval = 30 + (320 * progress * progress);
                animationSpeed = currentInterval / 1000;
                
                // Update CSS animation speed
                rollers.forEach(function (roller) {
                    var contentEl = roller.querySelector('.roller-content');
                    contentEl.style.animation = 'continuousScroll ' + animationSpeed + 's linear infinite';
                });
                
                // Update items and schedule next update
                updateItems();
                setTimeout(scheduleNextUpdate, currentInterval);
            }
            
            // Start the rolling cycle
            scheduleNextUpdate();
            
            // After animation completes, update with final results
            setTimeout(function () {
                // If pity system is active, force a win
                if (forcePity) {
                    forcePityWin(rollers);
                }
                
                // Remove rolling animation and reset
                rollers.forEach(function (roller) {
                    roller.classList.remove('rolling');
                    var contentEl = roller.querySelector('.roller-content');
                    contentEl.style.animation = 'none';
                    contentEl.style.transform = 'translateY(0)';
                });
                
                // Just re-apply highlighting to existing items (don't regenerate)
                rollers.forEach(function (roller) {
                    var images = roller.querySelectorAll('img');
                    images.forEach(function (img, index) {
                        // Re-apply center highlighting to middle item
                        if (index === 2) {
                            img.className = 'center-item';
                        } else {
                            img.className = 'edge-item';
                        }
                    });
                });
                
                // Check if this was a win
                var winningPrize = checkForWin(rollers);
                
                if (winningPrize) {
                    // Reset counter
                    localStorage.setItem('slot_spins_without_win', '0');
                    
                    // Immediately refresh prizes display to show normal odds again
                    if (prizeListDisplay) {
                        loadAndDisplayPrizes();
                    }
                    
                    // Show win message
                    rollButton.textContent = 'YOU WON: ' + winningPrize.reward;
                    rollButton.style.background = 'linear-gradient(135deg, #10b981 0%, #14c794 100%)';
                    
                    // Update Arduino instruction for win
                    if (arduinoInstruction && arduinoInstruction.style.display !== 'none') {
                        arduinoInstruction.textContent = 'YOU WON: ' + winningPrize.reward;
                        arduinoInstruction.style.background = 'linear-gradient(135deg, #10b981 0%, #14c794 100%)';
                        arduinoInstruction.style.animation = 'none';
                    }
                    
                    // Send win result to Arduino
                    if (arduinoController && arduinoController.isConnected) {
                        arduinoController.sendResult(true, winningPrize.reward);
                    }
                    
                    setTimeout(function () {
                        rollButton.disabled = false;
                        rollButton.textContent = 'ROLL';
                        rollButton.style.background = '';
                        
                        // Restore Arduino instruction
                        if (arduinoInstruction && arduinoInstruction.style.display !== 'none') {
                            arduinoInstruction.textContent = 'Press the button to roll!';
                            arduinoInstruction.style.background = '';
                            arduinoInstruction.style.animation = 'pulse-glow 2s ease-in-out infinite';
                        }
                    }, 3000);
                } else {
                    // Increment counter
                    if (pityEnabled) {
                        spinsWithoutWin++;
                        localStorage.setItem('slot_spins_without_win', String(spinsWithoutWin));
                    }
                    
                    // Refresh prizes display to update pity status
                    if (prizeListDisplay) {
                        loadAndDisplayPrizes();
                    }
                    
                    // Send lose result to Arduino
                    if (arduinoController && arduinoController.isConnected) {
                        arduinoController.sendResult(false);
                    }
                    
                    // Re-enable button
                    rollButton.disabled = false;
                    rollButton.textContent = 'ROLL';
                    
                    // Restore Arduino instruction
                    if (arduinoInstruction && arduinoInstruction.style.display !== 'none') {
                        arduinoInstruction.textContent = 'Press the button to roll!';
                        arduinoInstruction.style.animation = 'pulse-glow 2s ease-in-out infinite';
                    }
                }
            }, 4000); // Match animation duration
        }

        function useItemsAndRender(items) {
            baseItems = items;
            var columns = rollerCount;
            renderRollers(columns, false);
        }

        function fetchItemsJson() {
            return fetch('slotitems/items.json', { cache: 'no-cache' })
                .then(function (r) { if (!r.ok) throw new Error('Failed to load items.json'); return r.json(); });
        }

        var draft = null;
        try { draft = localStorage.getItem('slot_items_draft'); } catch (e) { draft = null; }
        if (draft) {
            try {
                useItemsAndRender(JSON.parse(draft));
            } catch (e) {
                fetchItemsJson()
                    .then(function (data) { useItemsAndRender(data); })
                    .catch(function () { useItemsAndRender([]); });
            }
        } else {
            fetchItemsJson()
                .then(function (data) { useItemsAndRender(data); })
                .catch(function () { useItemsAndRender([]); });
        }

        // Add roll button event listener (always attach regardless of data source)
        if (rollButton) {
            rollButton.addEventListener('click', rollAllRollers);
        }
        
        // Set up Arduino callback to trigger roll
        if (arduinoController) {
            arduinoController.onRoll(function () {
                // Only trigger if button is enabled and rollers exist
                if (rollButton && !rollButton.disabled && baseItems && baseItems.length > 0) {
                    rollAllRollers();
                }
            });
        }
    }

    // ---- Prize List Display ----
    if (prizeListDisplay) {
        // Check settings for visibility
        var showPrizesList = localStorage.getItem('settings_show_prizes_list');
        var showOdds = localStorage.getItem('settings_show_odds');
        
        // Default to true if not set
        if (showPrizesList === null) {
            showPrizesList = 'true';
        }
        if (showOdds === null) {
            showOdds = 'true';
        }
        
        // Hide entire prizes sidebar if setting is off
        var prizesSidebar = document.querySelector('.prizes-sidebar');
        if (prizesSidebar) {
            prizesSidebar.style.display = showPrizesList === 'true' ? 'flex' : 'none';
        }
        
        // Only proceed if prizes list should be shown
        if (showPrizesList !== 'true') {
            return;
        }
        
        function calculatePrizeProbability(pattern, items) {
            // Load odds from localStorage
            var storedOdds = {};
            try {
                storedOdds = JSON.parse(localStorage.getItem('slot_odds') || '{}');
            } catch (e) {
                storedOdds = {};
            }
            
            // Calculate normalized odds (sum to 1)
            var totalWeight = 0;
            items.forEach(function (item) {
                totalWeight += storedOdds[item.name] || 1;
            });
            
            var normalizedOdds = {};
            items.forEach(function (item) {
                var weight = storedOdds[item.name] || 1;
                normalizedOdds[item.name] = weight / totalWeight;
            });
            
            // Calculate pattern probability (multiply probabilities for each position)
            var probability = 1;
            pattern.forEach(function (itemName) {
                if (itemName === '*') {
                    // Wildcard matches anything, probability is 1
                    probability *= 1;
                } else {
                    // Specific item probability
                    probability *= (normalizedOdds[itemName] || 0);
                }
            });
            
            return probability;
        }
        
        function formatProbability(probability) {
            var percentage = probability * 100;
            if (percentage >= 1) {
                return percentage.toFixed(2) + '%';
            } else if (percentage >= 0.01) {
                return percentage.toFixed(3) + '%';
            } else {
                return percentage.toExponential(2);
            }
        }
        
        function loadAndDisplayPrizes() {
            var prizes = [];
            var items = baseItems || [];
            var pityOdds = {};
            
            // Load prizes from localStorage
            try {
                var storedPrizes = localStorage.getItem('slot_prizes');
                if (storedPrizes) {
                    prizes = JSON.parse(storedPrizes);
                }
                var storedPityOdds = localStorage.getItem('slot_pity_odds');
                if (storedPityOdds) {
                    pityOdds = JSON.parse(storedPityOdds);
                }
            } catch (e) {
                prizes = [];
                pityOdds = {};
            }
            
            // Check if pity roll is upcoming (must match the trigger condition)
            var pityEnabled = localStorage.getItem('settings_enable_pity_system') === 'true';
            var pityValue = parseInt(localStorage.getItem('slot_pity_value')) || 10;
            var spinsWithoutWin = parseInt(localStorage.getItem('slot_spins_without_win')) || 0;
            var isPityRollNext = pityEnabled && spinsWithoutWin >= pityValue;
            
            // Get current roller count
            var currentRollerCount = parseInt(localStorage.getItem('slot_roller_count')) || 4;
            
            // Filter prizes to only show those matching the current roller count, with original indices
            var filteredPrizes = [];
            prizes.forEach(function (prize, index) {
                if (prize.pattern && prize.pattern.length === currentRollerCount) {
                    filteredPrizes.push({ prize: prize, originalIndex: index });
                }
            });
            
            // Clear the list
            prizeListDisplay.innerHTML = '';
            
            if (filteredPrizes.length === 0) {
                if (prizes.length > 0) {
                    prizeListDisplay.innerHTML = '<div class="prize-list-empty">No prizes match current roller count (' + currentRollerCount + ')</div>';
                } else {
                    prizeListDisplay.innerHTML = '<div class="prize-list-empty">No prizes configured</div>';
                }
                return;
            }
            
            // Calculate pity odds probabilities if pity roll is next
            var pityProbabilities = {};
            if (isPityRollNext) {
                var totalPityWeight = 0;
                filteredPrizes.forEach(function (item) {
                    totalPityWeight += pityOdds[item.originalIndex] || 1;
                });
                filteredPrizes.forEach(function (item) {
                    var weight = pityOdds[item.originalIndex] || 1;
                    pityProbabilities[item.originalIndex] = weight / totalPityWeight;
                });
            }
            
            // Show pity roll warning if applicable
            if (isPityRollNext) {
                var warningEl = document.createElement('div');
                warningEl.className = 'pity-roll-warning';
                warningEl.innerHTML = '<strong>Next roll is guaranteed win!</strong>';
                prizeListDisplay.appendChild(warningEl);
            }
            
            // Render each filtered prize
            filteredPrizes.forEach(function (item) {
                var prize = item.prize;
                var originalIndex = item.originalIndex;
                
                var prizeEl = document.createElement('div');
                prizeEl.className = 'prize-display-item';
                
                // Create pattern display
                var patternEl = document.createElement('div');
                patternEl.className = 'prize-pattern-mini';
                
                prize.pattern.forEach(function (itemName) {
                    var slotEl = document.createElement('div');
                    slotEl.className = 'pattern-mini-slot';
                    
                    if (itemName === '*') {
                        slotEl.innerHTML = '<div class="wildcard-icon">*</div>';
                    } else {
                        // Find the item to get its image
                        var itemObj = items.find(function (it) { return it.name === itemName; });
                        if (itemObj) {
                            slotEl.innerHTML = '<img src="' + itemObj.imageSrc + '" alt="' + itemObj.name + '" />';
                        } else {
                            slotEl.innerHTML = '<span style="font-size:10px;">' + itemName + '</span>';
                        }
                    }
                    
                    patternEl.appendChild(slotEl);
                });
                
                // Create reward text
                var rewardEl = document.createElement('div');
                rewardEl.className = 'prize-reward-text';
                rewardEl.textContent = prize.reward;
                
                prizeEl.appendChild(patternEl);
                prizeEl.appendChild(rewardEl);
                
                // Only add probability if setting is enabled
                if (showOdds === 'true') {
                    var probabilityEl = document.createElement('div');
                    probabilityEl.className = 'prize-probability-text';
                    
                    if (isPityRollNext) {
                        // Show pity roll probability (format same as editor)
                        var pityProb = pityProbabilities[originalIndex];
                        var pityPercentage = (pityProb * 100).toFixed(1) + '%';
                        probabilityEl.textContent = 'Pity Chance: ' + pityPercentage;
                        probabilityEl.style.color = '#059669';
                        probabilityEl.style.fontWeight = '700';
                    } else {
                        // Show normal probability
                        var probability = calculatePrizeProbability(prize.pattern, items);
                        probabilityEl.textContent = 'Chance: ' + formatProbability(probability);
                    }
                    
                    prizeEl.appendChild(probabilityEl);
                }
                
                prizeListDisplay.appendChild(prizeEl);
            });
        }
        
        // Load prizes after items are loaded
        setTimeout(function () {
            loadAndDisplayPrizes();
        }, 100);
    }
});
