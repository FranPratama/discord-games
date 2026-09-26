const DiscordGamesApp = (() => {
    const state = {
        allApps: [],
        currentFilteredApps: [],
        currentPage: 1,
        itemsPerPage: 100,
        isFetching: false
    };

    const DOM = {};

    const cacheDOM = () => {
        DOM.themeIcon = document.getElementById('themeIcon');
        DOM.themeToggleBtn = document.getElementById('themeToggleBtn');
        DOM.backToTopBtn = document.getElementById('backToTopBtn');
        DOM.searchInput = document.getElementById('searchInput');
        DOM.clearSearchBtn = document.getElementById('clearSearchBtn');
        DOM.themeSelect = document.getElementById('themeSelect');
        DOM.sortSelect = document.getElementById('sortSelect');
        DOM.apiVersionSelect = document.getElementById('apiVersionSelect');
        DOM.errorMsg = document.getElementById('errorMsg');
        DOM.syncIcon = document.getElementById('syncIcon');
        DOM.statusText = document.getElementById('statusText');
        DOM.successBanner = document.getElementById('successBanner');
        DOM.appList = document.getElementById('appList');
        DOM.countBadge = document.getElementById('countBadge');
    };

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    const toggleTheme = () => {
        const html = document.documentElement;
        if (!html.classList.contains('dark')) {
            html.classList.add('dark');
            if (DOM.themeIcon) DOM.themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            html.classList.remove('dark');
            if (DOM.themeIcon) DOM.themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleScroll = () => {
        if (DOM.backToTopBtn) {
            if (window.scrollY > 300) {
                DOM.backToTopBtn.classList.remove('translate-y-20', 'opacity-0');
            } else {
                DOM.backToTopBtn.classList.add('translate-y-20', 'opacity-0');
            }
        }

        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            if (state.currentPage * state.itemsPerPage < state.currentFilteredApps.length) {
                state.currentPage++;
                render(true);
            }
        }
    };

    const bindEvents = () => {
        if (DOM.themeToggleBtn) DOM.themeToggleBtn.addEventListener('click', toggleTheme);
        if (DOM.backToTopBtn) DOM.backToTopBtn.addEventListener('click', scrollToTop);
        
        window.addEventListener('scroll', handleScroll, { passive: true });

        if (DOM.searchInput) {
            const debouncedFilter = debounce(() => filter(true), 300);
            DOM.searchInput.addEventListener('keyup', (e) => {
                if (DOM.clearSearchBtn) {
                    if (e.target.value.trim() !== '') {
                        DOM.clearSearchBtn.classList.remove('hidden');
                    } else {
                        DOM.clearSearchBtn.classList.add('hidden');
                    }
                }
                debouncedFilter();
            });
        }

        if (DOM.clearSearchBtn && DOM.searchInput) {
            DOM.clearSearchBtn.addEventListener('click', () => {
                DOM.searchInput.value = '';
                DOM.clearSearchBtn.classList.add('hidden');
                filter(true);
            });
        }

        if (DOM.themeSelect) DOM.themeSelect.addEventListener('change', () => filter(true));
        if (DOM.sortSelect) DOM.sortSelect.addEventListener('change', () => filter(true));
        if (DOM.apiVersionSelect) DOM.apiVersionSelect.addEventListener('change', () => fetchData());
    };

    const populateThemeFilter = () => {
        const themeSet = new Set();
        state.allApps.forEach(app => {
            app.themesArray.forEach(t => themeSet.add(t));
        });

        const sortedThemes = Array.from(themeSet).sort();
        if (DOM.themeSelect) {
            DOM.themeSelect.innerHTML = '<option value="">All Themes</option>';
            sortedThemes.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.innerText = t;
                DOM.themeSelect.appendChild(opt);
            });
        }
    };

    const processData = (data) => {
        const rawApps = Array.isArray(data) ? data : (data.applications || []);
        state.allApps = rawApps.map(app => {
            let execString = "";
            let execsSearchStr = "";
            if (app.executables && app.executables.length > 0) {
                const names = app.executables.map(e => e.name).filter(n => n);
                execString = names.join(", ");
                execsSearchStr = names.join(" ").toLowerCase();
            } else if (app.launcher_name) {
                execString = app.launcher_name;
                execsSearchStr = app.launcher_name.toLowerCase();
            }

            let themes = [];
            if (app.themes && Array.isArray(app.themes)) themes = app.themes;
            else if (app.genres && Array.isArray(app.genres)) themes = app.genres.map(g => g.name || g);

            return {
                ...app,
                normalizedName: (app.name || "").toLowerCase(),
                execString: execString,
                execsSearchStr: execsSearchStr,
                themesArray: themes,
                themeString: themes.join(", ")
            };
        });

        populateThemeFilter();
        filter();
    };

    const render = (append = false) => {
        if (!DOM.appList) return;

        if (!append) {
            DOM.appList.innerHTML = '';
            if (state.currentFilteredApps.length === 0) {
                DOM.appList.innerHTML = '<div class="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in"><div class="w-20 h-20 mb-5 rounded-full bg-indigo-50 dark:bg-[#202225] flex items-center justify-center"><i class="fas fa-ghost text-3xl text-indigo-300 dark:text-gray-500"></i></div><h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No games found</h3><p class="text-sm text-gray-500">Try adjusting your search or theme filters.</p></div>';
                return;
            }
        }

        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        const appsToRender = state.currentFilteredApps.slice(startIndex, endIndex);
        const fragment = document.createDocumentFragment();

        appsToRender.forEach(app => {
            const name = app.name || "Unknown Game";
            const row = document.createElement('div');
            row.setAttribute('role', 'listitem');
            row.className = "group bg-white dark:bg-[#2f3136] border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-3 flex flex-col md:flex-row md:justify-between md:items-center gap-3 relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-[#5865F2]/10 dark:hover:shadow-[#5865F2]/5 hover:border-indigo-100 dark:hover:border-gray-700";
            
            const themeHtml = app.themeString ? `<div class="text-[0.65rem] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mt-2 flex flex-wrap gap-1.5"><span class="bg-gray-100 dark:bg-[#202225] px-2 py-1 rounded border border-gray-200 dark:border-gray-700">${app.themeString.split(', ').join('</span><span class="bg-gray-100 dark:bg-[#202225] px-2 py-1 rounded border border-gray-200 dark:border-gray-700">')}</span></div>` : '';

            row.innerHTML = `
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-[#5865F2] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                <div class="flex-shrink-0 md:w-5/12 pl-1">
                    <div class="font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#5865F2] transition-colors duration-200">${name}</div>
                    ${themeHtml}
                </div>
                <div class="flex-grow md:text-right overflow-hidden">
                    <span class="font-mono text-[0.8rem] leading-relaxed text-[#d63384] dark:text-[#f06292] break-all bg-pink-50 dark:bg-pink-900/10 px-2 py-1.5 rounded-md border border-pink-100 dark:border-pink-900/30">${app.execString}</span>
                </div>
            `;
            fragment.appendChild(row);
        });

        DOM.appList.appendChild(fragment);
    };

    const filter = (resetScroll = false) => {
        const query = DOM.searchInput ? DOM.searchInput.value.toLowerCase() : '';
        const sortOrder = DOM.sortSelect ? DOM.sortSelect.value : '';
        const themeFilter = DOM.themeSelect ? DOM.themeSelect.value : '';

        let filtered = state.allApps.filter(app => {
            const matchesSearch = app.normalizedName.includes(query) || app.execsSearchStr.includes(query);
            let matchesTheme = true;
            if (themeFilter) {
                matchesTheme = app.themesArray.includes(themeFilter);
            }
            return matchesSearch && matchesTheme;
        });

        if (sortOrder) {
            filtered.sort((a, b) => {
                if (sortOrder === 'asc') {
                    return a.normalizedName.localeCompare(b.normalizedName);
                } else {
                    return b.normalizedName.localeCompare(a.normalizedName);
                }
            });
        }

        state.currentFilteredApps = filtered;
        state.currentPage = 1;
        render(false);
        
        if (DOM.countBadge) {
            DOM.countBadge.innerText = `${filtered.length} items`;
        }

        if (resetScroll) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const fetchData = async () => {
        if (state.isFetching) return;
        state.isFetching = true;

        const version = DOM.apiVersionSelect ? DOM.apiVersionSelect.value : '6';
        const url = `https://discord.com/api/v${version}/applications/detectable`;

        if (DOM.errorMsg) DOM.errorMsg.classList.add('hidden');
        if (DOM.successBanner) DOM.successBanner.classList.add('hidden');
        if (DOM.syncIcon) DOM.syncIcon.classList.add('fa-spin');

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            
            processData(data);

            if (DOM.statusText) DOM.statusText.innerText = `Data loaded successfully from v${version}.`;
            if (DOM.successBanner) DOM.successBanner.classList.remove('hidden', 'opacity-0');

            setTimeout(() => {
                if (DOM.successBanner) {
                    DOM.successBanner.classList.add('opacity-0', 'transition-opacity', 'duration-1000', 'ease-out');
                    setTimeout(() => {
                        DOM.successBanner.classList.add('hidden');
                        DOM.successBanner.classList.remove('opacity-0', 'transition-opacity', 'duration-1000', 'ease-out');
                    }, 1000);
                }
            }, 2000);
        } catch (error) {
            if (DOM.appList && DOM.appList.innerHTML.includes('skeletonLoader')) {
                DOM.appList.innerHTML = '<div class="flex flex-col items-center justify-center py-16 px-4 text-center"><div class="w-16 h-16 mb-4 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center"><i class="fas fa-hourglass-half text-2xl text-gray-400 dark:text-gray-500"></i></div><span class="text-sm font-medium text-gray-500">Waiting for data...</span></div>';
            }
            if (DOM.errorMsg) {
                let msg = `Error: ${error.message}`;
                if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                    msg = `<strong>Connection Blocked (CORS)</strong><br> 
                           The browser blocked the request due to CORS policy. Ensure you are running this locally or via a proxy if needed.`;
                }
                DOM.errorMsg.innerHTML = msg;
                DOM.errorMsg.classList.remove('hidden');
            }
        } finally {
            if (DOM.syncIcon) DOM.syncIcon.classList.remove('fa-spin');
            state.isFetching = false;
        }
    };

    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            if (DOM.themeIcon) DOM.themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    };

    const init = () => {
        cacheDOM();
        initTheme();
        bindEvents();
        fetchData();
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', DiscordGamesApp.init);
