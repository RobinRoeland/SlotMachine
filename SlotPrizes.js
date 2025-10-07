document.addEventListener('DOMContentLoaded', function () {
    var prizesList = document.getElementById('prizesList');
    var addPrizeBtn = document.getElementById('addPrize');
    var savePrizesBtn = document.getElementById('savePrizes');
    var prizesError = document.getElementById('prizesError');
    var unsavedIndicator = document.getElementById('unsavedIndicator');
    var modal = document.getElementById('prizeModal');
    var closeModalBtn = document.getElementById('closeModal');
    var cancelPrizeBtn = document.getElementById('cancelPrize');
    var confirmPrizeBtn = document.getElementById('confirmPrize');
    var patternSlots = document.getElementById('patternSlots');
    var itemsGrid = document.getElementById('itemsGrid');
    var prizeRewardInput = document.getElementById('prizeReward');
    var modalProbability = document.getElementById('modalProbability');
    
    var prizes = [];
    var savedPrizes = [];
    var items = [];
    var currentPattern = [];
    var pityOdds = {};
    var savedPityOdds = {};
    
    function showError(msg) {
        if (prizesError) prizesError.textContent = msg || '';
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
    
    function loadPrizes() {
        var stored = localStorage.getItem('slot_prizes');
        if (stored) {
            try {
                prizes = JSON.parse(stored);
                savedPrizes = JSON.parse(stored);
            } catch (e) {
                prizes = [];
                savedPrizes = [];
            }
        }
        
        // Load pity odds
        var storedPityOdds = localStorage.getItem('slot_pity_odds');
        if (storedPityOdds) {
            try {
                pityOdds = JSON.parse(storedPityOdds);
                savedPityOdds = JSON.parse(storedPityOdds);
            } catch (e) {
                pityOdds = {};
                savedPityOdds = {};
            }
        }
        
        // Initialize pity odds for prizes that don't have them
        prizes.forEach(function (prize, index) {
            if (pityOdds[index] === undefined) {
                pityOdds[index] = 1;
            }
        });
    }
    
    function checkForChanges() {
        var hasChanges = JSON.stringify(prizes) !== JSON.stringify(savedPrizes) ||
                         JSON.stringify(pityOdds) !== JSON.stringify(savedPityOdds);
        if (unsavedIndicator) {
            unsavedIndicator.style.display = hasChanges ? 'inline' : 'none';
        }
    }
    
    function normalizePityOdds() {
        var total = 0;
        prizes.forEach(function (prize, index) {
            var weight = pityOdds[index] || 1;
            total += weight;
        });
        
        var normalized = {};
        prizes.forEach(function (prize, index) {
            var weight = pityOdds[index] || 1;
            normalized[index] = weight / total;
        });
        return normalized;
    }
    
    function normalizePityOddsForGroup(prizeIndices) {
        var total = 0;
        prizeIndices.forEach(function (index) {
            var weight = pityOdds[index] || 1;
            total += weight;
        });
        
        var normalized = {};
        prizeIndices.forEach(function (index) {
            var weight = pityOdds[index] || 1;
            normalized[index] = weight / total;
        });
        return normalized;
    }
    
    function updateAllPityPercentages() {
        // Group prizes by roller count
        var groupedPrizes = {};
        prizes.forEach(function (prize, index) {
            var rollerCount = prize.pattern.length;
            if (!groupedPrizes[rollerCount]) {
                groupedPrizes[rollerCount] = [];
            }
            groupedPrizes[rollerCount].push(index);
        });
        
        // Normalize within each group
        Object.keys(groupedPrizes).forEach(function (rollerCount) {
            var prizeIndices = groupedPrizes[rollerCount];
            var normalized = normalizePityOddsForGroup(prizeIndices);
            
            // Update percentages for this group
            prizeIndices.forEach(function (prizeIndex) {
                var slider = prizesList.querySelector('.pity-odds-slider[data-index="' + prizeIndex + '"]');
                if (slider) {
                    var percentageEl = slider.parentElement.querySelector('.pity-percentage');
                    if (percentageEl) {
                        var percentage = (normalized[prizeIndex] * 100).toFixed(1);
                        percentageEl.textContent = percentage + '%';
                    }
                }
            });
        });
    }
    
    function renderPrizes() {
        if (!prizesList) return;
        
        prizesList.innerHTML = '';
        
        // Group prizes by roller count
        var groupedPrizes = {};
        prizes.forEach(function (prize, index) {
            var rollerCount = prize.pattern.length;
            if (!groupedPrizes[rollerCount]) {
                groupedPrizes[rollerCount] = [];
            }
            groupedPrizes[rollerCount].push({ prize: prize, index: index });
        });
        
        // Sort groups by roller count
        var sortedRollerCounts = Object.keys(groupedPrizes).sort(function (a, b) {
            return parseInt(a) - parseInt(b);
        });
        
        // Render each group
        sortedRollerCounts.forEach(function (rollerCount) {
            var group = groupedPrizes[rollerCount];
            var prizeIndices = group.map(function (item) { return item.index; });
            var normalized = normalizePityOddsForGroup(prizeIndices);
            
            // Create group container
            var groupContainer = document.createElement('div');
            groupContainer.className = 'prize-group';
            
            // Create group header
            var groupHeader = document.createElement('div');
            groupHeader.className = 'prize-group-header';
            groupHeader.innerHTML = `
                <h3>${rollerCount} Roller${parseInt(rollerCount) !== 1 ? 's' : ''}</h3>
                <span class="prize-count">${group.length} prize${group.length !== 1 ? 's' : ''}</span>
            `;
            groupContainer.appendChild(groupHeader);
            
            // Create group content
            var groupContent = document.createElement('div');
            groupContent.className = 'prize-group-content';
            
            group.forEach(function (item) {
                var prize = item.prize;
                var index = item.index;
                
                var prizeEl = document.createElement('div');
                prizeEl.className = 'prize-item';
                
                // Create pattern display with images
                var patternDisplay = document.createElement('div');
                patternDisplay.className = 'prize-pattern-display';
                
                prize.pattern.forEach(function (itemName) {
                    var slotEl = document.createElement('div');
                    slotEl.className = 'pattern-display-slot';
                    
                    if (itemName === '*') {
                        slotEl.innerHTML = '<div class="wildcard-icon">*</div>';
                    } else {
                        // Find the item to get its image
                        var itemObj = items.find(function (it) { return it.name === itemName; });
                        if (itemObj) {
                            slotEl.innerHTML = `<img src="${itemObj.imageSrc}" alt="${itemObj.name}" />`;
                        } else {
                            slotEl.innerHTML = `<span class="item-text">${itemName}</span>`;
                        }
                    }
                    
                    patternDisplay.appendChild(slotEl);
                });
                
                var rewardContainer = document.createElement('div');
                rewardContainer.className = 'prize-reward';
                rewardContainer.innerHTML = `
                    <span class="prize-reward-label">Prize:</span>
                    <input type="text" class="reward-input" data-index="${index}" 
                           value="${prize.reward}" 
                           placeholder="e.g., $100 or Free Spin" />
                `;
                
                // Calculate and display probability
                var probability = calculatePrizeProbability(prize.pattern, items);
                var probabilityText = formatProbability(probability);
                
                var probabilityContainer = document.createElement('div');
                probabilityContainer.className = 'prize-probability';
                probabilityContainer.innerHTML = `
                    <span class="prize-probability-label">Chance:</span>
                    <span class="prize-probability-value">${probabilityText}</span>
                `;
                
                // Pity odds slider
                var currentPityWeight = pityOdds[index] || 1;
                var pityPercentage = (normalized[index] * 100).toFixed(1);
                
                var pityOddsContainer = document.createElement('div');
                pityOddsContainer.className = 'prize-pity-odds';
                pityOddsContainer.innerHTML = `
                    <span class="pity-odds-label">Pity Roll Weight (in group):</span>
                    <input type="range" class="pity-odds-slider" min="0.1" max="10" step="0.1" 
                           value="${currentPityWeight}" data-index="${index}" />
                    <div class="pity-odds-value">${currentPityWeight}</div>
                    <div class="pity-percentage">${pityPercentage}%</div>
                `;
                
                var deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-prize';
                deleteBtn.dataset.index = index;
                deleteBtn.textContent = 'Delete';
                
                // Create top row with pattern and delete button
                var topRow = document.createElement('div');
                topRow.className = 'prize-item-top';
                topRow.appendChild(patternDisplay);
                topRow.appendChild(deleteBtn);
                
                // Create details section
                var detailsSection = document.createElement('div');
                detailsSection.className = 'prize-item-details';
                detailsSection.appendChild(rewardContainer);
                detailsSection.appendChild(probabilityContainer);
                detailsSection.appendChild(pityOddsContainer);
                
                prizeEl.appendChild(topRow);
                prizeEl.appendChild(detailsSection);
                
                groupContent.appendChild(prizeEl);
            });
            
            groupContainer.appendChild(groupContent);
            prizesList.appendChild(groupContainer);
        });
        
        // Add event listeners
        var rewardInputs = prizesList.querySelectorAll('.reward-input');
        rewardInputs.forEach(function (input) {
            input.addEventListener('input', function () {
                var index = parseInt(this.dataset.index);
                prizes[index].reward = this.value;
                checkForChanges();
            });
        });
        
        var deleteButtons = prizesList.querySelectorAll('.delete-prize');
        deleteButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var index = parseInt(this.dataset.index);
                prizes.splice(index, 1);
                
                // Rebuild pity odds without the deleted prize
                var newPityOdds = {};
                Object.keys(pityOdds).forEach(function (key) {
                    var keyIndex = parseInt(key);
                    if (keyIndex < index) {
                        newPityOdds[keyIndex] = pityOdds[keyIndex];
                    } else if (keyIndex > index) {
                        newPityOdds[keyIndex - 1] = pityOdds[keyIndex];
                    }
                });
                pityOdds = newPityOdds;
                
                renderPrizes();
                checkForChanges();
            });
        });
        
        // Add event listeners to pity odds sliders
        var pitySliders = prizesList.querySelectorAll('.pity-odds-slider');
        pitySliders.forEach(function (slider) {
            slider.addEventListener('input', function () {
                var prizeIndex = parseInt(this.dataset.index);
                var value = parseFloat(this.value);
                pityOdds[prizeIndex] = value;
                
                // Update display
                var valueEl = this.parentElement.querySelector('.pity-odds-value');
                valueEl.textContent = value;
                
                // Update all percentages
                updateAllPityPercentages();
                
                // Check for unsaved changes
                checkForChanges();
            });
        });
    }
    
    function openModal() {
        var rollerCount = parseInt(localStorage.getItem('slot_roller_count')) || 4;
        currentPattern = [];
        for (var i = 0; i < rollerCount; i++) {
            currentPattern.push(null);
        }
        
        renderPatternSlots();
        renderItemsGrid();
        prizeRewardInput.value = '';
        modal.classList.add('active');
    }
    
    function closeModal() {
        modal.classList.remove('active');
    }
    
    function updateModalProbability() {
        // Check if all slots are filled
        var allFilled = currentPattern.every(function (item) { return item !== null; });
        
        if (!allFilled || !modalProbability) {
            if (modalProbability) modalProbability.textContent = '--';
            return;
        }
        
        // Convert pattern to names
        var patternNames = currentPattern.map(function (item) {
            if (item === '*') return '*';
            if (item && item.name) return item.name;
            return '*';
        });
        
        // Calculate probability
        var probability = calculatePrizeProbability(patternNames, items);
        var probabilityText = formatProbability(probability);
        
        modalProbability.textContent = probabilityText;
    }
    
    function renderPatternSlots() {
        patternSlots.innerHTML = '';
        
        currentPattern.forEach(function (item, index) {
            var slotEl = document.createElement('div');
            slotEl.className = 'pattern-slot';
            slotEl.dataset.index = index;
            
            if (item) {
                slotEl.classList.add('filled');
                if (item === '*') {
                    slotEl.innerHTML = `
                        <div class="slot-number">${index + 1}</div>
                        <div class="wildcard-icon">*</div>
                        <button class="clear-slot">&times;</button>
                    `;
                } else {
                    slotEl.innerHTML = `
                        <div class="slot-number">${index + 1}</div>
                        <img src="${item.imageSrc}" alt="${item.name}" />
                        <button class="clear-slot">&times;</button>
                    `;
                }
            } else {
                slotEl.innerHTML = `
                    <div class="slot-number">${index + 1}</div>
                    <div class="placeholder-text">Drag<br/>item here</div>
                `;
            }
            
            // Drag and drop events
            slotEl.addEventListener('dragover', handleDragOver);
            slotEl.addEventListener('drop', handleDrop);
            slotEl.addEventListener('dragleave', handleDragLeave);
            
            // Clear button
            var clearBtn = slotEl.querySelector('.clear-slot');
            if (clearBtn) {
                clearBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    currentPattern[index] = null;
                    renderPatternSlots();
                    updateModalProbability();
                });
            }
            
            patternSlots.appendChild(slotEl);
        });
        
        // Update probability display
        updateModalProbability();
    }
    
    function renderItemsGrid() {
        itemsGrid.innerHTML = '';
        
        items.forEach(function (item) {
            var itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            itemCard.draggable = true;
            itemCard.dataset.itemName = item.name;
            itemCard.dataset.itemImage = item.imageSrc;
            
            itemCard.innerHTML = `
                <img src="${item.imageSrc}" alt="${item.name}" />
                <div class="item-name">${item.name}</div>
            `;
            
            itemCard.addEventListener('dragstart', handleDragStart);
            itemsGrid.appendChild(itemCard);
        });
    }
    
    function handleDragStart(e) {
        var itemName = this.dataset.itemName || this.dataset.item;
        var itemImage = this.dataset.itemImage;
        e.dataTransfer.setData('text/plain', JSON.stringify({
            name: itemName,
            imageSrc: itemImage
        }));
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    }
    
    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        var index = parseInt(this.dataset.index);
        var data = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        if (data.name === '*') {
            currentPattern[index] = '*';
        } else {
            currentPattern[index] = {
                name: data.name,
                imageSrc: data.imageSrc
            };
        }
        
        renderPatternSlots();
    }
    
    function confirmPrize() {
        var reward = prizeRewardInput.value.trim();
        if (!reward) {
            alert('Please enter a prize reward!');
            return;
        }
        
        // Convert pattern to array of names
        var patternNames = currentPattern.map(function (item) {
            if (item === '*') return '*';
            if (item && item.name) return item.name;
            return '*';
        });
        
        prizes.push({
            pattern: patternNames,
            reward: reward
        });
        
        // Initialize pity odds for new prize
        pityOdds[prizes.length - 1] = 1;
        
        renderPrizes();
        checkForChanges();
        closeModal();
    }
    
    function savePrizes() {
        try {
            localStorage.setItem('slot_prizes', JSON.stringify(prizes));
            localStorage.setItem('slot_pity_odds', JSON.stringify(pityOdds));
            savedPrizes = JSON.parse(JSON.stringify(prizes));
            savedPityOdds = JSON.parse(JSON.stringify(pityOdds));
            showError('');
            checkForChanges();
        } catch (err) {
            showError('Failed to save prizes: ' + err.message);
        }
    }
    
    // Set up wildcard drag
    var wildcardCard = document.querySelector('.wildcard-card');
    if (wildcardCard) {
        wildcardCard.addEventListener('dragstart', handleDragStart);
    }
    
    // Initialize
    loadItems().then(function () {
        loadPrizes();
        renderPrizes();
    });
    
    if (addPrizeBtn) {
        addPrizeBtn.addEventListener('click', openModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (cancelPrizeBtn) {
        cancelPrizeBtn.addEventListener('click', closeModal);
    }
    
    if (confirmPrizeBtn) {
        confirmPrizeBtn.addEventListener('click', confirmPrize);
    }
    
    if (savePrizesBtn) {
        savePrizesBtn.addEventListener('click', savePrizes);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
});
