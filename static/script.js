document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('searchBar');
    const termsList = document.getElementById('termsList');
    const fontToggleButton = document.getElementById('fontToggleButton');
    const fontListContainer = document.getElementById('fontListContainer');
    const categoryButtonsContainer = document.getElementById('categoryButtonsContainer');
    const reportErrorButton = document.getElementById('reportError');
    const errorReportModal = document.getElementById('errorReportModal');
    const closeButton = document.querySelector('.close-button');
    const errorReportForm = document.getElementById('errorReportForm');
    const reportMessage = document.getElementById('reportMessage');

    let allTerms = [];
    
    // Define available fonts for dynamic loading
    const availableFonts = [
        { name: '致一宋体', fontFamily: 'ZhiYiSongTi' },
        { name: '狮尾锯齿黑体', fontFamily: 'SweiAliasSansCJKscRegular' },
        { name: '缝合像素字体 (10px)', fontFamily: 'FusionPixelProportionalSC10' },
        { name: '缝合像素字体 (12px)', fontFamily: 'FusionPixelProportionalSC12' },
        { name: '纳米全大宋B', fontFamily: 'NanoQyongDaSongB' }
    ];

    // Function to initialize font options
    function initializeFontOptions() {
        fontListContainer.innerHTML = ''; // Clear existing options
        availableFonts.forEach(font => {
            const fontOptionButton = document.createElement('button');
            fontOptionButton.textContent = font.name;
            fontOptionButton.className = 'font-option';
            fontOptionButton.dataset.font = font.fontFamily; // Use fontFamily for CSS
            fontListContainer.appendChild(fontOptionButton);
        });
    }

    // Call initializeFontOptions when the DOM is loaded
    initializeFontOptions();

    // Function to display terms based on search query and category
    function displayTerms(searchTerm = '', filterCategory = 'All') {
        termsList.innerHTML = ''; // Clear current terms
        let filteredTerms = allTerms.filter(term => {
            const matchesSearch = term.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  term.chinese.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  term.abbreviation.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'All' || term.category === filterCategory;
            return matchesSearch && matchesCategory;
        });

        if (filterCategory === 'All') {
            // Sort by English abbreviation/term for 'All' view
            filteredTerms.sort((a, b) => {
                const nameA = (a.english || a.abbreviation).toLowerCase();
                const nameB = (b.english || b.abbreviation).toLowerCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });

            filteredTerms.forEach(term => {
                const termItem = document.createElement('div');
                termItem.className = 'term-item';
                const abbreviationDisplay = term.abbreviation && term.abbreviation.toLowerCase() !== 'null' ? ` (${term.abbreviation})` : '';
                termItem.innerHTML = `
                    <h3>${term.english}${abbreviationDisplay}</h3>
                    <p>${term.chinese} ${term.category !== '分类进行中' ? `<span class="term-category-inline">(${term.category})</span>` : ''}</p>
                `;
                termsList.appendChild(termItem);
            });

        } else {
            // Group terms by category for specific category views
            const termsByCategory = {};
            filteredTerms.forEach(term => {
                if (!termsByCategory[term.category]) {
                    termsByCategory[term.category] = [];
                }
                termsByCategory[term.category].push(term);
            });

            for (const category in termsByCategory) {
                const categorySection = document.createElement('div');
                categorySection.className = 'category-section';

                const categoryTitle = document.createElement('h2');
                categoryTitle.textContent = category;
                categorySection.appendChild(categoryTitle);

                termsByCategory[category].forEach(term => {
                    const termItem = document.createElement('div');
                    termItem.className = 'term-item';
                    const abbreviationDisplay = term.abbreviation && term.abbreviation.toLowerCase() !== 'null' ? ` (${term.abbreviation})` : '';
                    termItem.innerHTML = `
                        <h3>${term.english}${abbreviationDisplay}</h3>
                        <p>${term.chinese}</p>
                    `;
                    categorySection.appendChild(termItem);
                });
                termsList.appendChild(categorySection);
            }
        }

        if (filteredTerms.length === 0) {
            termsList.innerHTML = '<p>没有找到相关术语。</p>';
        }
    }

    // Function to fetch terms from the backend
    async function fetchTerms() {
        try {
            const response = await fetch('/terms');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allTerms = await response.json();

            // Extract unique categories and create buttons
            const uniqueCategories = new Set(allTerms.map(term => term.category));
            // Define the desired order of categories
            const customCategoryOrder = [
                'All',
                '音频硬件 设备',
                '音频信号 参数',
                '音频效果 处理',
                '其他 通用术语',
                '分类进行中'
            ];

            // Filter and sort categories based on custom order
            const categories = customCategoryOrder.filter(cat => uniqueCategories.has(cat) || cat === 'All');
            // Add any remaining unique categories not in the custom order (though typically not needed if all are listed)
            uniqueCategories.forEach(cat => {
                if (!categories.includes(cat)) {
                    categories.push(cat);
                }
            });

            categoryButtonsContainer.innerHTML = ''; // Clear existing buttons
            categories.forEach(category => {
                const button = document.createElement('button');
                button.textContent = category;
                button.className = 'category-button';
                button.dataset.category = category;
                button.addEventListener('click', () => {
                    // Remove active class from all buttons
                    document.querySelectorAll('.category-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    // Add active class to the clicked button
                    button.classList.add('active');
                    displayTerms(searchBar.value, category);
                });
                categoryButtonsContainer.appendChild(button);
            });

            // Automatically click the 'All' button on initial load
            const allButton = categoryButtonsContainer.querySelector('[data-category="All"]');
            if (allButton) {
                allButton.click();
            } else {
                displayTerms(); // Display all if no 'All' button
            }

        } catch (error) {
            console.error('Error fetching terms:', error);
            termsList.innerHTML = '<p>加载术语失败。</p>';
        }
    }

    // Search functionality
    searchBar.addEventListener('input', () => {
        const activeCategoryButton = document.querySelector('.category-button.active');
        const currentCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'All';
        displayTerms(searchBar.value, currentCategory);
    });

    // Font switching functionality
    fontToggleButton.addEventListener('click', (event) => {
        // Stop propagation to prevent document click listener from closing it immediately
        event.stopPropagation(); 
        fontListContainer.style.display = fontListContainer.style.display === 'block' ? 'none' : 'block';
    });

    fontListContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('font-option')) {
            const selectedFont = event.target.dataset.font;
            document.body.style.fontFamily = `'${selectedFont}', sans-serif`;
            fontListContainer.style.display = 'none'; // Hide list after selection
        }
    });

    // Close font list if clicked outside
    document.addEventListener('click', (event) => {
        if (!fontListContainer.contains(event.target) && event.target !== fontToggleButton) {
            fontListContainer.style.display = 'none';
        }
    });

    // Set initial font (optional, will default to CSS if not set here)
    // document.body.style.fontFamily = `'ZhiYiSongTi', sans-serif`;

    // Report error button functionality
    reportErrorButton.addEventListener('click', () => {
        errorReportModal.style.display = 'block';
        reportMessage.textContent = ''; // Clear previous messages
        errorReportForm.reset(); // Clear form fields
    });

    closeButton.addEventListener('click', () => {
        errorReportModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === errorReportModal) {
            errorReportModal.style.display = 'none';
        }
    });

    errorReportForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(errorReportForm);
        const reportData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/report_error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });

            if (response.ok) {
                reportMessage.style.color = 'green';
                reportMessage.textContent = '报告已提交，感谢您的反馈！';
                // Optionally hide the modal after a few seconds
                setTimeout(() => {
                    errorReportModal.style.display = 'none';
                }, 3000);
            } else {
                const errorText = await response.text();
                reportMessage.style.color = 'red';
                reportMessage.textContent = `提交失败: ${errorText}`; 
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            reportMessage.style.color = 'red';
            reportMessage.textContent = '提交失败，请检查网络或稍后再试。';
        }
    });

    // Get the contact author button and modal elements
    const contactAuthorButton = document.getElementById('contactAuthorButton');
    const contactAuthorModal = document.getElementById('contactAuthorModal');
    const closeContactModal = document.getElementById('closeContactModal');

    // When the user clicks the contact author button, open the modal
    if (contactAuthorButton) {
        contactAuthorButton.onclick = function() {
            contactAuthorModal.style.display = "block";
        }
    }

    // When the user clicks on <span> (x), close the contact author modal
    if (closeContactModal) {
        closeContactModal.onclick = function() {
            contactAuthorModal.style.display = "none";
        }
    }

    // When the user clicks anywhere outside of the contact author modal, close it
    window.addEventListener('click', function(event) {
        if (event.target == contactAuthorModal) {
            contactAuthorModal.style.display = "none";
        }
    });

    // Initial fetch of terms
    fetchTerms();
}); 