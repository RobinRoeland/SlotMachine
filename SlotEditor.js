document.addEventListener('DOMContentLoaded', function () {
    var itemsJsonTextarea = document.getElementById('itemsJson');
    var applyItemsBtn = document.getElementById('applyItems');
    var loadItemsBtn = document.getElementById('loadItems');
    var exportItemsBtn = document.getElementById('exportItems');
    var dirtyIndicator = document.getElementById('dirtyIndicator');
    var addItemBtn = document.getElementById('addItemBtn');
    var addItemModal = document.getElementById('addItemModal');
    var confirmAddItem = document.getElementById('confirmAddItem');
    var cancelAddItem = document.getElementById('cancelAddItem');
    var newItemName = document.getElementById('newItemName');
    var newItemImage = document.getElementById('newItemImage');
    var addItemError = document.getElementById('addItemError');
    var itemsError = document.getElementById('itemsError');
    var rollerPreview = document.getElementById('rollerPreview');
    var itemsList = document.getElementById('itemsList');

    function setText(json) {
        if (itemsJsonTextarea) itemsJsonTextarea.value = json;
    }

    function showError(msg) {
        if (itemsError) itemsError.textContent = msg || '';
    }

    function toItems(json) {
        var parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
        return parsed.map(function (it) {
            if (typeof it === 'object' && it && ('imageSrc' in it || 'img' in it) && 'name' in it) {
                return { name: String(it.name), imageSrc: String(it.imageSrc || it.img) };
            }
            throw new Error('Each item needs name and imageSrc');
        });
    }

    function loadItemsFromPicker() {
        return (async function(){
            if (!('showOpenFilePicker' in window)) {
                throw new Error('File picker not supported; paste JSON manually.');
            }
            var handles = await window.showOpenFilePicker({
                types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
            });
            var file = await handles[0].getFile();
            var text = await file.text();
            return JSON.parse(text);
        })();
    }

    function saveDownload(jsonString) {
        var blob = new Blob([jsonString], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'items.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function saveFileSystem(jsonString) {
        if (!('showSaveFilePicker' in window)) {
            saveDownload(jsonString);
            return;
        }
        try {
            var handle = await window.showSaveFilePicker({
                suggestedName: 'items.json',
                types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
            });
            var writable = await handle.createWritable();
            await writable.write(jsonString);
            await writable.close();
        } catch (e) {
            // fallback to download if user cancels picker or on error
            saveDownload(jsonString);
        }
    }

    // Initialize - use draft in memory if available, otherwise prompt to load or start empty
    var draft = localStorage.getItem('slot_items_draft') || '[]';
    setText(draft);

    function isDirty() {
        try { return itemsJsonTextarea.value !== draft; } catch (e) { return false; }
    }

    function updateDirtyUI() {
        if (!applyItemsBtn) return;
        var dirty = isDirty();
        if (dirtyIndicator) dirtyIndicator.style.display = dirty ? 'inline' : 'none';
        applyItemsBtn.classList.toggle('apply-dirty', dirty);
    }

    function safeParseItems(text) {
        try { return JSON.parse(text || '[]'); } catch (e) { return []; }
    }

    function renderPreviews() {
        var items = safeParseItems(itemsJsonTextarea ? itemsJsonTextarea.value : '[]');
        if (rollerPreview) {
            rollerPreview.innerHTML = '';
            items.forEach(function (it) {
                var img = document.createElement('img');
                img.src = it.imageSrc;
                img.alt = it.name;
                img.draggable = false;
                img.style.width = '50%';
                img.style.alignSelf = 'center';
                rollerPreview.appendChild(img);
            });
        }
        if (itemsList) {
            itemsList.innerHTML = '';
            items.forEach(function (it) {
                var card = document.createElement('div');
                card.className = 'item-card';
                var img2 = document.createElement('img');
                img2.src = it.imageSrc;
                img2.alt = it.name;
                img2.draggable = false;
                var label = document.createElement('div');
                label.textContent = it.name;
                card.appendChild(img2);
                card.appendChild(label);
                itemsList.appendChild(card);
            });
        }
    }

    if (itemsJsonTextarea) {
        itemsJsonTextarea.addEventListener('input', function () { updateDirtyUI(); renderPreviews(); });
        itemsJsonTextarea.addEventListener('change', function () { updateDirtyUI(); renderPreviews(); });
    }
    updateDirtyUI();
    renderPreviews();

    if (applyItemsBtn && itemsJsonTextarea) {
        applyItemsBtn.addEventListener('click', function () {
            showError('');
            try {
                var items = toItems(itemsJsonTextarea.value);
                var jsonString = JSON.stringify(items, null, 2);
                // Save only to memory (local draft)
                localStorage.setItem('slot_items_draft', jsonString);
                draft = jsonString;
                updateDirtyUI();
            } catch (err) {
                showError(err.message || String(err));
            }
        });
    }

    // Manual load button: tries fetch first; if blocked, open file picker
    if (loadItemsBtn) {
        loadItemsBtn.addEventListener('click', async function () {
            showError('');
            try {
                var data = await loadItemsFromPicker();
                // validate and then set
                toItems(JSON.stringify(data));
                setText(JSON.stringify(data, null, 2));
                updateDirtyUI();
                renderPreviews();
            } catch (err) {
                showError(err.message || String(err));
            }
        });
    }

    // Export current JSON as a file
    if (exportItemsBtn && itemsJsonTextarea) {
        exportItemsBtn.addEventListener('click', function () {
            showError('');
            try {
                var items = toItems(itemsJsonTextarea.value);
                var jsonString = JSON.stringify(items, null, 2);
                // Download only when exporting
                var blob = new Blob([jsonString], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'items.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                showError(err.message || String(err));
            }
        });
    }

    // Open add item modal
    if (addItemBtn && addItemModal) {
        addItemBtn.addEventListener('click', function () {
            if (addItemError) addItemError.textContent = '';
            if (newItemName) newItemName.value = '';
            if (newItemImage) newItemImage.value = '';
            addItemModal.style.display = 'flex';
        });
    }

    // Close modal
    if (cancelAddItem && addItemModal) {
        cancelAddItem.addEventListener('click', function () {
            addItemModal.style.display = 'none';
        });
    }

    // Confirm add: require name and image, embed as data URL and append to JSON
    if (confirmAddItem && itemsJsonTextarea) {
        confirmAddItem.addEventListener('click', function () {
            if (addItemError) addItemError.textContent = '';
            var name = (newItemName && newItemName.value || '').trim();
            var file = newItemImage && newItemImage.files && newItemImage.files[0];
            if (!name) {
                if (addItemError) addItemError.textContent = 'Name is required';
                return;
            }
            if (!file) {
                if (addItemError) addItemError.textContent = 'Image is required';
                return;
            }
            var reader = new FileReader();
            reader.onload = function (e) {
                try {
                    var current = [];
                    try { current = JSON.parse(itemsJsonTextarea.value || '[]'); } catch (err) { current = []; }
                    current.push({ name: name, imageSrc: e.target.result });
                    itemsJsonTextarea.value = JSON.stringify(current, null, 2);
                    addItemModal.style.display = 'none';
                    updateDirtyUI();
                    renderPreviews();
                } catch (err) {
                    if (addItemError) addItemError.textContent = err.message || String(err);
                }
            };
            reader.readAsDataURL(file);
        });
    }
});


