const DEFAULT_DATASET = 'data_drinks.json';

const tableState = {
    allRows: [],
    filteredRows: [],
    currentPage: 1,
    pageSize: 100,
    sortKey: 'Discount',
    sortDirection: 'desc',
    searchTerm: '',
};

const columns = [
    { key: 'Category', label: 'Category' },
    { key: 'Product', label: 'Product' },
    { key: 'Image', label: 'Image' },
    { key: 'NormalPrice', label: 'Normal Price' },
    { key: 'Discount', label: 'Discount' },
    { key: 'ActualPrice', label: 'Actual Price' },
    { key: 'Savings', label: 'Savings' },
];

function cacheBustedUrl(file) {
    return `./${file}?v=${Date.now()}`;
}

function readLastUpdatedTextFile(file) {
    fetch(cacheBustedUrl(file), { cache: 'no-store' })
        .then((response) => response.text())
        .then((text) => {
            const target = document.getElementById('lastUpdated');
            target.textContent = `Last updated: ${text}`;
        });
}

function parseNumber(value) {
    if (typeof value === 'number') {
        return value;
    }

    if (!value) {
        return Number.NEGATIVE_INFINITY;
    }

    const normalized = String(value)
        .replace(/,/g, '')
        .replace(/\$/g, '')
        .replace(/%/g, '')
        .trim();

    const matched = normalized.match(/-?\d+(\.\d+)?/);
    return matched ? Number(matched[0]) : Number.NEGATIVE_INFINITY;
}

