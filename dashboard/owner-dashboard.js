        let currentOwnerId = null;
        let currentRestaurantId = null;
        let menuItems = [];
        let orders = [];
        let tables = [];
        let payments = {};
        let changingImageItemId = null;
        let pendingSignupData = null;
        let pendingLoginOwner = null;
        let pendingResetOwnerId = null;
        let pendingResetEmail = null;
        const CODE_EXPIRY_MS = 5 * 60 * 1000;
        const AUTH_PANEL_IDS = [
            'signupForm',
            'signupVerificationForm',
            'loginForm',
            'loginVerificationForm',
            'forgotPasswordForm',
            'resetVerificationForm',
            'resetPasswordForm'
        ];

        for (let i = 1; i <= 10; i++) {
            tables.push({ number: i, status: 'free' });
        }

        const DEFAULT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

        const COUNTRY_PHONE_DATA = [
            { flag: '????', name: 'India', code: '+91' },
            { flag: '????', name: 'United States', code: '+1' },
            { flag: '????', name: 'United Kingdom', code: '+44' },
            { flag: '????', name: 'United Arab Emirates', code: '+971' },
            { flag: '????', name: 'Canada', code: '+1' },
            { flag: '????', name: 'Australia', code: '+61' },
            { flag: '????', name: 'Singapore', code: '+65' },
            { flag: '????', name: 'Germany', code: '+49' },
            { flag: '????', name: 'France', code: '+33' },
            { flag: '????', name: 'Japan', code: '+81' }
        ];

        /**
         * Shows the s ig nu p and keeps related UI panels in sync.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function showSignup() {
            clearSignupVerificationCode();
            pendingSignupData = null;
            showAuthPanel('signupForm');
            clearAllAuthMessages();
        }

        /**
         * Shows the l og in and keeps related UI panels in sync.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function showLogin() {
            clearLoginVerificationCode();
            pendingLoginOwner = null;
            clearResetVerificationCode();
            pendingResetOwnerId = null;
            pendingResetEmail = null;
            showAuthPanel('loginForm');
            clearAllAuthMessages();
        }

        /**
         * Shows the f or go tp as sw or d and keeps related UI panels in sync.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function showForgotPassword() {
            clearResetVerificationCode();
            pendingResetOwnerId = null;
            pendingResetEmail = null;
            showAuthPanel('forgotPasswordForm');
            clearAllAuthMessages();
        }

        /**
         * Shows the a ut hp an el and keeps related UI panels in sync.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function showAuthPanel(panelId) {
            AUTH_PANEL_IDS.forEach(id => {
                const panel = document.getElementById(id);
                if (panel) {
                    panel.style.display = id === panelId ? 'block' : 'none';
                }
            });
        }

        /**
         * Clears the a ll au th me ss ag es to avoid stale authentication or workflow data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function clearAllAuthMessages() {
            [
                'signupError',
                'signupVerificationError',
                'loginError',
                'loginVerificationError',
                'forgotPasswordError',
                'resetVerificationError',
                'resetPasswordError'
            ].forEach(clearError);

            [
                'signupCodeInfo',
                'loginCodeInfo',
                'resetCodeInfo'
            ].forEach(clearInfo);
        }

        /**
         * Shows the i nf o and keeps related UI panels in sync.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function showInfo(elementId, message) {
            const infoDiv = document.getElementById(elementId);
            if (!infoDiv) return;
            infoDiv.textContent = message;
            infoDiv.classList.add('show');
        }

        /**
         * Clears the i nf o to avoid stale authentication or workflow data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function clearInfo(elementId) {
            const infoDiv = document.getElementById(elementId);
            if (!infoDiv) return;
            infoDiv.textContent = '';
            infoDiv.classList.remove('show');
        }

        /**
         * Generates the v er if ic at io nc od e using deterministic and runtime values.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function generateVerificationCode() {
            return String(Math.floor(100000 + Math.random() * 900000));
        }

        /**
         * Manages the s et co de wi th ex pi ry as part of the Smart Restaurant workflow.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function setCodeWithExpiry(codeKey, expiryKey, codeValue) {
            localStorage.setItem(codeKey, codeValue);
            localStorage.setItem(expiryKey, String(Date.now() + CODE_EXPIRY_MS));
        }

        /**
         * Returns whether the c od ev al id satisfies required validation rules.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function isCodeValid(codeKey, expiryKey, enteredCode) {
            const storedCode = localStorage.getItem(codeKey);
            const expiry = Number(localStorage.getItem(expiryKey));

            if (!storedCode || !expiry || Number.isNaN(expiry)) {
                return { ok: false, reason: 'Code not found. Please request a new code.' };
            }

            if (Date.now() >= expiry) {
                return { ok: false, reason: 'Code expired. Please request a new code.' };
            }

            if (String(enteredCode) !== String(storedCode)) {
                return { ok: false, reason: 'Incorrect code. Please try again.' };
            }

            return { ok: true, reason: '' };
        }

        /**
         * Clears the s to re dc od e to avoid stale authentication or workflow data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function clearStoredCode(codeKey, expiryKey) {
            localStorage.removeItem(codeKey);
            localStorage.removeItem(expiryKey);
        }

        /**
         * Retrieves the s ig nu pc od ek ey for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getSignupCodeKey(email) {
            return 'verificationCode_' + email;
        }

        /**
         * Retrieves the s ig nu pe xp ir yk ey for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getSignupExpiryKey(email) {
            return 'verificationExpiry_' + email;
        }

        /**
         * Clears the s ig nu pv er if ic at io nc od e to avoid stale authentication or workflow data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function clearSignupVerificationCode(emailValue) {
            const email = String(emailValue || (pendingSignupData && pendingSignupData.email) || '').trim().toLowerCase();
            if (!email) return;
            clearStoredCode(getSignupCodeKey(email), getSignupExpiryKey(email));
        }

        /**
         * Retrieves the l og in co de ke y for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getLoginCodeKey(ownerId) {
            return 'loginCode_' + ownerId;
        }

        /**
         * Retrieves the l og in ex pi ry ke y for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getLoginExpiryKey(ownerId) {
            return 'loginCodeExpiry_' + ownerId;
        }

        /**
         * Clears the l og in ve ri fi ca ti on co de to avoid stale authentication or workflow data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function clearLoginVerificationCode(ownerIdValue) {
            const ownerId = String(ownerIdValue || (pendingLoginOwner && pendingLoginOwner.ownerId) || '').trim();
            if (!ownerId) return;
            clearStoredCode(getLoginCodeKey(ownerId), getLoginExpiryKey(ownerId));
        }

        /**
         * Retrieves the r es et co de ke y for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getResetCodeKey(email) {
            return 'resetCode_' + email;
        }

        /**
         * Retrieves the r es et ex pi ry ke y for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getResetExpiryKey(email) {
            return 'resetExpiry_' + email;
        }

        /**
         * Clears the r es et ve ri fi ca ti on co de to avoid stale authentication or workflow data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function clearResetVerificationCode(emailValue) {
            const email = String(emailValue || pendingResetEmail || '').trim().toLowerCase();
            if (!email) return;
            clearStoredCode(getResetCodeKey(email), getResetExpiryKey(email));
        }

        /**
         * Manages the s en ds ig nu pv er if ic at io nc od e as part of the Smart Restaurant workflow.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function sendSignupVerificationCode() {
            if (!pendingSignupData || !pendingSignupData.email) return;
            const code = generateVerificationCode();
            const codeKey = getSignupCodeKey(pendingSignupData.email);
            const expiryKey = getSignupExpiryKey(pendingSignupData.email);
            setCodeWithExpiry(codeKey, expiryKey, code);
            showInfo('signupCodeInfo', 'Your verification code is: ' + code + ' (valid for 5 minutes)');
        }

        /**
         * Manages the s en dl og in ve ri fi ca ti on co de as part of the Smart Restaurant workflow.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function sendLoginVerificationCode(owner) {
            if (!owner || !owner.ownerId) return;
            const code = generateVerificationCode();
            const codeKey = getLoginCodeKey(owner.ownerId);
            const expiryKey = getLoginExpiryKey(owner.ownerId);
            setCodeWithExpiry(codeKey, expiryKey, code);
            showInfo('loginCodeInfo', 'Your login verification code is: ' + code + ' (valid for 5 minutes)');
        }

        /**
         * Manages the s en dr es et ve ri fi ca ti on co de as part of the Smart Restaurant workflow.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function sendResetVerificationCode(email) {
            if (!email) return;
            const code = generateVerificationCode();
            const codeKey = getResetCodeKey(email);
            const expiryKey = getResetExpiryKey(email);
            setCodeWithExpiry(codeKey, expiryKey, code);
            showInfo('resetCodeInfo', 'Your password reset code is: ' + code + ' (valid for 5 minutes)');
        }

        /**
         * Returns to the t os ig nu pf ro mv er if ic at io n and clears temporary verification context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function backToSignupFromVerification() {
            clearSignupVerificationCode();
            pendingSignupData = null;
            showSignup();
        }

        /**
         * Returns to the t ol og in fr om ve ri fi ca ti on and clears temporary verification context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function backToLoginFromVerification() {
            clearLoginVerificationCode();
            pendingLoginOwner = null;
            showLogin();
        }

        /**
         * Generates the o wn er id using deterministic and runtime values.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function generateOwnerId(seedValue) {
            return 'owner_' + seedValue.replace(/\s+/g, '').toLowerCase();
        }

        /**
         * Generates the r es ta ur an ti d using deterministic and runtime values.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function generateRestaurantId(restaurantName) {
            let id = restaurantName.toLowerCase();
            id = id.replace(/\s+/g, '');
            id = id.replace(/[^a-z0-9_]/g, '');
            const randomNumber = Math.floor(1000 + Math.random() * 9000);
            return id + '_' + randomNumber;
        }

        /**
         * Returns whether the v al id em ai l satisfies required validation rules.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
        }

        /**
         * Normalizes the p ho ne nu mb er into a consistent internal format.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function normalizePhoneNumber(phoneNumber) {
            return String(phoneNumber || '').replace(/\D/g, '');
        }

        /**
         * Retrieves the l oc al ph on en um be r for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getLocalPhoneNumber(phoneNumber, countryCode) {
            const normalizedPhone = normalizePhoneNumber(phoneNumber);
            const normalizedCountryCode = normalizePhoneNumber(countryCode);

            if (!normalizedPhone) {
                return '';
            }

            if (normalizedCountryCode && normalizedPhone.startsWith(normalizedCountryCode)) {
                const strippedPhone = normalizedPhone.slice(normalizedCountryCode.length);
                if (strippedPhone) {
                    return strippedPhone;
                }
            }

            if (countryCode === '+91' && normalizedPhone.length > 10) {
                return normalizedPhone.slice(-10);
            }

            return normalizedPhone;
        }

        /**
         * Retrieves the p ho ne ma xl en gt h for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getPhoneMaxLength(countryCode) {
            return countryCode === '+91' ? 10 : 15;
        }

        /**
         * Returns whether the v al id ph on en um be r satisfies required validation rules.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function isValidPhoneNumber(phoneNumber, countryCode) {
            if (countryCode === '+91') {
                return /^\d{10}$/.test(phoneNumber);
            }

            return /^\d{6,15}$/.test(phoneNumber);
        }

        /**
         * Retrieves the p as sw or dv al id at io ne rr or for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getPasswordValidationError(password) {
            if (password.length < 8 ||
                !/[A-Z]/.test(password) ||
                !/[a-z]/.test(password) ||
                !/\d/.test(password) ||
                !/[^A-Za-z0-9]/.test(password)) {
                return 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.';
            }

            return '';
        }

        /**
         * Populates the c ou nt ry op ti on sf or se le ct to initialize selectable dashboard data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function populateCountryOptionsForSelect(selectId, defaultCode = '+91') {
            const countrySelect = document.getElementById(selectId);
            if (!countrySelect || countrySelect.options.length > 0) return;

            COUNTRY_PHONE_DATA.forEach(country => {
                const option = document.createElement('option');
                option.value = country.code;
                option.textContent = country.flag + ' ' + country.code + ' ' + country.name;
                countrySelect.appendChild(option);
            });

            countrySelect.value = defaultCode;
        }

        /**
         * Enforces the p ho ne in pu tl im it s constraints based on selected country settings.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function enforcePhoneInputLimits(inputId, countryCodeId) {
            const phoneInput = document.getElementById(inputId);
            const countrySelect = document.getElementById(countryCodeId);
            if (!phoneInput || !countrySelect) return;

            const maxDigits = getPhoneMaxLength(countrySelect.value);
            phoneInput.maxLength = maxDigits;
            phoneInput.value = getLocalPhoneNumber(phoneInput.value, countrySelect.value).slice(0, maxDigits);
        }

        /**
         * Populates the c ou nt ry op ti on s to initialize selectable dashboard data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function populateCountryOptions() {
            populateCountryOptionsForSelect('ownerCountryCode');
            populateCountryOptionsForSelect('settingsOwnerCountryCode');
            populateCountryOptionsForSelect('forgotCountryCode');
            updateDialCodeBadge();
            updateSettingsDialCodeBadge();
            updateForgotDialCode();
        }

        /**
         * Updates the d ia lc od eb ad ge so the interface reflects the latest state.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function updateDialCodeBadge() {
            const countrySelect = document.getElementById('ownerCountryCode');
            const dialCodeBadge = document.getElementById('selectedDialCode');
            if (!countrySelect || !dialCodeBadge) return;
            dialCodeBadge.textContent = countrySelect.value || '+91';
            enforcePhoneInputLimits('ownerPhoneNumber', 'ownerCountryCode');
        }

        /**
         * Updates the s et ti ng sd ia lc od eb ad ge so the interface reflects the latest state.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function updateSettingsDialCodeBadge() {
            const countrySelect = document.getElementById('settingsOwnerCountryCode');
            if (!countrySelect) return;
            enforcePhoneInputLimits('settingsOwnerPhoneNumber', 'settingsOwnerCountryCode');
        }

        /**
         * Updates the f or go td ia lc od e so the interface reflects the latest state.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function updateForgotDialCode() {
            const countrySelect = document.getElementById('forgotCountryCode');
            if (!countrySelect) return;
            enforcePhoneInputLimits('forgotPhoneNumber', 'forgotCountryCode');
        }

        /**
         * Initializes the a ut hf ie ld s during application bootstrap.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function initializeAuthFields() {
            populateCountryOptions();

            const countrySelect = document.getElementById('ownerCountryCode');
            if (countrySelect && !countrySelect.dataset.bound) {
                countrySelect.addEventListener('change', updateDialCodeBadge);
                countrySelect.dataset.bound = 'true';
            }

            const settingsCountrySelect = document.getElementById('settingsOwnerCountryCode');
            if (settingsCountrySelect && !settingsCountrySelect.dataset.bound) {
                settingsCountrySelect.addEventListener('change', updateSettingsDialCodeBadge);
                settingsCountrySelect.dataset.bound = 'true';
            }

            const forgotCountrySelect = document.getElementById('forgotCountryCode');
            if (forgotCountrySelect && !forgotCountrySelect.dataset.bound) {
                forgotCountrySelect.addEventListener('change', updateForgotDialCode);
                forgotCountrySelect.dataset.bound = 'true';
            }

            const phoneInput = document.getElementById('ownerPhoneNumber');
            if (phoneInput && !phoneInput.dataset.bound) {
                phoneInput.addEventListener('input', function() {
                    enforcePhoneInputLimits('ownerPhoneNumber', 'ownerCountryCode');
                });
                phoneInput.dataset.bound = 'true';
            }

            const settingsPhoneInput = document.getElementById('settingsOwnerPhoneNumber');
            if (settingsPhoneInput && !settingsPhoneInput.dataset.bound) {
                settingsPhoneInput.addEventListener('input', function() {
                    enforcePhoneInputLimits('settingsOwnerPhoneNumber', 'settingsOwnerCountryCode');
                });
                settingsPhoneInput.dataset.bound = 'true';
            }

            const forgotPhoneInput = document.getElementById('forgotPhoneNumber');
            if (forgotPhoneInput && !forgotPhoneInput.dataset.bound) {
                forgotPhoneInput.addEventListener('input', function() {
                    enforcePhoneInputLimits('forgotPhoneNumber', 'forgotCountryCode');
                });
                forgotPhoneInput.dataset.bound = 'true';
            }

            ['signupVerificationCode', 'loginVerificationCode', 'resetVerificationCode'].forEach(inputId => {
                const input = document.getElementById(inputId);
                if (input && !input.dataset.bound) {
                    input.addEventListener('input', function() {
                        this.value = this.value.replace(/\D/g, '').slice(0, 6);
                    });
                    input.dataset.bound = 'true';
                }
            });
        }

        /**
         * Retrieves the a ll ow ne rs for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getAllOwners() {
            const owners = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key || !key.startsWith('owner_')) {
                    continue;
                }

                try {
                    const owner = JSON.parse(localStorage.getItem(key));
                    if (!owner || typeof owner !== 'object') {
                        continue;
                    }

                    if (!owner.ownerId) {
                        owner.ownerId = key.replace(/^owner_/, '');
                    }

                    owners.push(owner);
                } catch (error) {
                    // Ignore malformed owner records.
                }
            }

            return owners;
        }

        /**
         * Retrieves the o wn er em ai l for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getOwnerEmail(owner) {
            if (owner.email) {
                return owner.email.trim().toLowerCase();
            }

            const legacyContact = String(owner.contact || '').trim().toLowerCase();
            return isValidEmail(legacyContact) ? legacyContact : '';
        }

        /**
         * Retrieves the o wn er ph on ed ig it s for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getOwnerPhoneDigits(owner) {
            if (owner.phoneNumber) {
                return getLocalPhoneNumber(owner.phoneNumber, owner.countryCode || '+91');
            }

            const legacyContact = String(owner.contact || '');
            return isValidEmail(legacyContact.trim()) ? '' : normalizePhoneNumber(legacyContact);
        }

        /**
         * Retrieves the o wn er fu ll ph on ed ig it s for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getOwnerFullPhoneDigits(owner) {
            const phoneDigits = getOwnerPhoneDigits(owner);
            if (!phoneDigits) {
                return '';
            }

            return normalizePhoneNumber((owner.countryCode || '') + phoneDigits);
        }

        /**
         * Finds the o wn er by lo gi ni de nt if ie r by scanning available owner and session records.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function findOwnerByLoginIdentifier(identifier) {
            const trimmedIdentifier = identifier.trim();
            const normalizedEmail = trimmedIdentifier.toLowerCase();
            const normalizedPhone = normalizePhoneNumber(trimmedIdentifier);
            const isEmailIdentifier = isValidEmail(normalizedEmail);
            const owners = getAllOwners();

            const matchedOwner = owners.find(owner => {
                const ownerEmail = getOwnerEmail(owner);
                const ownerPhone = getOwnerPhoneDigits(owner);
                const ownerPhoneWithCode = getOwnerFullPhoneDigits(owner);
                const legacyContact = String(owner.contact || '').trim().toLowerCase();

                if (isEmailIdentifier) {
                    return ownerEmail === normalizedEmail || legacyContact === normalizedEmail;
                }

                if (normalizedPhone) {
                    return ownerPhone === normalizedPhone ||
                        ownerPhoneWithCode === normalizedPhone ||
                        normalizePhoneNumber(legacyContact) === normalizedPhone;
                }

                return legacyContact === normalizedEmail;
            });

            if (matchedOwner) {
                return matchedOwner;
            }

            const fallbackOwnerId = generateOwnerId(trimmedIdentifier);
            const fallbackOwnerData = localStorage.getItem('owner_' + fallbackOwnerId);

            if (!fallbackOwnerData) {
                return null;
            }

            try {
                const fallbackOwner = JSON.parse(fallbackOwnerData);
                if (!fallbackOwner.ownerId) {
                    fallbackOwner.ownerId = fallbackOwnerId;
                }
                return fallbackOwner;
            } catch (error) {
                return null;
            }
        }

        /**
         * Handles the s ig nu p interactions and validates the submitted data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function handleSignup(event) {
            event.preventDefault();
            clearError('signupError');
            
            const restaurantName = document.getElementById('restaurantName').value.trim();
            const email = document.getElementById('ownerEmail').value.trim().toLowerCase();
            const countryCode = document.getElementById('ownerCountryCode').value;
            const phoneNumber = getLocalPhoneNumber(document.getElementById('ownerPhoneNumber').value.trim(), countryCode);
            const password = document.getElementById('ownerPassword').value.trim();
            
            if (!restaurantName) {
                showError('signupError', 'Restaurant name is required.');
                return;
            }

            if (!email || !isValidEmail(email)) {
                showError('signupError', 'Please enter a valid email address.');
                return;
            }

            if (!countryCode) {
                showError('signupError', 'Please select a country code.');
                return;
            }

            if (!phoneNumber) {
                showError('signupError', 'Phone number is required.');
                return;
            }

            if (!isValidPhoneNumber(phoneNumber, countryCode)) {
                if (countryCode === '+91') {
                    showError('signupError', 'Indian phone numbers must contain exactly 10 digits.');
                } else {
                    showError('signupError', 'Please enter a valid phone number.');
                }
                return;
            }

            const passwordError = getPasswordValidationError(password);
            if (passwordError) {
                showError('signupError', passwordError);
                return;
            }

            const allOwners = getAllOwners();
            const signupPhoneWithCode = normalizePhoneNumber(countryCode + phoneNumber);

            const hasEmailConflict = allOwners.some(owner => getOwnerEmail(owner) === email);
            if (hasEmailConflict) {
                showError('signupError', 'An account with this email already exists. Please login.');
                return;
            }

            const hasPhoneConflict = allOwners.some(owner => {
                const ownerPhone = getOwnerPhoneDigits(owner);
                const ownerPhoneWithCode = getOwnerFullPhoneDigits(owner);
                return ownerPhone === phoneNumber ||
                    ownerPhoneWithCode === signupPhoneWithCode ||
                    ownerPhone === signupPhoneWithCode;
            });
            if (hasPhoneConflict) {
                showError('signupError', 'An account with this phone number already exists. Please login.');
                return;
            }

            const ownerId = generateOwnerId(email);
            const restaurantId = generateRestaurantId(restaurantName);
            pendingSignupData = {
                ownerId: ownerId,
                restaurantId: restaurantId,
                restaurantName: restaurantName,
                email: email,
                phoneNumber: phoneNumber,
                countryCode: countryCode,
                contact: email,
                password: password
            };

            sendSignupVerificationCode();
            document.getElementById('signupVerificationCode').value = '';
            showAuthPanel('signupVerificationForm');
            clearError('signupVerificationError');
        }

        /**
         * Verifies the s ig nu pc od e before allowing the workflow to proceed.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function verifySignupCode(event) {
            event.preventDefault();
            clearError('signupVerificationError');

            if (!pendingSignupData || !pendingSignupData.email) {
                showError('signupVerificationError', 'Sign-up session not found. Please sign up again.');
                showSignup();
                return;
            }

            const enteredCode = String(document.getElementById('signupVerificationCode').value || '').replace(/\D/g, '');
            if (!/^\d{6}$/.test(enteredCode)) {
                showError('signupVerificationError', 'Please enter a valid 6-digit code.');
                return;
            }

            const codeKey = getSignupCodeKey(pendingSignupData.email);
            const expiryKey = getSignupExpiryKey(pendingSignupData.email);
            const validation = isCodeValid(codeKey, expiryKey, enteredCode);

            if (!validation.ok) {
                showError('signupVerificationError', validation.reason);
                return;
            }

            clearStoredCode(codeKey, expiryKey);

            const ownerData = {
                ownerId: pendingSignupData.ownerId,
                restaurantId: pendingSignupData.restaurantId,
                restaurantName: pendingSignupData.restaurantName,
                email: pendingSignupData.email,
                phoneNumber: pendingSignupData.phoneNumber,
                countryCode: pendingSignupData.countryCode,
                contact: pendingSignupData.contact,
                password: pendingSignupData.password,
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('owner_' + ownerData.ownerId, JSON.stringify(ownerData));
            localStorage.setItem('currentOwner', ownerData.ownerId);
            localStorage.setItem('currentRestaurant', ownerData.restaurantId);

            currentOwnerId = ownerData.ownerId;
            currentRestaurantId = ownerData.restaurantId;
            pendingSignupData = null;

            openDashboard();
        }

        /**
         * Resends the s ig nu pc od e so the user can continue verification securely.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function resendSignupCode() {
            clearError('signupVerificationError');

            if (!pendingSignupData || !pendingSignupData.email) {
                showError('signupVerificationError', 'Sign-up session not found. Please sign up again.');
                showSignup();
                return;
            }

            sendSignupVerificationCode();
        }

        /**
         * Handles the l og in interactions and validates the submitted data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function handleLogin(event) {
            event.preventDefault();
            clearError('loginError');
            
            const identifier = document.getElementById('loginIdentifier').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            
            if (!identifier || !password) {
                showError('loginError', 'Please enter email or phone number and password.');
                return;
            }

            const owner = findOwnerByLoginIdentifier(identifier);

            if (!owner) {
                showError('loginError', 'Account not found. Please sign up.');
                return;
            }

            if (owner.password !== password) {
                showError('loginError', 'Incorrect password.');
                return;
            }

            if (!owner.restaurantId) {
                showError('loginError', 'Account data is incomplete. Please create a new account.');
                return;
            }

            pendingLoginOwner = {
                ownerId: owner.ownerId || generateOwnerId(owner.email || owner.contact || identifier),
                restaurantId: owner.restaurantId
            };

            sendLoginVerificationCode(pendingLoginOwner);
            document.getElementById('loginVerificationCode').value = '';
            showAuthPanel('loginVerificationForm');
            clearError('loginVerificationError');
        }

        /**
         * Verifies the l og in co de before allowing the workflow to proceed.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function verifyLoginCode(event) {
            event.preventDefault();
            clearError('loginVerificationError');

            if (!pendingLoginOwner || !pendingLoginOwner.ownerId) {
                showError('loginVerificationError', 'Login session not found. Please login again.');
                showLogin();
                return;
            }

            const enteredCode = String(document.getElementById('loginVerificationCode').value || '').replace(/\D/g, '');
            if (!/^\d{6}$/.test(enteredCode)) {
                showError('loginVerificationError', 'Please enter a valid 6-digit code.');
                return;
            }

            const codeKey = getLoginCodeKey(pendingLoginOwner.ownerId);
            const expiryKey = getLoginExpiryKey(pendingLoginOwner.ownerId);
            const validation = isCodeValid(codeKey, expiryKey, enteredCode);

            if (!validation.ok) {
                showError('loginVerificationError', validation.reason);
                return;
            }

            clearStoredCode(codeKey, expiryKey);

            localStorage.setItem('currentOwner', pendingLoginOwner.ownerId);
            localStorage.setItem('currentRestaurant', pendingLoginOwner.restaurantId);

            currentOwnerId = pendingLoginOwner.ownerId;
            currentRestaurantId = pendingLoginOwner.restaurantId;
            pendingLoginOwner = null;

            openDashboard();
        }

        /**
         * Resends the l og in co de so the user can continue verification securely.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function resendLoginCode() {
            clearError('loginVerificationError');

            if (!pendingLoginOwner || !pendingLoginOwner.ownerId) {
                showError('loginVerificationError', 'Login session not found. Please login again.');
                showLogin();
                return;
            }

            sendLoginVerificationCode(pendingLoginOwner);
        }

        /**
         * Starts the f or go tp as sw or d and initializes required runtime handlers.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function startForgotPassword(event) {
            event.preventDefault();
            clearError('forgotPasswordError');

            const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
            const countryCode = document.getElementById('forgotCountryCode').value;
            const phoneNumber = getLocalPhoneNumber(document.getElementById('forgotPhoneNumber').value.trim(), countryCode);

            if (!email || !isValidEmail(email)) {
                showError('forgotPasswordError', 'Please enter a valid email address.');
                return;
            }

            if (!countryCode) {
                showError('forgotPasswordError', 'Please select a country code.');
                return;
            }

            if (!phoneNumber) {
                showError('forgotPasswordError', 'Phone number is required.');
                return;
            }

            if (!isValidPhoneNumber(phoneNumber, countryCode)) {
                if (countryCode === '+91') {
                    showError('forgotPasswordError', 'Indian phone numbers must contain exactly 10 digits.');
                } else {
                    showError('forgotPasswordError', 'Please enter a valid phone number.');
                }
                return;
            }

            const owner = getAllOwners().find(item => getOwnerEmail(item) === email);
            if (!owner) {
                showError('forgotPasswordError', 'Account not found for this email.');
                return;
            }

            const ownerCountryCode = owner.countryCode || '+91';
            const ownerPhone = getOwnerPhoneDigits(owner);
            const enteredPhoneFull = normalizePhoneNumber(countryCode + phoneNumber);
            const ownerPhoneFull = normalizePhoneNumber(ownerCountryCode + ownerPhone);

            if (!ownerPhone || enteredPhoneFull !== ownerPhoneFull) {
                showError('forgotPasswordError', 'Email and phone number do not match our records.');
                return;
            }

            pendingResetOwnerId = owner.ownerId;
            pendingResetEmail = email;

            sendResetVerificationCode(email);
            document.getElementById('resetVerificationCode').value = '';
            document.getElementById('resetNewPassword').value = '';
            document.getElementById('resetConfirmPassword').value = '';

            showAuthPanel('resetVerificationForm');
            clearError('resetVerificationError');
        }

        /**
         * Verifies the r es et co de before allowing the workflow to proceed.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function verifyResetCode(event) {
            event.preventDefault();
            clearError('resetVerificationError');

            if (!pendingResetEmail || !pendingResetOwnerId) {
                showError('resetVerificationError', 'Reset session not found. Please start again.');
                showForgotPassword();
                return;
            }

            const enteredCode = String(document.getElementById('resetVerificationCode').value || '').replace(/\D/g, '');
            if (!/^\d{6}$/.test(enteredCode)) {
                showError('resetVerificationError', 'Please enter a valid 6-digit code.');
                return;
            }

            const codeKey = getResetCodeKey(pendingResetEmail);
            const expiryKey = getResetExpiryKey(pendingResetEmail);
            const validation = isCodeValid(codeKey, expiryKey, enteredCode);

            if (!validation.ok) {
                showError('resetVerificationError', validation.reason);
                return;
            }

            clearStoredCode(codeKey, expiryKey);
            showAuthPanel('resetPasswordForm');
            clearError('resetPasswordError');
        }

        /**
         * Resends the r es et co de so the user can continue verification securely.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function resendResetCode() {
            clearError('resetVerificationError');

            if (!pendingResetEmail || !pendingResetOwnerId) {
                showError('resetVerificationError', 'Reset session not found. Please start again.');
                showForgotPassword();
                return;
            }

            sendResetVerificationCode(pendingResetEmail);
        }

        /**
         * Completes the p as sw or dr es et and finalizes account recovery state.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function completePasswordReset(event) {
            event.preventDefault();
            clearError('resetPasswordError');

            if (!pendingResetOwnerId || !pendingResetEmail) {
                showError('resetPasswordError', 'Reset session not found. Please start again.');
                showForgotPassword();
                return;
            }

            const newPassword = document.getElementById('resetNewPassword').value.trim();
            const confirmPassword = document.getElementById('resetConfirmPassword').value.trim();

            if (!newPassword || !confirmPassword) {
                showError('resetPasswordError', 'Please fill both password fields.');
                return;
            }

            if (newPassword !== confirmPassword) {
                showError('resetPasswordError', 'Passwords do not match.');
                return;
            }

            const passwordError = getPasswordValidationError(newPassword);
            if (passwordError) {
                showError('resetPasswordError', passwordError);
                return;
            }

            const ownerKey = 'owner_' + pendingResetOwnerId;
            const ownerData = localStorage.getItem(ownerKey);

            if (!ownerData) {
                showError('resetPasswordError', 'Account not found. Please try again.');
                return;
            }

            let owner = null;
            try {
                owner = JSON.parse(ownerData);
            } catch (error) {
                showError('resetPasswordError', 'Account data is invalid. Please try again.');
                return;
            }

            owner.password = newPassword;
            localStorage.setItem(ownerKey, JSON.stringify(owner));

            clearResetVerificationCode();
            pendingResetOwnerId = null;
            pendingResetEmail = null;

            document.getElementById('resetNewPassword').value = '';
            document.getElementById('resetConfirmPassword').value = '';

            alert('? Password reset successful. Please login with your new password.');
            showLogin();
        }

        /**
         * Handles the l og ou t interactions and validates the submitted data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function handleLogout() {
            if (confirm('Are you sure you want to logout?')) {
                clearSignupVerificationCode();
                clearLoginVerificationCode();
                clearResetVerificationCode();
                localStorage.removeItem('currentOwner');
                currentOwnerId = null;
                currentRestaurantId = null;
                pendingSignupData = null;
                pendingLoginOwner = null;
                pendingResetOwnerId = null;
                pendingResetEmail = null;
                
                document.getElementById('dashboard').style.display = 'none';
                document.getElementById('ownerAuth').style.display = 'flex';
                
                document.getElementById('loginIdentifier').value = '';
                document.getElementById('loginPassword').value = '';
                showLogin();
            }
        }
        /**
         * Shows the e rr or and keeps related UI panels in sync.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function showError(elementId, message) {
            const errorDiv = document.getElementById(elementId);
            if (!errorDiv) return;
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
        }

        /**
         * Clears the e rr or to avoid stale authentication or workflow data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function clearError(elementId) {
            const errorDiv = document.getElementById(elementId);
            if (!errorDiv) return;
            errorDiv.textContent = '';
            errorDiv.classList.remove('show');
        }

        /**
         * Opens the d as hb oa rd for editing within the modal workflow.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function openDashboard() {
            document.getElementById('ownerAuth').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadRestaurantName();
            loadSettings();
            initializeDashboard();
            // Pre-fill the customer URL input with whatever was previously saved
            const input = document.getElementById('qrBaseUrlInput');
            if (input) {
                input.value = (localStorage.getItem('qrCustomerBaseUrl') || '').trim();
            }
        }

        /**
         * Loads the a pp from LocalStorage and prepares it for dashboard use.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function loadApp() {
            initializeAuthFields();
            const ownerId = localStorage.getItem('currentOwner');
            
            if (ownerId) {
                currentOwnerId = ownerId;
                const ownerData = JSON.parse(localStorage.getItem('owner_' + ownerId));
                if (ownerData) {
                    currentRestaurantId = ownerData.restaurantId;
                    openDashboard();
                } else {
                    showAuthScreen();
                }
            } else {
                showAuthScreen();
            }
        }

        /**
         * Shows the a ut hs cr ee n and keeps related UI panels in sync.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function showAuthScreen() {
            document.getElementById('ownerAuth').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
            initializeAuthFields();
        }

        /**
         * Loads the r es ta ur an tn am e from LocalStorage and prepares it for dashboard use.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function loadRestaurantName() {
            if (currentOwnerId) {
                const ownerData = JSON.parse(localStorage.getItem('owner_' + currentOwnerId));
                if (ownerData) {
                    document.getElementById('restaurantHeader').textContent = '??? ' + ownerData.restaurantName + ' - Dashboard';
                }
            }
        }

        /**
         * Loads the s et ti ng s from LocalStorage and prepares it for dashboard use.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function loadSettings() {
            if (currentOwnerId) {
                const ownerData = JSON.parse(localStorage.getItem('owner_' + currentOwnerId));
                if (ownerData) {
                    document.getElementById('settingsRestaurantName').value = ownerData.restaurantName;
                    const settingsEmail = ownerData.email || getOwnerEmail(ownerData) || '';
                    const settingsCountryCode = ownerData.countryCode || '+91';
                    const settingsPhoneNumber = getLocalPhoneNumber(ownerData.phoneNumber || getOwnerPhoneDigits(ownerData), settingsCountryCode);
                    const settingsContact = ownerData.contact || settingsEmail || '';

                    document.getElementById('settingsOwnerEmail').value = settingsEmail;
                    document.getElementById('settingsOwnerCountryCode').value = settingsCountryCode;
                    updateSettingsDialCodeBadge();
                    document.getElementById('settingsOwnerPhoneNumber').value = settingsPhoneNumber;
                    enforcePhoneInputLimits('settingsOwnerPhoneNumber', 'settingsOwnerCountryCode');
                    document.getElementById('settingsOwnerContact').value = settingsContact;
                }
            }
        }

        /**
         * Saves the s et ti ng s to LocalStorage to keep persisted state synchronized.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function saveSettings() {
            if (!currentOwnerId) return;

            const ownerData = JSON.parse(localStorage.getItem('owner_' + currentOwnerId));
            const newName = document.getElementById('settingsRestaurantName').value.trim();
            const newEmail = document.getElementById('settingsOwnerEmail').value.trim().toLowerCase();
            const newCountryCode = document.getElementById('settingsOwnerCountryCode').value;
            const newPhoneNumber = getLocalPhoneNumber(document.getElementById('settingsOwnerPhoneNumber').value.trim(), newCountryCode);
            const newContact = document.getElementById('settingsOwnerContact').value.trim();
            const newPassword = document.getElementById('settingsOwnerPassword').value.trim();

            if (!newName || !newEmail || !newPhoneNumber || !newContact) {
                alert('Restaurant name, email, phone number, and contact are required.');
                return;
            }

            if (!isValidEmail(newEmail)) {
                alert('Please enter a valid email address.');
                return;
            }

            if (!isValidPhoneNumber(newPhoneNumber, newCountryCode)) {
                if (newCountryCode === '+91') {
                    alert('Indian phone numbers must contain exactly 10 digits.');
                } else {
                    alert('Please enter a valid phone number.');
                }
                return;
            }

            ownerData.restaurantName = newName;
            ownerData.contact = newContact;
            ownerData.email = newEmail;
            ownerData.phoneNumber = newPhoneNumber;
            ownerData.countryCode = newCountryCode;
            
            if (newPassword) {
                const passwordError = getPasswordValidationError(newPassword);
                if (passwordError) {
                    alert(passwordError);
                    return;
                }
                ownerData.password = newPassword;
            }

            localStorage.setItem('owner_' + currentOwnerId, JSON.stringify(ownerData));
            
            document.getElementById('restaurantHeader').textContent = '??? ' + newName + ' - Dashboard';
            
            document.getElementById('settingsOwnerPassword').value = '';
            
            alert('? Settings saved successfully!');
        }

        // --- QR CODE URL HELPERS --------------------------------------------------
        //
        // Rule: the QR code always encodes  {customerSiteOrigin}/?restaurant={id}
        //
        // On Netlify (or any live host), window.location.origin is used automatically
        // because the dashboard and customer site live on the same domain.
        //
        // If the owner moves to a new domain they simply type the new URL once into
        // the "Customer Website URL" field in the QR section  it is saved to
        // localStorage and used from then on with no code changes needed.
        //
        // On localhost / file:// the owner is prompted for their LAN IP so phones
        // on the same Wi-Fi network can reach the customer site.
        // -------------------------------------------------------------------------

        /** Returns true for localhost / 127.0.0.1 / ::1 */
        /**
         * Returns whether the l oc al ho st satisfies required validation rules.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function isLocalHost(hostname) {
            return hostname === 'localhost' ||
                   hostname === '127.0.0.1' ||
                   hostname === '::1' ||
                   hostname === '[::1]';
        }

        /**
         * Returns the stored customer-site base URL (origin only, no trailing slash).
         * Falls back to window.location.origin when nothing is saved.
         */
        function getCustomerSiteBaseUrl() {
            const saved = (localStorage.getItem('qrCustomerBaseUrl') || '').trim();
            if (saved) {
                try {
                    // Use only the origin part (strip any accidental path/filename)
                    return new URL(saved).origin;
                } catch (e) { /* fall through */ }
            }
            // Default: same origin as the dashboard (correct for Netlify deployments
            // where both dashboard and customer site share one domain)
            return window.location.origin;
        }

        /**
         * Saves a new customer-site base URL entered by the owner.
         * Called by the "Save URL" button in the QR section.
         */
        function saveQrBaseUrl() {
            const input = document.getElementById('qrBaseUrlInput');
            if (!input) return;
            const raw = input.value.trim().replace(/\/+$/, ''); // strip trailing slashes
            if (!raw) {
                alert('Please enter a URL before saving.');
                return;
            }
            try {
                const parsed = new URL(raw);
                const origin = parsed.origin;          // e.g. https://smart-restaurant-menu.netlify.app
                localStorage.setItem('qrCustomerBaseUrl', origin);
                input.value = origin;
                alert('? Customer website URL saved!\nQR codes will now point to:\n' + origin + '/?restaurant=');
            } catch (e) {
                alert('Invalid URL. Please enter a full URL such as:\nhttps://smart-restaurant-menu.netlify.app');
            }
        }

        /**
         * Main QR generator.
         * Builds the customer URL, generates the QR image, and displays both.
         */
        function generateQR() {
            if (!currentRestaurantId) return;

            const isFileProtocol = window.location.protocol === 'file:';
            const isLocal        = !isFileProtocol && isLocalHost(window.location.hostname);

            let baseUrl;

            if (isFileProtocol || isLocal) {
                // -- Local / offline: phones cannot reach localhost, so ask for LAN IP --
                const fallbackSuggestion = 'http://YOUR_PC_IP:5500';
                const saved = (localStorage.getItem('qrCustomerBaseUrl') || '').trim();
                const suggestion = saved || fallbackSuggestion;

                const entered = prompt(
                    'You are running locally.\n\n' +
                    'Enter the customer website base URL so phones on the same Wi-Fi can open it.\n' +
                    'Example: http://192.168.1.10:5500\n\n' +
                    '(Replace 192.168.1.10 with your PC\'s LAN IP address.)',
                    suggestion
                );

                if (entered === null) return;   // user cancelled

                const trimmed = entered.trim().replace(/\/+$/, '');
                if (!trimmed) { alert('No URL entered. QR code was not generated.'); return; }

                try {
                    const parsed = new URL(trimmed);
                    baseUrl = parsed.origin;

                    if (isLocalHost(parsed.hostname)) {
                        alert('?? Warning: "' + parsed.hostname + '" only works on this device.\n' +
                              'Use your PC\'s LAN IP address (e.g. 192.168.1.10) so phones can scan the QR code.');
                    }
                } catch (e) {
                    alert('Invalid URL. Please enter a full URL like http://192.168.1.10:5500');
                    return;
                }

                localStorage.setItem('qrCustomerBaseUrl', baseUrl);

                // Reflect the saved URL in the input field if it exists
                const input = document.getElementById('qrBaseUrlInput');
                if (input) input.value = baseUrl;

            } else {
                // -- Live server (Netlify, Vercel, custom domain, etc.) ----------------
                // Use the saved URL if the owner set one; otherwise use current origin.
                baseUrl = getCustomerSiteBaseUrl();
            }

            // Final customer URL  always clean: origin + / + ?restaurant=id
            const customerUrl = baseUrl + '/?restaurant=' + encodeURIComponent(currentRestaurantId);

            // -- Generate QR image (primary service with fallback) ------------------
            const primaryQrUrl  = 'https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=20&ecc=M&data='
                                  + encodeURIComponent(customerUrl);
            const fallbackQrUrl = 'https://quickchart.io/qr?size=420&margin=2&ecLevel=M&text='
                                  + encodeURIComponent(customerUrl);

            const qrImage = document.getElementById('qrImage');
            qrImage.dataset.fallbackUsed = '0';

            qrImage.onerror = function () {
                if (qrImage.dataset.fallbackUsed === '1') {
                    alert('Unable to load QR image from either online service.\nPlease check your internet connection and try again.');
                    return;
                }
                qrImage.dataset.fallbackUsed = '1';
                qrImage.src = fallbackQrUrl;
            };

            qrImage.src = primaryQrUrl;
            document.getElementById('customerUrl').textContent = customerUrl;
            document.getElementById('qrDisplay').classList.add('show');
        }

        /**
         * Initializes the d as hb oa rd during application bootstrap.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function initializeDashboard() {
            loadMenu();
            // FEATURE 1: Run daily order cleanup before loading orders so stale orders never appear
            performDailyOrderCleanup();
            loadOrders();
            orders.forEach(order => {
                payments[order.id] = payments[order.id] || 'unpaid';
            });
            updateTableStatus();
            renderOrders();
            renderTables();
            renderBilling();
            renderMenu();
        }

        // ─────────────────────────────────────────────────────────────────
        // FEATURE 1 — Automatic Daily Order Cleanup
        // Removes any order whose timestamp date is before today.
        // Runs once per calendar day (guarded by lastCleanupDate key).
        // ─────────────────────────────────────────────────────────────────
        function performDailyOrderCleanup() {
            if (!currentRestaurantId) return;

            // Today's date as YYYY-MM-DD
            const today = new Date().toISOString().slice(0, 10);
            const cleanupKey = 'lastCleanupDate_' + currentRestaurantId;
            const lastCleanup = localStorage.getItem(cleanupKey);

            // Skip if we already cleaned up today
            if (lastCleanup === today) return;

            const ordersKey = getOrdersKey();
            try {
                const raw = localStorage.getItem(ordersKey) || localStorage.getItem('spiceFusionOrders');
                if (raw) {
                    const allOrders = JSON.parse(raw);
                    // Keep ONLY orders whose timestamp date equals today
                    const todayOrders = allOrders.filter(order => {
                        if (!order.timestamp) return false; // discard orders with no timestamp
                        return order.timestamp.slice(0, 10) === today;
                    });
                    localStorage.setItem(ordersKey, JSON.stringify(todayOrders));
                }
            } catch (e) {
                // If parsing fails, leave orders untouched
            }

            // Mark that cleanup has run today
            localStorage.setItem(cleanupKey, today);
        }

        /**
         * Retrieves the m en uk ey for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getMenuKey() {
            return 'menu_' + currentRestaurantId;
        }

        /**
         * Retrieves the o rd er sk ey for the active restaurant context.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function getOrdersKey() {
            return currentRestaurantId ? ('orders_' + currentRestaurantId) : 'spiceFusionOrders';
        }

        /**
         * Normalizes the m en ui te ms into a consistent internal format.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
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

        /**
         * Loads the m en u from LocalStorage and prepares it for dashboard use.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function loadMenu() {
            const savedMenu = localStorage.getItem(getMenuKey());
            if (savedMenu) {
                try {
                    menuItems = normalizeMenuItems(JSON.parse(savedMenu));
                    return;
                } catch (error) {
                    menuItems = [];
                }
            }

            menuItems = normalizeMenuItems(typeof DEFAULT_MENU !== 'undefined' ? DEFAULT_MENU : []);
            if (menuItems.length > 0) {
                saveMenu();
            }
        }
        
        /**
         * Saves the m en u to LocalStorage to keep persisted state synchronized.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function saveMenu() {
            localStorage.setItem(getMenuKey(), JSON.stringify(menuItems));
        }
        
        /**
         * Generates the m en ui te mi d using deterministic and runtime values.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function generateMenuItemId() {
            const maxId = menuItems.reduce((max, item) => Math.max(max, item.id), 0);
            return maxId + 1;
        }

        /**
         * Previews the n ew im ag e before it is saved to the menu catalog.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function previewNewImage(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('newImagePreview');
                    preview.src = e.target.result;
                    preview.classList.add('show');
                };
                reader.readAsDataURL(file);
            }
        }

        /**
         * Adds the m en ui te m after validating required input fields.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function addMenuItem() {
            const name = document.getElementById('newItemName').value.trim();
            const price = parseFloat(document.getElementById('newItemPrice').value);
            const category = document.getElementById('newItemCategory').value;
            const type = document.querySelector('input[name="itemType"]:checked').value;
            const imageInput = document.getElementById('newItemImage');
            
            if (!name) {
                alert('Please enter item name');
                return;
            }
            
            if (!price || price <= 0) {
                alert('Please enter a valid price');
                return;
            }

            if (!category) {
                alert('Please select a category');
                return;
            }

            if (imageInput.files && imageInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const newItem = {
                        id: generateMenuItemId(),
                        name: name,
                        price: price,
                        category: category,
                        type: type,
                        image: e.target.result,
                        available: true,
                        description: ""
                    };
                    
                    menuItems.push(newItem);
                    saveMenu();
                    
                    document.getElementById('newItemName').value = '';
                    document.getElementById('newItemPrice').value = '';
                    document.getElementById('newItemCategory').value = '';
                    document.getElementById('newItemImage').value = '';
                    document.getElementById('newImagePreview').classList.remove('show');
                    
                    renderMenu();
                    alert('? Menu item added successfully!');
                };
                reader.readAsDataURL(imageInput.files[0]);
            } else {
                const newItem = {
                    id: generateMenuItemId(),
                    name: name,
                    price: price,
                    category: category,
                    type: type,
                    image: DEFAULT_IMAGE,
                    available: true,
                    description: ""
                };
                
                menuItems.push(newItem);
                saveMenu();
                
                document.getElementById('newItemName').value = '';
                document.getElementById('newItemPrice').value = '';
                document.getElementById('newItemCategory').value = '';
                
                renderMenu();
                alert('? Menu item added successfully!');
            }
        }

        /**
         * Manages the c ha ng ei ma ge as part of the Smart Restaurant workflow.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function changeImage(itemId) {
            changingImageItemId = itemId;
            document.getElementById('changeImageInput').click();
        }

        /**
         * Handles the i ma ge ch an ge interactions and validates the submitted data.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function handleImageChange(event) {
            const file = event.target.files[0];
            if (file && changingImageItemId) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const item = menuItems.find(i => i.id === changingImageItemId);
                    if (item) {
                        item.image = e.target.result;
                        saveMenu();
                        renderMenu();
                        alert('? Image updated successfully!');
                    }
                    changingImageItemId = null;
                    event.target.value = '';
                };
                reader.readAsDataURL(file);
            }
        }

        /**
         * Loads the o rd er s from LocalStorage and prepares it for dashboard use.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function loadOrders() {
            const ordersKey = getOrdersKey();
            const savedOrders = localStorage.getItem(ordersKey) || localStorage.getItem('spiceFusionOrders');
            if (!savedOrders) {
                orders = [];
                return;
            }

            try {
                const parsedOrders = JSON.parse(savedOrders);
                const sanitizedOrders = sanitizeOrders(parsedOrders);

                orders = sanitizedOrders;
                localStorage.setItem(ordersKey, JSON.stringify(sanitizedOrders));
            } catch (error) {
                orders = [];
            }
        }

        /**
         * Sanitizes the o rd er s to remove malformed or invalid records.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function sanitizeOrders(orderList) {
            if (!Array.isArray(orderList)) {
                return [];
            }

            return orderList
                .map(order => {
                    const items = Array.isArray(order.items) ? order.items : [];
                    const filteredItems = items.filter(item => {
                        return !(item && item.name === 'asdfghjk' && Number(item.price) === 2345);
                    });

                    return {
                        ...order,
                        items: filteredItems
                    };
                })
                .filter(order => order.items.length > 0);
        }
        
        /**
         * Saves the o rd er s to LocalStorage to keep persisted state synchronized.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function saveOrders() {
            localStorage.setItem(getOrdersKey(), JSON.stringify(orders));
        }

        /**
         * Switches the t ab and triggers related UI refresh operations.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function switchTab(tabName) {
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });

            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });

            document.getElementById(tabName + '-section').classList.add('active');
            event.target.classList.add('active');

            if (tabName === 'orders') renderOrders();
            if (tabName === 'tables') renderTables();
            if (tabName === 'billing') renderBilling();
            if (tabName === 'menu') renderMenu();
            if (tabName === 'settings') loadSettings();
            // FEATURE 3: Render analytics when tab is switched to it
            if (tabName === 'analytics') renderAnalytics();
        }

        /**
         * Renders the o rd er s into the corresponding dashboard section.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function renderOrders() {
            const container = document.getElementById('orders-container');
            
            if (orders.length === 0) {
                container.innerHTML = '<div class="empty-state"><h3>No orders yet</h3><p>Orders from customers will appear here</p></div>';
                return;
            }

            container.innerHTML = orders.map(order => `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">${order.id}</span>
                        <span class="table-badge">Table ${order.tableNumber}</span>
                    </div>
                    
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <strong>${item.name}</strong> × ${item.quantity} = ?${item.price * item.quantity}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="order-time">? ${order.time}</div>
                    
                    <span class="status-badge status-${order.status}">
                        ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    
                    <div class="order-actions">
                        <button class="btn btn-confirm" 
                                onclick="confirmOrder('${order.id}')"
                                ${order.status !== 'pending' ? 'disabled' : ''}>
                            ? Confirm
                        </button>
                        <button class="btn btn-deliver" 
                                onclick="deliverOrder('${order.id}')"
                                ${order.status !== 'confirmed' ? 'disabled' : ''}>
                            ?? Deliver
                        </button>
                    </div>
                </div>
            `).join('');
        }

        /**
         * Confirms the o rd er and propagates the status update.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function confirmOrder(orderId) {
            const order = orders.find(o => o.id === orderId);
            if (order && order.status === 'pending') {
                order.status = 'confirmed';
                
                const notification = {
                    orderId: orderId,
                    message: 'Your order has been confirmed! Preparing your food now... ?????',
                    timestamp: new Date().toISOString()
                };
                
                let notifications = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
                notifications.push(notification);
                localStorage.setItem('customerNotifications', JSON.stringify(notifications));
                
                saveOrders();
                updateTableStatus();
                renderOrders();
            }
        }

        /**
         * Marks the o rd er as delivered and sends customer notifications.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function deliverOrder(orderId) {
            const order = orders.find(o => o.id === orderId);
            if (order && order.status === 'confirmed') {
                order.status = 'delivered';
                
                const notification = {
                    orderId: orderId,
                    message: 'Your order has been delivered! Enjoy your meal! ??',
                    timestamp: new Date().toISOString()
                };
                
                let notifications = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
                notifications.push(notification);
                localStorage.setItem('customerNotifications', JSON.stringify(notifications));
                
                saveOrders();
                updateTableStatus();
                renderOrders();
            }
        }

        /**
         * Updates the t ab le st at us so the interface reflects the latest state.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function updateTableStatus() {
            tables.forEach(table => {
                table.status = 'free';
            });

            orders.forEach(order => {
                const table = tables.find(t => t.number === order.tableNumber);
                if (table) {
                    if (order.status === 'delivered') {
                        table.status = 'delivered';
                    } else if (order.status === 'pending' || order.status === 'confirmed') {
                        if (table.status !== 'delivered') {
                            table.status = 'occupied';
                        }
                    }
                }
            });
        }

        /**
         * Renders the t ab le s into the corresponding dashboard section.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function renderTables() {
            updateTableStatus();
            const container = document.getElementById('tables-container');
            
            container.innerHTML = tables.map(table => `
                <div class="table-card ${table.status}">
                    <div class="table-number">Table ${table.number}</div>
                    <div class="table-status ${table.status}">
                        ${table.status === 'free' ? '? Free' : 
                          table.status === 'occupied' ? '? In Progress' : 
                          '? Delivered'}
                    </div>
                </div>
            `).join('');
        }

        /**
         * Renders the b il li ng into the corresponding dashboard section.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function renderBilling() {
            const container = document.getElementById('billing-container');
            
            if (orders.length === 0) {
                container.innerHTML = '<div class="empty-state"><h3>No bills yet</h3><p>Bills will appear here when orders are placed</p></div>';
                return;
            }

            container.innerHTML = orders.map(order => {
                const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const tax = Math.round(subtotal * 0.05);
                const grandTotal = subtotal + tax;
                const paymentStatus = payments[order.id] || 'unpaid';
                
                return `
                    <div class="bill-card">
                        <div class="bill-header">
                            <div>
                                <span class="order-id">${order.id}</span>
                                <span class="table-badge">Table ${order.tableNumber}</span>
                            </div>
                            <span class="payment-status payment-${paymentStatus}">
                                ${paymentStatus === 'unpaid' ? '🔴 Unpaid' : '✅ Paid'}
                            </span>
                        </div>
                        
                        <div class="bill-details">
                            <div class="bill-row">
                                <span>Subtotal:</span>
                                <span>₹${subtotal}</span>
                            </div>
                            <div class="bill-row">
                                <span>Tax (5%):</span>
                                <span>₹${tax}</span>
                            </div>
                            <div class="bill-row total">
                                <span>Grand Total:</span>
                                <span>₹${grandTotal}</span>
                            </div>
                        </div>
                        
                        <div class="bill-actions">
                            <button class="btn btn-pay" 
                                    onclick="markAsPaid('${order.id}')"
                                    ${paymentStatus === 'paid' ? 'disabled' : ''}>
                                ✅ Mark as Paid
                            </button>
                            <button class="btn btn-view" onclick="viewBill('${order.id}')">
                                👁️ View Bill
                            </button>
                            <!-- FEATURE 2: Print Bill button — opens a dedicated print window -->
                            <button class="btn btn-print" onclick="printBill('${order.id}')">
                                🖨️ Print Bill
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        /**
         * Marks the a sp ai d status in the billing workflow.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function markAsPaid(orderId) {
            if (!payments[orderId] || payments[orderId] === 'unpaid') {
                payments[orderId] = 'paid';
                // FEATURE 4: Automatically free the table when bill is marked paid
                freeTableForOrder(orderId);
                renderBilling();
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // FEATURE 4 — Auto-Free Table on Bill Payment
        // Frees a table when all of its orders are paid.
        // ─────────────────────────────────────────────────────────────────
        function freeTableForOrder(orderId) {
            const paidOrder = orders.find(o => o.id === orderId);
            if (!paidOrder) return;

            const tableNum = paidOrder.tableNumber;

            // Check if ALL orders belonging to this table are now paid
            const tableOrders = orders.filter(o => o.tableNumber === tableNum);
            const allPaid = tableOrders.every(o => payments[o.id] === 'paid');

            if (allPaid) {
                // Set the in-memory table status to free
                const table = tables.find(t => t.number === tableNum);
                if (table) {
                    table.status = 'free';
                }
                // Immediately refresh the tables UI
                renderTables();
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // FEATURE 2 — Print Bill
        // Opens a clean invoice in a new browser tab and triggers print.
        // The main dashboard is completely unaffected.
        // ─────────────────────────────────────────────────────────────────
        function printBill(orderId) {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;

            // Get restaurant name from owner data
            let restaurantName = 'Restaurant';
            if (currentOwnerId) {
                const ownerData = JSON.parse(localStorage.getItem('owner_' + currentOwnerId) || '{}');
                if (ownerData && ownerData.restaurantName) {
                    restaurantName = ownerData.restaurantName;
                }
            }

            const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = Math.round(subtotal * 0.05);
            const grandTotal = subtotal + tax;
            const paymentStatus = payments[order.id] || 'unpaid';
            const orderDate = order.timestamp
                ? new Date(order.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                : (order.time || 'N/A');

            // Build items rows HTML
            const itemsHtml = order.items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td style="text-align:center">${item.quantity}</td>
                    <td style="text-align:right">&#8377;${item.price}</td>
                    <td style="text-align:right">&#8377;${item.price * item.quantity}</td>
                </tr>
            `).join('');

            // Self-contained printable invoice HTML
            const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bill – ${order.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; padding: 40px; max-width: 600px; margin: auto; }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { font-size: 26px; color: #d35400; }
    .header p { color: #666; font-size: 13px; margin-top: 4px; }
    .divider { border: none; border-top: 2px dashed #ccc; margin: 18px 0; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f4f4f4; padding: 8px 10px; text-align: left; font-size: 13px; border-bottom: 1px solid #ddd; }
    td { padding: 8px 10px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
    .totals { margin-left: auto; width: 260px; }
    .totals td { padding: 5px 10px; font-size: 14px; }
    .totals .grand { font-weight: 700; font-size: 16px; color: #d35400; border-top: 2px solid #d35400; }
    .status { text-align: center; margin-top: 20px; font-size: 15px; font-weight: 600;
              padding: 8px; border-radius: 6px;
              background: ${paymentStatus === 'paid' ? '#e6f9ee' : '#fff3cd'};
              color: ${paymentStatus === 'paid' ? '#1a7a40' : '#856404'}; }
    .footer { text-align: center; margin-top: 28px; font-size: 12px; color: #999; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🍽️ ${restaurantName}</h1>
    <p>Tax Invoice</p>
  </div>
  <hr class="divider">
  <div class="meta">
    <span><strong>Order ID:</strong> ${order.id}</span>
    <span><strong>Table:</strong> ${order.tableNumber}</span>
  </div>
  <div class="meta">
    <span><strong>Date &amp; Time:</strong> ${orderDate}</span>
    <span></span>
  </div>
  <hr class="divider">
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Rate</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <table class="totals">
    <tr><td>Subtotal</td><td style="text-align:right">&#8377;${subtotal}</td></tr>
    <tr><td>Tax (5%)</td><td style="text-align:right">&#8377;${tax}</td></tr>
    <tr class="grand"><td>Grand Total</td><td style="text-align:right">&#8377;${grandTotal}</td></tr>
  </table>
  <div class="status">${paymentStatus === 'paid' ? '✅ PAID' : '🔴 UNPAID'}</div>
  <hr class="divider">
  <div class="footer">Thank you for dining with us! Please visit again. 🙏</div>
</body>
</html>`;

            const printWindow = window.open('', '_blank', 'width=700,height=800');
            if (!printWindow) {
                alert('Please allow pop-ups for this site to print the bill.');
                return;
            }
            printWindow.document.write(invoiceHtml);
            printWindow.document.close();
            // Wait for resources to load, then print
            printWindow.onload = function() {
                printWindow.focus();
                printWindow.print();
            };
        }

        // ─────────────────────────────────────────────────────────────────
        // FEATURE 3 — Sales Analytics
        // Renders 4 metric cards: Today Sales, Weekly Sales,
        // Top Item Today, and Average Order Value.
        // ─────────────────────────────────────────────────────────────────
        function renderAnalytics() {
            const container = document.getElementById('analytics-container');
            if (!container) return;

            // ── Date boundaries ───────────────────────────────────────────
            const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7); // correct cross-month math

            // ── Helper: gross revenue for an order (with 5% tax) ─────────
            function orderRevenue(order) {
                const subtotal = order.items.reduce((s, i) => s + (i.price * i.quantity), 0);
                return subtotal + Math.round(subtotal * 0.05);
            }

            // ── Today's orders ───────────────────────────────────────────
            const todayOrders = orders.filter(o => o.timestamp && o.timestamp.slice(0, 10) === today);
            const todayCount = todayOrders.length;
            const todayRevenue = todayOrders.reduce((s, o) => s + orderRevenue(o), 0);

            // ── Weekly orders (last 7 days, inclusive of today) ───────────
            const weeklyOrders = orders.filter(o => {
                if (!o.timestamp) return false;
                return new Date(o.timestamp) >= sevenDaysAgo;
            });
            const weeklyCount = weeklyOrders.length;
            const weeklyRevenue = weeklyOrders.reduce((s, o) => s + orderRevenue(o), 0);

            // ── Top Selling Item Today ────────────────────────────────────
            const itemMap = {}; // { name: { qty, revenue } }
            todayOrders.forEach(order => {
                order.items.forEach(item => {
                    if (!itemMap[item.name]) itemMap[item.name] = { qty: 0, revenue: 0 };
                    itemMap[item.name].qty += item.quantity;
                    itemMap[item.name].revenue += item.price * item.quantity;
                });
            });
            const topItemName = Object.keys(itemMap).sort((a, b) => itemMap[b].qty - itemMap[a].qty)[0];
            const topItem = topItemName ? itemMap[topItemName] : null;

            // ── Average Order Value ───────────────────────────────────────
            const avgOrderValue = todayCount > 0 ? Math.round(todayRevenue / todayCount) : 0;

            // ── Render ───────────────────────────────────────────────────
            container.innerHTML = `
                <div class="analytics-grid">

                    <div class="analytics-card analytics-card--today">
                        <div class="analytics-card__icon">📅</div>
                        <div class="analytics-card__title">Today's Sales</div>
                        <div class="analytics-card__value">₹${todayRevenue.toLocaleString('en-IN')}</div>
                        <div class="analytics-card__meta">${todayCount} order${todayCount !== 1 ? 's' : ''}</div>
                    </div>

                    <div class="analytics-card analytics-card--week">
                        <div class="analytics-card__icon">📆</div>
                        <div class="analytics-card__title">Weekly Sales (Last 7 Days)</div>
                        <div class="analytics-card__value">₹${weeklyRevenue.toLocaleString('en-IN')}</div>
                        <div class="analytics-card__meta">${weeklyCount} order${weeklyCount !== 1 ? 's' : ''}</div>
                    </div>

                    <div class="analytics-card analytics-card--top">
                        <div class="analytics-card__icon">🏆</div>
                        <div class="analytics-card__title">Top Item Today</div>
                        ${topItem
                            ? `<div class="analytics-card__value" style="font-size:1.1rem">${topItemName}</div>
                               <div class="analytics-card__meta">${topItem.qty} portion${topItem.qty !== 1 ? 's' : ''} · ₹${topItem.revenue.toLocaleString('en-IN')}</div>`
                            : `<div class="analytics-card__value" style="font-size:1rem;color:#aaa">—</div>
                               <div class="analytics-card__meta">No orders today yet</div>`
                        }
                    </div>

                    <div class="analytics-card analytics-card--avg">
                        <div class="analytics-card__icon">💡</div>
                        <div class="analytics-card__title">Avg. Order Value</div>
                        <div class="analytics-card__value">₹${avgOrderValue.toLocaleString('en-IN')}</div>
                        <div class="analytics-card__meta">Per order today</div>
                    </div>

                </div>
            `;
        }

        /**
         * Displays the b il l details for billing review.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function viewBill(orderId) {
            const order = orders.find(o => o.id === orderId);
            if (order) {
                const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const tax = Math.round(subtotal * 0.05);
                const grandTotal = subtotal + tax;
                
                alert(`
BILL DETAILS
?????????????????????
Order ID: ${order.id}
Table Number: ${order.tableNumber}
Time: ${order.time}

ITEMS:
${order.items.map(item => `${item.name} × ${item.quantity} = ?${item.price * item.quantity}`).join('\n')}

Subtotal: ?${subtotal}
Tax (5%): ?${tax}
?????????????????????
GRAND TOTAL: ?${grandTotal}

Payment Status: ${(payments[order.id] || 'unpaid').toUpperCase()}
                `);
            }
        }

        /**
         * Renders the m en u into the corresponding dashboard section.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function renderMenu() {
            const container = document.getElementById('menu-items-container');
            
            if (menuItems.length === 0) {
                container.innerHTML = '<div class="empty-state"><h3>No menu items</h3><p>Add items to get started</p></div>';
                return;
            }
            
            container.innerHTML = menuItems.map(item => `
                <div class="menu-item-card ${!item.available ? 'unavailable' : ''}">
                    <img src="${item.image || DEFAULT_IMAGE}" alt="${item.name}" class="menu-item-image">
                    <div class="menu-item-details">
                        <div class="menu-item-name">${item.name}</div>
                        <div class="menu-item-category">${item.category || 'Main Course'}</div>
                        <span class="menu-item-type type-${item.type || 'veg'}">
                            ${(item.type || 'veg') === 'veg' ? '?? Veg' : '?? Non-Veg'}
                        </span>
                    </div>
                    <div class="menu-item-price">?${item.price}</div>
                    <div class="availability-toggle">
                        <div class="toggle-switch ${item.available ? 'active' : ''}" 
                             onclick="toggleAvailability(${item.id})">
                            <div class="toggle-switch-slider"></div>
                        </div>
                        <span style="font-size: 13px; color: ${item.available ? '#28a745' : '#dc3545'}; font-weight: 600;">
                            ${item.available ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                    <div class="menu-item-actions">
                        <button class="btn-edit" onclick="openEditModal(${item.id})">
                            ?? Edit
                        </button>
                        <button class="btn-change-image" onclick="changeImage(${item.id})">
                            ??? Change Image
                        </button>
                        <button class="btn-delete" onclick="deleteMenuItem(${item.id})">
                            ??? Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        /**
         * Toggles the a va il ab il it y and saves the new state immediately.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function toggleAvailability(itemId) {
            const item = menuItems.find(i => i.id === itemId);
            if (item) {
                item.available = !item.available;
                saveMenu();
                renderMenu();
            }
        }
        
        let editingItemId = null;
        
        /**
         * Opens the e di tm od al for editing within the modal workflow.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function openEditModal(itemId) {
            editingItemId = itemId;
            const item = menuItems.find(i => i.id === itemId);
            
            if (item) {
                document.getElementById('editItemName').value = item.name;
                document.getElementById('editItemPrice').value = item.price;
                document.getElementById('editItemCategory').value = item.category || 'Main Course';
                
                if (item.type === 'veg') {
                    document.getElementById('editTypeVeg').checked = true;
                } else {
                    document.getElementById('editTypeNonVeg').checked = true;
                }
                
                document.getElementById('editModal').classList.add('active');
            }
        }
        
        /**
         * Closes the e di tm od al and resets temporary editing state.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function closeEditModal() {
            editingItemId = null;
            document.getElementById('editModal').classList.remove('active');
        }
        
        /**
         * Saves the e di t to LocalStorage to keep persisted state synchronized.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function saveEdit() {
            const name = document.getElementById('editItemName').value.trim();
            const price = parseFloat(document.getElementById('editItemPrice').value);
            const category = document.getElementById('editItemCategory').value;
            const type = document.querySelector('input[name="editItemType"]:checked').value;
            
            if (!name) {
                alert('Please enter item name');
                return;
            }
            
            if (!price || price <= 0) {
                alert('Please enter a valid price');
                return;
            }
            
            const item = menuItems.find(i => i.id === editingItemId);
            if (item) {
                item.name = name;
                item.price = price;
                item.category = category;
                item.type = type;
                saveMenu();
                renderMenu();
                closeEditModal();
                alert('? Menu item updated successfully!');
            }
        }
        
        /**
         * Deletes the m en ui te m after explicit user confirmation.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function deleteMenuItem(itemId) {
            const item = menuItems.find(i => i.id === itemId);
            if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                menuItems = menuItems.filter(i => i.id !== itemId);
                saveMenu();
                renderMenu();
                alert('? Menu item deleted successfully!');
            }
        }
        
        document.getElementById('editModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeEditModal();
            }
        });

        /**
         * Checks the f or ne wo rd er s on an interval to keep data and notifications current.
         * Uses module state, DOM elements, and LocalStorage records relevant to this flow.
         * Returns or updates: Synchronizes UI state and persisted data for the next operation.
         */
        function checkForNewOrders() {
            if (currentOwnerId) {
                loadOrders();
                renderOrders();
                updateTableStatus();
                renderTables();
                renderBilling();
                // FEATURE 3: Refresh analytics in the background if the tab is visible
                const analyticsSection = document.getElementById('analytics-section');
                if (analyticsSection && analyticsSection.classList.contains('active')) {
                    renderAnalytics();
                }
            }
        }
        
        setInterval(checkForNewOrders, 3000);

        document.addEventListener('DOMContentLoaded', loadApp);
    


