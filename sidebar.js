/**
 * Sidebar Component
 * Reusable sidebar that can be included on every page
 */

// Sidebar HTML template
const sidebarHTML = `
    <button id="toggleSidebar" aria-expanded="true" aria-controls="sidebar">Hide</button>
    <div class="sidebar" id="sidebar">
        <div class="header">
            <div class="logo-container">
                <img src="src/logo-alternatief.png" class="sidebar-logo" alt="Alternatief Logo">
            </div>
        </div>
        <nav class="nav">
            <a href="SlotMachine.html">Play</a>
            <a href="SlotEditor.html">Edit Items</a>
            <a href="SlotOdds.html">Edit Odds</a>
            <a href="SlotPrizes.html">Edit Prizes</a>
            <a href="SlotSettings.html">Settings</a>
        </nav>
    </div>
`;

/**
 * Initialize the sidebar component
 * Call this function when the page loads
 */
function initializeSidebar() {
    // Find the page container
    const pageContainer = document.querySelector('.page');
    
    if (pageContainer) {
        // Insert sidebar HTML at the beginning of the page container
        pageContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
        
        // Setup sidebar toggle functionality
        setupSidebarToggle();
        
        // Highlight current page in navigation
        highlightCurrentPage();
    }
}

/**
 * Setup sidebar toggle functionality with hover behavior
 */
function setupSidebarToggle() {
    const toggleButton = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const page = document.querySelector('.page');
    
    if (!toggleButton || !page) return;
    
    let collapseTimeout = null;
    let openTimeout = null;
    
    function setExpanded(expanded) {
        page.classList.toggle('sidebar-collapsed', !expanded);
        toggleButton.setAttribute('aria-expanded', String(expanded));
        toggleButton.textContent = expanded ? 'Hide' : 'Show';
    }
    
    function clearCollapseTimer() {
        if (collapseTimeout) {
            clearTimeout(collapseTimeout);
            collapseTimeout = null;
        }
    }
    
    function clearOpenTimer() {
        if (openTimeout) {
            clearTimeout(openTimeout);
            openTimeout = null;
        }
    }
    
    function scheduleExpand() {
        clearCollapseTimer();
        clearOpenTimer();
        openTimeout = setTimeout(() => {
            setExpanded(true);
        }, 250); // small delay so hover is perceptible
    }
    
    function scheduleCollapse() {
        clearCollapseTimer();
        clearOpenTimer();
        collapseTimeout = setTimeout(() => {
            setExpanded(false);
        }, 300);
    }
    
    // Hover behavior: expand on enter, collapse after leaving both button and sidebar
    toggleButton.addEventListener('mouseenter', scheduleExpand);
    toggleButton.addEventListener('mouseleave', scheduleCollapse);
    
    if (sidebar) {
        sidebar.addEventListener('mouseenter', () => {
            clearCollapseTimer();
            clearOpenTimer();
            setExpanded(true);
        });
        sidebar.addEventListener('mouseleave', scheduleCollapse);
    }
    
    // Initialize to collapsed state
    setExpanded(false);
}

/**
 * Highlight the current page in the navigation
 */
function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'SlotMachine.html';
    const navLinks = document.querySelectorAll('.nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.style.background = 'rgba(139, 124, 213, 0.3)';
            link.style.fontWeight = '600';
        }
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSidebar);
} else {
    // DOM is already ready
    initializeSidebar();
}