function stripHtml(value) {
    return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function toSlug(value) {
    return stripHtml(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function valueForCompare(row, key) {
    const raw = row[key] ?? '';
    const numeric = parseNumber(raw);
    if (!Number.isNaN(numeric) && numeric !== Number.NEGATIVE_INFINITY) {
        return numeric;
    }
    return String(raw).toLowerCase();
}

function setActiveLink(activeLinkId) {
    const drinksLink = document.getElementById('drinksLink');
    const allItemsLink = document.getElementById('allItemsLink');

    drinksLink.classList.toggle('is-active', activeLinkId === 'drinksLink');
    allItemsLink.classList.toggle('is-active', activeLinkId === 'allItemsLink');
}

function updateSortIndicators() {
    const headers = document.querySelectorAll('#display_json_data thead th');

    headers.forEach((header) => {
        const key = header.dataset.key;
        if (!key) {
            return;
        }

        header.classList.toggle('is-sort-active', key === tableState.sortKey);
        header.classList.toggle('is-sort-desc', key === tableState.sortKey && tableState.sortDirection === 'desc');
        header.classList.toggle('is-sort-asc', key === tableState.sortKey && tableState.sortDirection === 'asc');
    });
}

function applyFiltersAndSorting() {
    const search = tableState.searchTerm.trim().toLowerCase();

    tableState.filteredRows = tableState.allRows.filter((row) => {
        if (!search) {
            return true;
        }

        return columns.some((column) => {
            const value = row[column.key] ?? '';
            return String(value).toLowerCase().includes(search);
        });
    });

    tableState.filteredRows.sort((left, right) => {
        const leftValue = valueForCompare(left, tableState.sortKey);
        const rightValue = valueForCompare(right, tableState.sortKey);

        if (leftValue < rightValue) {
            return tableState.sortDirection === 'asc' ? -1 : 1;
        }

        if (leftValue > rightValue) {
            return tableState.sortDirection === 'asc' ? 1 : -1;
        }

        return 0;
    });
}

function renderTableBody() {
    const tbody = document.querySelector('#display_json_data tbody');
    const pageStart = (tableState.currentPage - 1) * tableState.pageSize;
    const pageEnd = pageStart + tableState.pageSize;
    const currentRows = tableState.filteredRows.slice(pageStart, pageEnd);

    if (!currentRows.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-row">No matching offers found.</td></tr>`;
        return;
    }

    const rowsHtml = currentRows
        .map((row, rowIndex) => {
            const absoluteIndex = pageStart + rowIndex + 1;
            const categoryText = stripHtml(row.Category ?? '');
            const productText = stripHtml(row.Product ?? '');
            const categorySlug = toSlug(row.Category ?? '');
            const productSlug = toSlug(row.Product ?? '');

            const cells = columns
                .map((column) => `<td class="offer-cell offer-cell-${column.key}">${row[column.key] ?? ''}</td>`)
                .join('');

            return `<tr class="offer-row" data-row-index="${absoluteIndex}" data-category="${escapeAttribute(categoryText)}" data-product="${escapeAttribute(productText)}" data-category-slug="${escapeAttribute(categorySlug)}" data-product-slug="${escapeAttribute(productSlug)}">${cells}</tr>`;
        })
        .join('');

    tbody.innerHTML = rowsHtml;
}

function renderMeta() {
    const totalRows = tableState.filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / tableState.pageSize));
    const currentPage = Math.min(tableState.currentPage, totalPages);
    tableState.currentPage = currentPage;

    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * tableState.pageSize + 1;
    const endIndex = Math.min(currentPage * tableState.pageSize, totalRows);

    const info = document.getElementById('tableInfo');
    const pageStatus = document.getElementById('pageStatus');
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');

    info.textContent = `${startIndex}-${endIndex} of ${totalRows} items`;
    pageStatus.textContent = `Page ${currentPage} of ${totalPages}`;

    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
}

function renderTable() {
    updateSortIndicators();
    renderMeta();
    renderTableBody();
}

function refreshTable(resetPage = false) {
    applyFiltersAndSorting();
    if (resetPage) {
        tableState.currentPage = 1;
    }
    renderTable();
}

function loadDataset(file) {
    return fetch(cacheBustedUrl(file), { cache: 'no-store' })
        .then((response) => response.json())
        .then((rows) => {
            tableState.allRows = Array.isArray(rows) ? rows : [];
            refreshTable(true);
        });
}

function setupControls() {
    const searchInput = document.getElementById('tableSearch');
    const pageSizeSelect = document.getElementById('pageSize');
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const headers = document.querySelectorAll('#display_json_data thead th');
    const allItemsLink = document.getElementById('allItemsLink');
    const drinksLink = document.getElementById('drinksLink');

    searchInput.addEventListener('input', (event) => {
        tableState.searchTerm = event.target.value;
        refreshTable(true);
    });

    pageSizeSelect.addEventListener('change', (event) => {
        tableState.pageSize = Number(event.target.value);
        refreshTable(true);
    });

    prevButton.addEventListener('click', () => {
        tableState.currentPage = Math.max(1, tableState.currentPage - 1);
        renderTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    nextButton.addEventListener('click', () => {
        const maxPage = Math.max(1, Math.ceil(tableState.filteredRows.length / tableState.pageSize));
        tableState.currentPage = Math.min(maxPage, tableState.currentPage + 1);
        renderTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    headers.forEach((header) => {
        const key = header.dataset.key;
        if (!key) {
            return;
        }

        header.classList.add('is-sortable');
        header.addEventListener('click', () => {
            if (tableState.sortKey === key) {
                tableState.sortDirection = tableState.sortDirection === 'asc' ? 'desc' : 'asc';
            }
            else {
                tableState.sortKey = key;
                tableState.sortDirection = key === 'Discount' ? 'desc' : 'asc';
            }

            refreshTable(true);
        });
    });

    allItemsLink.addEventListener('click', (event) => {
        event.preventDefault();
        setActiveLink('allItemsLink');
        loadDataset('data_general.json');
    });

    drinksLink.addEventListener('click', (event) => {
        event.preventDefault();
        setActiveLink('drinksLink');
        loadDataset('data_drinks.json');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    readLastUpdatedTextFile('lastupdate.txt');
    setupControls();
    loadDataset(DEFAULT_DATASET);
});