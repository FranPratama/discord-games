let allApps = [];

document.addEventListener('DOMContentLoaded', () => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    const icon = document.getElementById('themeIcon');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        if (icon) icon.classList.replace('fa-moon', 'fa-sun');
    }

    fetchData();
    
    // Scroll to Top Listener
    window.addEventListener('scroll', () => {
        const btn = document.getElementById('backToTopBtn');
        if (window.scrollY > 300) {
            btn.classList.remove('translate-y-20', 'opacity-0');
        } else {
            btn.classList.add('translate-y-20', 'opacity-0');
        }
    });

    // Event Listeners replacing inline handlers
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) backToTopBtn.addEventListener('click', scrollToTop);
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Apply debounce with 300ms delay
        const debouncedFilter = debounce(filterApps, 300);
        searchInput.addEventListener('keyup', debouncedFilter);
    }

    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) themeSelect.addEventListener('change', filterApps);

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', filterApps);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

    const apiVersionSelect = document.getElementById('apiVersionSelect');
    if (apiVersionSelect) apiVersionSelect.addEventListener('change', () => fetchData());
});

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');
    if (!html.classList.contains('dark')) {
        html.classList.add('dark');
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        html.classList.remove('dark');
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
}



async function fetchData() {
    const versionSelect = document.getElementById('apiVersionSelect');
    const version = versionSelect ? versionSelect.value : '6';
    const url = `https://discord.com/api/v${version}/applications/detectable`;
    const errorDiv = document.getElementById('errorMsg');
    const syncIcon = document.getElementById('syncIcon');
    const statusText = document.getElementById('statusText');
    const listContainer = document.getElementById('appList');
    const successBanner = document.getElementById('successBanner');

    errorDiv.classList.add('hidden');
    successBanner.classList.add('hidden');
    
    if (syncIcon) {
        syncIcon.classList.add('fa-spin');
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        handleDataSuccess(data);
        
        if (statusText) statusText.innerText = `Data loaded successfully from v${version}.`;
        successBanner.classList.remove('hidden', 'opacity-0');
        
        setTimeout(() => {
            successBanner.classList.add('opacity-0', 'transition-opacity', 'duration-1000', 'ease-out');
            setTimeout(() => {
                successBanner.classList.add('hidden');
                successBanner.classList.remove('opacity-0', 'transition-opacity', 'duration-1000', 'ease-out');
            }, 1000);
        }, 5000);

    } catch (error) {
        console.error(error);
        
        if(listContainer.innerHTML.includes('Loading')) {
            listContainer.innerHTML = '<div class="flex flex-col items-center justify-center py-16 px-4 text-center"><div class="w-16 h-16 mb-4 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center"><i class="fas fa-hourglass-half text-2xl text-gray-400 dark:text-gray-500"></i></div><span class="text-sm font-medium text-gray-500">Waiting for data...</span></div>';
        }

        let msg = `Error: ${error.message}`;
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            msg = `<strong>Connection Blocked (CORS)</strong><br> 
                   The browser blocked the request due to CORS policy. Ensure you are running this locally or via a proxy if needed.`;
        }
        
        errorDiv.innerHTML = msg;
        errorDiv.classList.remove('hidden');
    } finally {
        if (syncIcon) {
            syncIcon.classList.remove('fa-spin');
        }
    }
}

function handleDataSuccess(data) {
    allApps = Array.isArray(data) ? data : (data.applications || []);
    
    // 1. Extract themes and populate dropdown
    populateThemeFilter(allApps);

    // 2. Render
    filterApps(); 
}

function populateThemeFilter(apps) {
    const themeSet = new Set();
    
    apps.forEach(app => {
        let themes = [];
        if (app.themes && Array.isArray(app.themes)) themes = app.themes;
        else if (app.genres && Array.isArray(app.genres)) themes = app.genres.map(g => g.name || g);
        
        themes.forEach(t => themeSet.add(t));
    });

    const sortedThemes = Array.from(themeSet).sort();
    const select = document.getElementById('themeSelect');
    
    // Clear existing except first
    select.innerHTML = '<option value="">All Themes</option>';
    
    sortedThemes.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.innerText = t;
        select.appendChild(opt);
    });
}

