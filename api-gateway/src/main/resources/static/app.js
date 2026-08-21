(() => {
    const USSD_CODE = '*99#';
    const DEFAULT_MPIN = '1234';
    const MSISDN = '9876543210';
    const VPA = '9876543210@upi';

    const dialInput = document.getElementById('dial-input');
    const keypad = document.getElementById('keypad');
    const backspaceBtn = document.getElementById('backspace-btn');
    const callBtn = document.getElementById('call-btn');
    const endCallBtn = document.getElementById('end-call-btn');
    const dialerApp = document.getElementById('dialer-app');
    const callScreen = document.getElementById('call-screen');
    const callLabel = document.getElementById('call-label');
    const callNumber = document.getElementById('call-number');
    const callTimer = document.getElementById('call-timer');
    const overlay = document.getElementById('ussd-overlay');
    const ussdTitle = document.getElementById('ussd-title');
    const ussdBody = document.getElementById('ussd-body');
    const ussdOptions = document.getElementById('ussd-options');
    const ussdReply = document.getElementById('ussd-reply');
    const ussdInputWrap = document.getElementById('ussd-input-wrap');
    const ussdSend = document.getElementById('ussd-send');
    const ussdCancel = document.getElementById('ussd-cancel');
    const clockEl = document.getElementById('clock');

    const state = {
        screen: 'home',
        mpin: DEFAULT_MPIN,
        balance: 12500.0,
        payee: '',
        amount: '',
        pendingPinAction: null,
        statements: [
            { dir: 'CR', party: 'Alice', amount: 500, note: 'Settled' },
            { dir: 'DR', party: 'Coffee Shop', amount: 120, note: 'Success' }
        ]
    };

    function tickClock() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    tickClock();
    setInterval(tickClock, 15000);

    keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-key]');
        if (!btn) return;
        dialInput.value += btn.dataset.key;
        dialInput.focus();
    });

    backspaceBtn.addEventListener('click', () => {
        dialInput.value = dialInput.value.slice(0, -1);
        dialInput.focus();
    });

    dialInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            placeCall();
        }
    });

    callBtn.addEventListener('click', placeCall);
    endCallBtn.addEventListener('click', hangUp);
    ussdCancel.addEventListener('click', closeUssd);
    ussdSend.addEventListener('click', submitUssdSafely);
    ussdOptions.addEventListener('click', (e) => {
        const option = e.target.closest('button[data-reply]');
        if (!option) return;
        ussdReply.value = option.dataset.reply;
        submitUssdSafely();
    });
    ussdReply.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitUssdSafely();
        }
    });

    function placeCall() {
        const code = dialInput.value.trim();
        if (!code) return;

        showCallScreen(code);

        if (code === USSD_CODE) {
            callLabel.textContent = 'Running USSD code…';
            callTimer.textContent = 'Unstructured Supplementary Service Data';
            setTimeout(() => openMainMenu(), 700);
            return;
        }

        if (/^\*.+#$/.test(code)) {
            callLabel.textContent = 'MMI code';
            callTimer.textContent = '';
            setTimeout(() => {
                openUssd({
                    title: 'Phone',
                    body: 'Connection problem or invalid MMI code.',
                    screen: 'end',
                    input: false
                });
            }, 600);
            return;
        }

        callLabel.textContent = 'Calling…';
        callTimer.textContent = 'Voice call (test interface)';
        setTimeout(() => {
            callLabel.textContent = 'Call ended';
            callTimer.textContent = 'Not reachable — use *99# for UPI USSD';
        }, 1600);
    }

    function showCallScreen(number) {
        dialerApp.classList.add('hidden');
        callScreen.classList.remove('hidden');
        callNumber.textContent = number;
    }

    function hangUp() {
        closeUssd();
        callScreen.classList.add('hidden');
        dialerApp.classList.remove('hidden');
        callLabel.textContent = 'Calling…';
        callTimer.textContent = 'USSD';
    }

    function closeUssd() {
        overlay.classList.add('hidden');
        state.screen = 'home';
        ussdReply.value = '';
        hangUpToDialerIfIdle();
    }

    function hangUpToDialerIfIdle() {
        if (overlay.classList.contains('hidden')) {
            callScreen.classList.add('hidden');
            dialerApp.classList.remove('hidden');
        }
    }

    function openUssd({ title, body, screen, input = true }) {
        ussdTitle.textContent = title;
        ussdBody.textContent = body;
        state.screen = screen;
        overlay.classList.remove('hidden');
        ussdInputWrap.classList.toggle('hidden', !input);
        ussdSend.classList.toggle('hidden', !input);
        renderUssdOptions(screen, body, input);
        ussdReply.value = '';
        if (input) {
            setTimeout(() => ussdReply.focus(), 50);
        }
    }

    function renderUssdOptions(screen, body, input) {
        ussdOptions.innerHTML = '';
        const options = getUssdOptions(screen, body);
        ussdOptions.classList.toggle('hidden', !input || options.length === 0);

        options.forEach((item) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ussd-option';
            button.dataset.reply = item.reply;
            button.setAttribute('aria-label', 'Reply ' + item.reply + ': ' + item.label);

            const key = document.createElement('span');
            key.className = 'ussd-option-key';
            key.textContent = item.reply;

            const label = document.createElement('span');
            label.className = 'ussd-option-text';
            label.textContent = item.label;

            if (item.microservice) {
                const microservice = document.createElement('span');
                microservice.className = 'ussd-option-service';
                microservice.textContent = item.microservice + ' Microservice';
                label.append(document.createElement('br'), microservice);
            }

            button.append(key, label);
            ussdOptions.append(button);
        });
    }

    function getUssdOptions(screen, body) {
        const menus = {
            main: [
                ['1', 'Send Money', 'Payment Transaction'],
                ['2', 'Check Balance', 'Wallet Balance'],
                ['3', 'Mini Statement', 'Payment Transaction'],
                ['4', 'My Account', 'User Account'],
                ['5', 'QR / Collect', 'QR Payment'],
                ['6', 'Change MPIN', 'User Account'],
                ['7', 'Service Map', 'API Gateway'],
                ['0', 'Exit', 'API Gateway']
            ],
            account: [
                ['1', 'Linked mobile', 'User Account'],
                ['2', 'Linked VPA', 'User Account'],
                ['3', 'Language / RBAC profile', 'User Account'],
                ['0', 'Home', 'API Gateway']
            ],
            qr: [
                ['1', 'Generate collect QR ref', 'QR Payment'],
                ['2', 'Pay using QR reference', 'QR Payment'],
                ['0', 'Home', 'API Gateway']
            ]
        };

        if (menus[screen]) {
            return menus[screen].map(([reply, label, microservice]) => ({ reply, label, microservice }));
        }

        return body
            .split('\n')
            .map((line) => line.match(/^(\d)\s+(.+)$/))
            .filter(Boolean)
            .map((match) => ({ reply: match[1], label: match[2] }));
    }

    function openMainMenu() {
        openUssd({
            title: 'UPI',
            screen: 'main',
            body: ''
        });
    }

    function submitUssdSafely() {
        submitUssd().catch((err) => {
            openUssd({
                title: 'Service Error',
                screen: 'end',
                input: false,
                body:
                    'Database write was not completed.\n' +
                    'Reason: ' + (err.message || 'Unable to reach service') +
                    '\n\nCancel to close.'
            });
        });
    }

    async function submitUssd() {
        const reply = ussdReply.value.trim();
        const screen = state.screen;

        if (screen === 'end') {
            closeUssd();
            return;
        }

        if (screen === 'main') {
            handleMain(reply);
            return;
        }
        if (screen === 'send.payee') {
            if (!reply) return toastBody('Enter UPI ID or mobile');
            state.payee = reply;
            openUssd({
                title: 'Send Money',
                screen: 'send.amount',
                body: 'Payee: ' + state.payee + '\nEnter amount (INR):'
            });
            return;
        }
        if (screen === 'send.amount') {
            const amt = Number(reply);
            if (!amt || amt <= 0) return toastBody('Enter a valid amount');
            state.amount = amt.toFixed(2);
            state.pendingPinAction = 'send';
            openUssd({
                title: 'Send Money',
                screen: 'pin',
                body: 'Paying ₹' + state.amount + ' to\n' + state.payee + '\nEnter MPIN:'
            });
            return;
        }
        if (screen === 'pin') {
            await handlePin(reply);
            return;
        }
        if (screen === 'account') {
            await handleAccount(reply);
            return;
        }
        if (screen === 'qr') {
            handleQr(reply);
            return;
        }
        if (screen === 'qr.amount') {
            const amt = Number(reply);
            if (!amt || amt <= 0) return toastBody('Enter a valid amount');
            const ref = 'QR' + Date.now().toString(36).toUpperCase();
            await recordQrPayment({
                referenceId: ref,
                actionType: 'COLLECT',
                upiId: VPA,
                amount: amt.toFixed(2)
            });
            openUssd({
                title: 'QR Payment',
                screen: 'end',
                input: false,
                body:
                    'Collect request created.\n' +
                    'Amount: ₹' + amt.toFixed(2) + '\n' +
                    'VPA: ' + VPA + '\n' +
                    'Ref: ' + ref + '\n\n' +
                    'Show this reference at the merchant.\nTLS QR payload is issued by qr-payment-service.\n\nCancel to close.'
            });
            return;
        }
        if (screen === 'qr.payref') {
            if (!reply) return toastBody('Enter QR reference');
            state.payee = 'qr:' + reply;
            await recordQrPayment({
                referenceId: reply,
                actionType: 'PAY',
                upiId: VPA,
                amount: 'n/a'
            });
            openUssd({
                title: 'QR Pay',
                screen: 'send.amount',
                body: 'QR ref: ' + reply + '\nEnter amount (INR):'
            });
            return;
        }
        if (screen === 'changepin.new') {
            if (!/^\d{4}$/.test(reply)) return toastBody('MPIN must be 4 digits');
            state._newPin = reply;
            openUssd({
                title: 'Change MPIN',
                screen: 'changepin.confirm',
                body: 'Re-enter new MPIN:'
            });
            return;
        }
        if (screen === 'changepin.confirm') {
            if (reply !== state._newPin) {
                openUssd({
                    title: 'Change MPIN',
                    screen: 'end',
                    input: false,
                    body: 'MPINs do not match. Session ended.'
                });
                return;
            }
            state.mpin = reply;
            openUssd({
                title: 'Change MPIN',
                screen: 'end',
                input: false,
                body: 'MPIN updated in user-account session.\nCancel to close.'
            });
        }
    }

    function handleMain(reply) {
        switch (reply) {
            case '1':
                openUssd({
                    title: 'Send Money',
                    screen: 'send.payee',
                    body: 'payment-transaction-service\nEnter UPI ID / mobile:'
                });
                break;
            case '2':
                state.pendingPinAction = 'balance';
                openUssd({
                    title: 'Balance',
                    screen: 'pin',
                    body: 'wallet-balance-service\nEnter MPIN to view balance:'
                });
                break;
            case '3':
                state.pendingPinAction = 'statement';
                openUssd({
                    title: 'Mini Statement',
                    screen: 'pin',
                    body: 'Enter MPIN:'
                });
                break;
            case '4':
                openUssd({
                    title: 'My Account',
                    screen: 'account',
                    body:
                        'user-account-service\n\n' +
                        '1 Linked mobile\n' +
                        '2 Linked VPA\n' +
                        '3 Language / RBAC profile\n' +
                        '0 Home'
                });
                break;
            case '5':
                openUssd({
                    title: 'QR / Collect',
                    screen: 'qr',
                    body:
                        'qr-payment-service (HTTPS/TLS)\n\n' +
                        '1 Generate collect QR ref\n' +
                        '2 Pay using QR reference\n' +
                        '0 Home'
                });
                break;
            case '6':
                state.pendingPinAction = 'changepin';
                openUssd({
                    title: 'Change MPIN',
                    screen: 'pin',
                    body: 'Enter current MPIN:'
                });
                break;
            case '7':
                openUssd({
                    title: 'Service Map',
                    screen: 'end',
                    input: false,
                    body:
                        '1 Payment txn svc : Send money\n' +
                        '2 Wallet balance  : Check bal\n' +
                        '3 Mini statement  : Local demo history\n' +
                        '4 User account    : Profile / MPIN\n' +
                        '5 QR payment svc  : Collect / pay\n' +
                        'Gateway : this phone UI\n\n' +
                        'Cancel to close.'
                });
                break;
            case '0':
                closeUssd();
                break;
            default:
                toastBody('Invalid option. Try 0-7.');
        }
    }

    async function handleAccount(reply) {
        if (reply === '0') {
            openMainMenu();
            return;
        }
        const profile = await fetchUserProfile();
        if (reply === '1') {
            openUssd({
                title: 'My Account',
                screen: 'end',
                input: false,
                body: 'Linked mobile\n' + profile.mobileNumber + '\nNew user_accounts row saved.\nSIM authenticated via USSD.\nCancel to close.'
            });
            return;
        }
        if (reply === '2') {
            openUssd({
                title: 'My Account',
                screen: 'end',
                input: false,
                body: 'Primary VPA\n' + profile.upiId + '\nNew user_accounts row saved.\nCancel to close.'
            });
            return;
        }
        if (reply === '3') {
            openUssd({
                title: 'My Account',
                screen: 'end',
                input: false,
                body: 'Profile: ' + profile.roleName + '\nRBAC: payments, wallet-read\nLanguage: ' + profile.languageCode + '\nNew user_accounts row saved.\nCancel to close.'
            });
            return;
        }
        toastBody('Invalid option.');
    }

    function handleQr(reply) {
        if (reply === '0') {
            openMainMenu();
            return;
        }
        if (reply === '1') {
            openUssd({
                title: 'QR Collect',
                screen: 'qr.amount',
                body: 'Enter collect amount (INR):'
            });
            return;
        }
        if (reply === '2') {
            openUssd({
                title: 'QR Pay',
                screen: 'qr.payref',
                body: 'Enter merchant QR reference:'
            });
            return;
        }
        toastBody('Invalid option.');
    }

    async function handlePin(reply) {
        if (reply !== state.mpin) {
            openUssd({
                title: 'UPI',
                screen: 'end',
                input: false,
                body: 'Incorrect MPIN.\nSession ended.'
            });
            return;
        }

        const action = state.pendingPinAction;
        state.pendingPinAction = null;

        if (action === 'balance') {
            const wallet = await fetchWalletBalance();
            state.balance = Number(wallet.balance);
            openUssd({
                title: 'Balance',
                screen: 'end',
                input: false,
                body:
                    'Available wallet balance\n₹' +
                    formatMoney(state.balance) +
                    '\nNew wallets row saved by wallet-balance-service.\n\nCancel to close.'
            });
            return;
        }
        if (action === 'statement') {
            const lines = state.statements
                .slice(0, 5)
                .map((tx, i) => (i + 1) + '. ' + tx.dir + ' ₹' + tx.amount + ' ' + tx.party + ' (' + tx.note + ')')
                .join('\n');
            openUssd({
                title: 'Mini Statement',
                screen: 'end',
                input: false,
                body: (lines || 'No transactions') + '\n\nCancel to close.'
            });
            return;
        }
        if (action === 'changepin') {
            openUssd({
                title: 'Change MPIN',
                screen: 'changepin.new',
                body: 'Enter new 4-digit MPIN:'
            });
            return;
        }
        if (action === 'send') {
            await sendMoney();
        }
    }

    async function sendMoney() {
        openUssd({
            title: 'Send Money',
            screen: 'end',
            input: false,
            body: 'Sending to payment-transaction-service…'
        });

        try {
            const response = await fetch('/api/v1/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    upiId: state.payee,
                    amount: state.amount,
                    note: 'USSD *99#'
                })
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(text || 'Payment service returned HTTP ' + response.status);
            }
            const idMatch = text.match(/Transaction ID:\s*(\S+)/i);
            const txnId = idMatch ? idMatch[1] : crypto.randomUUID();

            state.balance = Math.max(0, state.balance - Number(state.amount));
            state.statements.unshift({
                dir: 'DR',
                party: state.payee,
                amount: Number(state.amount),
                note: 'Success'
            });

            openUssd({
                title: 'Send Money',
                screen: 'end',
                input: false,
                body:
                    'Accepted.\n' +
                    'To: ' + state.payee + '\n' +
                    'Amt: ₹' + state.amount + '\n' +
                    'Txn: ' + txnId + '\n\n' +
                    text +
                    '\n\nCancel to close.'
            });
        } catch (err) {
            openUssd({
                title: 'Send Money',
                screen: 'end',
                input: false,
                body:
                    'Payment failed.\n' +
                    'To: ' + state.payee + '\n' +
                    'Amt: ₹' + state.amount + '\n' +
                    'Reason: ' + (err.message || 'Unable to reach payment service') +
                    '\n\nCancel to close.'
            });
        }
    }

    async function fetchUserProfile() {
        const response = await fetch('/api/v1/users/profile');
        if (!response.ok) {
            throw new Error('User service returned HTTP ' + response.status);
        }
        return await response.json();
    }

    async function fetchWalletBalance() {
        const response = await fetch('/api/v1/wallets/' + encodeURIComponent(VPA));
        if (!response.ok) {
            throw new Error('Wallet service returned HTTP ' + response.status);
        }
        return await response.json();
    }

    async function recordQrPayment(payload) {
        const response = await fetch('/api/v1/qr/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error('QR service returned HTTP ' + response.status);
        }
        return await response.json();
    }

    function toastBody(msg) {
        const current = ussdBody.textContent.replace(/\n\n! .+$/s, '');
        ussdBody.textContent = current + '\n\n! ' + msg;
    }

    function formatMoney(n) {
        return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
})();
