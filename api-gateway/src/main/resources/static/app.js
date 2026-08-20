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
    ussdSend.addEventListener('click', submitUssd);
    ussdReply.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitUssd();
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
        ussdReply.value = '';
        if (input) {
            setTimeout(() => ussdReply.focus(), 50);
        }
    }

    function openMainMenu() {
        openUssd({
            title: 'UPI',
            screen: 'main',
            body:
                'Welcome to NUUP (*99#)\n' +
                'MSISDN ' + MSISDN + '\n\n' +
                '1 Send Money (Payment)\n' +
                '2 Check Balance (Wallet)\n' +
                '3 Mini Statement\n' +
                '4 My Account (User)\n' +
                '5 QR / Collect (QR Svc)\n' +
                '6 Sync Offline Txns\n' +
                '7 Change MPIN\n' +
                '8 Service Map\n' +
                '0 Exit'
        });
    }

    function submitUssd() {
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
            handlePin(reply);
            return;
        }
        if (screen === 'account') {
            handleAccount(reply);
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
                syncOffline();
                break;
            case '7':
                state.pendingPinAction = 'changepin';
                openUssd({
                    title: 'Change MPIN',
                    screen: 'pin',
                    body: 'Enter current MPIN:'
                });
                break;
            case '8':
                openUssd({
                    title: 'Service Map',
                    screen: 'end',
                    input: false,
                    body:
                        '1 Payment txn svc : Send money\n' +
                        '2 Wallet balance  : Check bal\n' +
                        '3 Mini statement  : Local + queued\n' +
                        '4 User account    : Profile / MPIN\n' +
                        '5 QR payment svc  : Collect / pay\n' +
                        '6 Sync notify svc : Retry / backoff\n' +
                        'Gateway : this phone UI\n\n' +
                        'Cancel to close.'
                });
                break;
            case '0':
                closeUssd();
                break;
            default:
                toastBody('Invalid option. Try 0-8.');
        }
    }

    function handleAccount(reply) {
        if (reply === '0') {
            openMainMenu();
            return;
        }
        if (reply === '1') {
            openUssd({
                title: 'My Account',
                screen: 'end',
                input: false,
                body: 'Linked mobile\n' + MSISDN + '\nSIM authenticated via USSD.\nCancel to close.'
            });
            return;
        }
        if (reply === '2') {
            openUssd({
                title: 'My Account',
                screen: 'end',
                input: false,
                body: 'Primary VPA\n' + VPA + '\nCancel to close.'
            });
            return;
        }
        if (reply === '3') {
            openUssd({
                title: 'My Account',
                screen: 'end',
                input: false,
                body: 'Profile: CUSTOMER\nRBAC: payments, wallet-read, sync\nLanguage: EN\nCancel to close.'
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

    function handlePin(reply) {
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
            openUssd({
                title: 'Balance',
                screen: 'end',
                input: false,
                body:
                    'Available (offline wallet)\n₹' +
                    formatMoney(state.balance) +
                    '\nLocked writes use pessimistic DB lock on wallet-balance-service.\n\nCancel to close.'
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
            sendMoney();
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
            const queued = !response.ok || /offline|queued|unreachable/i.test(text);
            const idMatch = text.match(/Transaction ID:\s*(\S+)/i);
            const txnId = idMatch ? idMatch[1] : crypto.randomUUID();

            if (queued) {
                state.statements.unshift({
                    dir: 'DR',
                    party: state.payee,
                    amount: Number(state.amount),
                    note: 'Queued'
                });
            } else {
                state.balance = Math.max(0, state.balance - Number(state.amount));
                state.statements.unshift({
                    dir: 'DR',
                    party: state.payee,
                    amount: Number(state.amount),
                    note: 'Success'
                });
            }

            openUssd({
                title: 'Send Money',
                screen: 'end',
                input: false,
                body:
                    (queued ? 'Queued offline (circuit open).\n' : 'Accepted.\n') +
                    'To: ' + state.payee + '\n' +
                    'Amt: ₹' + state.amount + '\n' +
                    'Txn: ' + txnId + '\n\n' +
                    text +
                    '\n\nCancel to close.'
            });
        } catch (err) {
            const txnId = crypto.randomUUID();
            state.statements.unshift({
                dir: 'DR',
                party: state.payee,
                amount: Number(state.amount),
                note: 'Local queue'
            });
            openUssd({
                title: 'Send Money',
                screen: 'end',
                input: false,
                body:
                    'Network error. Stored locally.\n' +
                    'To: ' + state.payee + '\n' +
                    'Amt: ₹' + state.amount + '\n' +
                    'Txn: ' + txnId + '\nUse option 6 to sync.\n\nCancel to close.'
            });
        }
    }

    async function syncOffline() {
        openUssd({
            title: 'Sync',
            screen: 'end',
            input: false,
            body: 'Contacting sync-notification-service…\nExponential backoff 2s, 4s, 8s, 16s'
        });

        const queued = state.statements.filter((tx) => tx.note === 'Queued' || tx.note === 'Local queue');
        try {
            await fetch('/api/v1/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ upiId: 'sync@upi', amount: '0', note: 'USSD-SYNC' })
            });
            queued.forEach((tx) => {
                tx.note = 'Sync attempted';
            });
            openUssd({
                title: 'Sync',
                screen: 'end',
                input: false,
                body:
                    'Sync request published to Kafka\n(offline-payments-topic).\n' +
                    queued.length +
                    ' queued item(s) handed to retry worker.\n\nCancel to close.'
            });
        } catch (err) {
            openUssd({
                title: 'Sync',
                screen: 'end',
                input: false,
                body:
                    'Sync worker unreachable.\n' +
                    queued.length +
                    ' txn(s) remain queued.\nWill retry with backoff.\n\nCancel to close.'
            });
        }
    }

    function toastBody(msg) {
        const current = ussdBody.textContent.replace(/\n\n! .+$/s, '');
        ussdBody.textContent = current + '\n\n! ' + msg;
    }

    function formatMoney(n) {
        return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
})();