function renderApps(apps) {
    const listContainer = document.getElementById('appList');
    listContainer.innerHTML = '';

    if (apps.length === 0) {
        listContainer.innerHTML = '<div class="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in"><div class="w-20 h-20 mb-5 rounded-full bg-indigo-50 dark:bg-[#202225] flex items-center justify-center"><i class="fas fa-ghost text-3xl text-indigo-300 dark:text-gray-500"></i></div><h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No games found</h3><p class="text-sm text-gray-500">Try adjusting your search or theme filters.</p></div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    apps.forEach(app => {
        const name = app.name || "Unknown Game";

        // Executables Logic
        let execString = "";
        if (app.executables && app.executables.length > 0) {
            const names = app.executables.map(e => e.name).filter(n => n);
            execString = names.join(", ");
        } else if (app.launcher_name) {
            execString = app.launcher_name;
        }

        // Themes Logic
        let themes = "";
        if (app.themes && Array.isArray(app.themes)) themes = app.themes.join(", ");
        else if (app.genres && Array.isArray(app.genres)) themes = app.genres.map(g => g.name || g).join(", ");

        // Create Row
        const row = document.createElement('div');
        row.className = "group bg-white dark:bg-[#2f3136] border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-3 flex flex-col md:flex-row md:justify-between md:items-center gap-3 relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-[#5865F2]/10 dark:hover:shadow-[#5865F2]/5 hover:border-indigo-100 dark:hover:border-gray-700";

        const themeHtml = themes ? `<div class="text-[0.65rem] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mt-2 flex flex-wrap gap-1.5"><span class="bg-gray-100 dark:bg-[#202225] px-2 py-1 rounded border border-gray-200 dark:border-gray-700">${themes.split(', ').join('</span><span class="bg-gray-100 dark:bg-[#202225] px-2 py-1 rounded border border-gray-200 dark:border-gray-700">')}</span></div>` : '';
        
        row.innerHTML = `
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-[#5865F2] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            <div class="flex-shrink-0 md:w-5/12 pl-1">
                <div class="font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#5865F2] transition-colors duration-200">${name}</div>
                ${themeHtml}
            </div>
            <div class="flex-grow md:text-right overflow-hidden">
                <span class="font-mono text-[0.8rem] leading-relaxed text-[#d63384] dark:text-[#f06292] break-all bg-pink-50 dark:bg-pink-900/10 px-2 py-1.5 rounded-md border border-pink-100 dark:border-pink-900/30">${execString}</span>
            </div>
        `;

        fragment.appendChild(row);
    });

    listContainer.appendChild(fragment);
}

function filterApps() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const sortOrder = document.getElementById('sortSelect').value;
    const themeFilter = document.getElementById('themeSelect').value;

    // 1. Filter
    let filtered = allApps.filter(app => {
        const name = (app.name || "").toLowerCase();
        let execs = "";
        if(app.executables) execs = app.executables.map(e => e.name).join(" ").toLowerCase();
        
        // Search check
        const matchesSearch = name.includes(query) || execs.includes(query);
        
        // Theme check
        let matchesTheme = true;
        if(themeFilter) {
            let themes = [];
            if (app.themes && Array.isArray(app.themes)) themes = app.themes;
            else if (app.genres && Array.isArray(app.genres)) themes = app.genres.map(g => g.name || g);
            matchesTheme = themes.includes(themeFilter);
        }

        return matchesSearch && matchesTheme;
    });

    // 2. Sort (Conditional)
    if (sortOrder) {
        filtered.sort((a, b) => {
            const nameA = (a.name || "").toLowerCase();
            const nameB = (b.name || "").toLowerCase();
            
            if (sortOrder === 'asc') {
                return nameA.localeCompare(nameB);
            } else {
                return nameB.localeCompare(nameA);
            }
        });
    }

    // 3. Render
    renderApps(filtered);
    document.getElementById('countBadge').innerText = `${filtered.length} items`;
}

// Utility: Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
