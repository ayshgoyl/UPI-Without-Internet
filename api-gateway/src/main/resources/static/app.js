document.addEventListener('DOMContentLoaded', () => {
    const paymentForm = document.getElementById('payment-form');
    const payBtn = document.getElementById('pay-btn');
    const btnText = payBtn.querySelector('.btn-text');
    const spinner = payBtn.querySelector('.spinner');

    const paymentResult = document.getElementById('payment-result');
    const resultIconFa = document.getElementById('result-icon-fa');
    const resultTitle = document.getElementById('result-title');
    const resultText = document.getElementById('result-text');
    const newPaymentBtn = document.getElementById('new-payment-btn');

    const networkStatus = document.getElementById('network-status');
    const statusIndicator = networkStatus.querySelector('.status-indicator');
    const statusText = networkStatus.querySelector('.status-text');

    let isOfflineMode = false;

    networkStatus.addEventListener('click', () => {
        isOfflineMode = !isOfflineMode;
        if (isOfflineMode) {
            statusIndicator.className = 'status-indicator offline';
            statusText.textContent = 'Offline';
        } else {
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = 'Online';
        }
    });

    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const upiId = document.getElementById('upi-id').value;
        const amount = document.getElementById('amount').value;

        if (!upiId || !amount) return;

        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        payBtn.disabled = true;

        try {
            const response = await fetch('/api/v1/payments/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const responseText = await response.text();

            if (response.ok) {
                if (responseText.includes('offline') || responseText.includes('queued')) {
                    showResult('offline', 'Queued Offline', responseText);
                } else {
                    showResult('success', 'Payment Successful', 'Your payment was processed successfully.');
                }
            } else {
                throw new Error('Server returned an error status.');
            }

        } catch (error) {
            console.error('Payment Error:', error);
            showResult('offline', 'Network Error', 'Could not reach server. Payment queued locally for sync.');
        } finally {
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            payBtn.disabled = false;
        }
    });

    newPaymentBtn.addEventListener('click', () => {
        paymentForm.reset();
        paymentForm.classList.remove('hidden');
        paymentResult.classList.add('hidden');
    });

    function showResult(type, title, message) {
        paymentForm.classList.add('hidden');
        paymentResult.classList.remove('hidden');

        paymentResult.className = `result-message ${type}`;
        resultTitle.textContent = title;
        resultText.textContent = message;

        if (type === 'success') {
            resultIconFa.className = 'fa-solid fa-check-circle';
        } else if (type === 'offline') {
            resultIconFa.className = 'fa-solid fa-clock';
            addTransactionToUI(document.getElementById('upi-id').value, document.getElementById('amount').value, true);
        } else {
            resultIconFa.className = 'fa-solid fa-circle-xmark';
        }
    }

    function addTransactionToUI(name, amount, isOffline) {
        const txList = document.querySelector('.transaction-list');
        const txHTML = `
            <div class="transaction-item ${isOffline ? 'offline-queued' : ''}">
                <div class="tx-icon ${isOffline ? 'offline' : 'receive'}">
                    <i class="fa-solid ${isOffline ? 'fa-clock' : 'fa-arrow-up'}"></i>
                </div>
                <div class="tx-details">
                    <span class="tx-name">${name}</span>
                    <span class="tx-time">${isOffline ? 'Offline • Queued' : 'Just now'}</span>
                </div>
                <div class="tx-amount negative">-₹${amount}</div>
            </div>
        `;
        txList.insertAdjacentHTML('afterbegin', txHTML);
    }
});
