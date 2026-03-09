    const DEFAULT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';

    let menuItems = [];
    let cart = [];
    let currentOrderId = null;
    let currentFilter = 'all';
    let restaurantName = 'Restaurant Menu';

    const CATEGORIES = [
        { id: 'Starters', name: '⭐ Starters' },
        { id: 'Main Course', name: '🍛 Main Course' },
        { id: 'Indian Breads', name: '🫓 Indian Breads' },
        { id: 'Rice', name: '🍚 Rice' },
        { id: 'Snacks', name: '🍟 Snacks' },
        { id: 'Desserts', name: '🍮 Desserts' },
        { id: 'Drinks', name: '🥤 Drinks' }
    ];

    function getCurrentRestaurantId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('restaurant') || localStorage.getItem('currentRestaurant') || '';
    }

    function getOrdersKey() {
        const restaurantId = getCurrentRestaurantId();
        return restaurantId ? ('orders_' + restaurantId) : 'spiceFusionOrders';
    }

    function normalizeMenuItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items
            .filter(item => !(item && item.name === 'asdfghjk' && Number(item.price) === 2345))
            .map(item => ({
                ...item,
                category: item.category || 'Main Course',
                type: item.type || 'veg',
                image: item.image || DEFAULT_IMAGE,
                available: typeof item.available === 'boolean' ? item.available : true
            }));
    }

    function loadRestaurantName() {
        const urlParams = new URLSearchParams(window.location.search);
        const restaurantId = urlParams.get('restaurant');
        
        if (restaurantId) {
            // Find owner data by searching through all owners
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('owner_')) {
                    const ownerData = JSON.parse(localStorage.getItem(key));
                    if (ownerData.restaurantId === restaurantId) {
                        restaurantName = ownerData.restaurantName;
                        break;
                    }
                }
            }
        }
        
        // Update menu page header
        const menuPageHeader = document.querySelector('#menuPage .logo h1');
        if (menuPageHeader) {
            menuPageHeader.textContent = '🍽️ ' + restaurantName;
        }
        
        // Update checkout page header
        const checkoutPageHeader = document.querySelector('#checkoutPage .logo h1');
        if (checkoutPageHeader) {
            checkoutPageHeader.textContent = '🍽️ ' + restaurantName;
        }
        
        // Update checkout subtitle
        const checkoutSubtitle = document.querySelector('#checkoutPage .logo p');
        if (checkoutSubtitle) {
            checkoutSubtitle.textContent = 'Complete your order';
        }
        
        // Update footers
        document.querySelectorAll('footer p:first-child').forEach(footer => {
            footer.textContent = '© 2025 ' + restaurantName + '. All rights reserved.';
        });
    }

    function loadMenuFromSystem() {
        const urlParams = new URLSearchParams(window.location.search);
        const restaurantId = urlParams.get('restaurant') || localStorage.getItem('currentRestaurant');
        const menuKey = restaurantId ? ('menu_' + restaurantId) : null;
        const savedMenu = menuKey ? localStorage.getItem(menuKey) : null;

        if (savedMenu) {
            try {
                menuItems = normalizeMenuItems(JSON.parse(savedMenu));
            } catch (error) {
                menuItems = normalizeMenuItems(typeof DEFAULT_MENU !== 'undefined' ? DEFAULT_MENU : []);
            }
        } else {
            menuItems = normalizeMenuItems(typeof DEFAULT_MENU !== 'undefined' ? DEFAULT_MENU : []);
        }
    }

    function loadCart() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
        updateCartCount();
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }

    function updateCartCount() {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cartCount').textContent = count;
    }

    function filterMenuGlobal(filter) {
        currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        displayMenu();
    }

    function displayMenu() {
        const container = document.getElementById('menuContainer');
        container.innerHTML = '';

        if (menuItems.length === 0) {
            container.innerHTML = '<div class="empty-cart"><h3>Menu is being updated</h3><p>Please check back soon!</p></div>';
            return;
        }

        let filteredItems = menuItems;
        if (currentFilter === 'veg') {
            filteredItems = menuItems.filter(item => item.type === 'veg');
        } else if (currentFilter === 'nonveg') {
            filteredItems = menuItems.filter(item => item.type === 'nonveg');
        }

        CATEGORIES.forEach(category => {
            const categoryItems = filteredItems.filter(item => 
                item.category === category.id && item.available
            );

            if (categoryItems.length > 0) {
                const categorySection = document.createElement('div');
                categorySection.className = 'category-section';
                
                categorySection.innerHTML = `
                    <h2 class="category-header">${category.name}</h2>
                    <div class="menu-grid">
                        ${categoryItems.map(item => `
                            <div class="menu-item ${!item.available ? 'unavailable' : ''}">
                                <div class="veg-indicator ${item.type}"></div>
                                <img src="${item.image || DEFAULT_IMAGE}" alt="${item.name}" class="menu-item-image" onerror="this.src='${DEFAULT_IMAGE}'">
                                <div class="menu-item-content">
                                    <h3 class="menu-item-name">${item.name}</h3>
                                    <p class="menu-item-description">${item.description || ''}</p>
                                    <div class="menu-item-footer">
                                        <span class="menu-item-price">₹${item.price}</span>
                                        <button class="add-to-cart-btn" 
                                                onclick="addToCart(${item.id})"
                                                ${!item.available ? 'disabled' : ''}>
                                            ${item.available ? 'Add to Cart' : 'Unavailable'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                container.appendChild(categorySection);
            }
        });

        if (container.innerHTML === '') {
            container.innerHTML = '<div class="empty-cart"><h3>No items found</h3><p>Try a different filter</p></div>';
        }
    }

    function addToCart(itemId) {
        const item = menuItems.find(i => i.id === itemId);
        
        if (!item) {
            showToast('Item not found! 😔', 'notification');
            return;
        }
        
        if (!item.available) {
            showToast('This item is currently unavailable! 😔', 'notification');
            return;
        }
        
        const existingItem = cart.find(i => i.id === itemId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image || DEFAULT_IMAGE,
                quantity: 1
            });
        }

        saveCart();
        showToast(`${item.name} added to cart! 🎉`);
    }

    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = type === 'notification' ? 'toast notification' : 'toast';
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function goToCheckout() {
        if (cart.length === 0) {
            showToast('Your cart is empty! Add some items first. 🛒');
            return;
        }
        document.getElementById('menuPage').style.display = 'none';
        document.getElementById('checkoutPage').style.display = 'block';
        
        loadRestaurantName();
        displayCart();
        updateSummary();
    }

    function goBackToMenu() {
        document.getElementById('checkoutPage').style.display = 'none';
        document.getElementById('menuPage').style.display = 'block';
        
        loadRestaurantName();
        loadMenuFromSystem();
        displayMenu();
    }

    function displayCart() {
        const cartContainer = document.getElementById('cartItems');
        
        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <h3>Your cart is empty!</h3>
                    <p>Add some delicious items from our menu</p>
                    <br>
                    <a onclick="goBackToMenu()" class="back-button">Browse Menu</a>
                </div>
            `;
            return;
        }

        cartContainer.innerHTML = '';
        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.image || DEFAULT_IMAGE}" alt="${item.name}" class="cart-item-image" onerror="this.src='${DEFAULT_IMAGE}'">
                <div class="cart-item-details">
                    <h3 class="cart-item-name">${item.name}</h3>
                    <p class="cart-item-price">₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}</p>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="decreaseQuantity(${index})">-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" onclick="increaseQuantity(${index})">+</button>
                        </div>
                        <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
                    </div>
                </div>
            `;
            cartContainer.appendChild(itemElement);
        });
    }

    function increaseQuantity(index) {
        cart[index].quantity++;
        saveCart();
        displayCart();
        updateSummary();
    }

    function decreaseQuantity(index) {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
            saveCart();
            displayCart();
            updateSummary();
        }
    }

    function removeItem(index) {
        cart.splice(index, 1);
        saveCart();
        displayCart();
        updateSummary();
    }

    function updateSummary() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.05;
        const total = subtotal + tax;

        document.getElementById('subtotal').textContent = `₹${subtotal}`;
        document.getElementById('tax').textContent = `₹${Math.round(tax)}`;
        document.getElementById('total').textContent = `₹${Math.round(total)}`;
    }

    function generateOrderId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `ORD${timestamp}${random}`;
    }

    function confirmOrder() {
        if (cart.length === 0) {
            showToast('Your cart is empty! Please add items first. 🛒');
            return;
        }

        const tableNumberInput = document.getElementById('tableNumber');
        const tableNumber = tableNumberInput.value.trim();

        if (tableNumber === '' || tableNumber === null) {
            showToast('⚠️ Please enter your table number!', 'notification');
            tableNumberInput.focus();
            return;
        }

        const tableNum = parseInt(tableNumber);
        
        if (isNaN(tableNum) || tableNum < 1 || tableNum > 10) {
            showToast('⚠️ Please enter a valid table number (1-10)!', 'notification');
            tableNumberInput.focus();
            return;
        }

        const orderId = generateOrderId();
        currentOrderId = orderId;
        
        const order = {
            id: orderId,
            tableNumber: tableNum,
            items: cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        const ordersKey = getOrdersKey();
        let orders = JSON.parse(localStorage.getItem(ordersKey) || localStorage.getItem('spiceFusionOrders') || '[]');
        orders.push(order);
        localStorage.setItem(ordersKey, JSON.stringify(orders));

        localStorage.removeItem('cart');
        cart = [];
        updateCartCount();

        tableNumberInput.value = '';

        document.getElementById('successModal').classList.add('show');
        
        startOrderTracking();
        
        showToast('✅ Order placed successfully!');
    }

    function startOrderTracking() {
        const checkInterval = setInterval(() => {
            checkForNotifications();
        }, 2000);

        setTimeout(() => {
            clearInterval(checkInterval);
        }, 1800000);
    }

    function checkForNotifications() {
        const notifications = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
        const unreadNotifications = notifications.filter(n => !n.read && n.orderId === currentOrderId);

        unreadNotifications.forEach(notification => {
            showToast(notification.message, 'notification');
            notification.read = true;
        });

        if (unreadNotifications.length > 0) {
            localStorage.setItem('customerNotifications', JSON.stringify(notifications));
        }
    }

    function goBackToMenuFromModal() {
        document.getElementById('successModal').classList.remove('show');
        currentOrderId = null;
        
        setTimeout(() => {
            document.getElementById('checkoutPage').style.display = 'none';
            document.getElementById('menuPage').style.display = 'block';
            
            loadRestaurantName();
            loadMenuFromSystem();
            displayMenu();
        }, 100);
    }

    function autoRefreshMenu() {
        setInterval(() => {
            const currentPage = document.getElementById('menuPage').style.display;
            if (currentPage !== 'none') {
                loadMenuFromSystem();
                displayMenu();
            }
        }, 5000);
    }

    document.addEventListener('DOMContentLoaded', function() {
        loadRestaurantName();
        loadCart();
        loadMenuFromSystem();
        displayMenu();
        autoRefreshMenu();
        checkForNotifications();
    });

