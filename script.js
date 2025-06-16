document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const emailDisplay = document.getElementById('temp-email-address');
    const copyButton = document.getElementById('copy-button');
    const refreshButton = document.getElementById('refresh-button');
    const newAddressButton = document.getElementById('new-address-button');
    const countdownSpan = document.getElementById('countdown');
    const emailListUl = document.getElementById('email-list');
    const viewerPlaceholder = document.getElementById('viewer-placeholder');
    const viewerContent = document.getElementById('viewer-content');
    const emailFromSpan = document.getElementById('email-from');
    const emailSubjectSpan = document.getElementById('email-subject');
    const emailDateSpan = document.getElementById('email-date');
    const emailBodyDiv = document.getElementById('email-body');

    // API
    const API_BASE_URL = 'https://www.1secmail.com/api/v1/';

    // State
    let currentEmail = null;
    let inboxInterval = null;
    let countdownInterval = null;
    let countdownValue = 15;

    const generateNewAddress = async () => {
        resetState();
        emailDisplay.value = 'Generating...';
        try {
            const response = await fetch(`${API_BASE_URL}?action=genRandomMailbox&count=1`);
            if (!response.ok) throw new Error('Failed to fetch new address.');
            const data = await response.json();
            currentEmail = data[0];
            emailDisplay.value = currentEmail;
            startCheckingInbox();
        } catch (error) {
            console.error(error);
            emailDisplay.value = 'Error generating address.';
        }
    };

    const checkInbox = async () => {
        if (!currentEmail) return;

        const [login, domain] = currentEmail.split('@');
        try {
            const response = await fetch(`${API_BASE_URL}?action=getMessages&login=${login}&domain=${domain}`);
            if (!response.ok) throw new Error('Failed to fetch inbox.');
            const messages = await response.json();
            displayEmails(messages);
        } catch (error) {
            console.error(error);
        }
    };

    const displayEmails = (messages) => {
        emailListUl.innerHTML = '';
        if (messages.length === 0) {
            const li = document.createElement('li');
            li.className = 'placeholder';
            li.textContent = 'Inbox is empty.';
            emailListUl.appendChild(li);
        } else {
            messages.forEach(message => {
                const li = document.createElement('li');
                li.dataset.id = message.id;
                li.innerHTML = `<span class="from">${message.from}</span><span class="subject">${message.subject}</span>`;
                li.addEventListener('click', () => viewEmail(message.id));
                emailListUl.appendChild(li);
            });
        }
    };

    const viewEmail = async (id) => {
        // Highlight selected email
        document.querySelectorAll('#email-list li').forEach(li => li.classList.remove('selected'));
        document.querySelector(`#email-list li[data-id='${id}']`).classList.add('selected');
        
        viewerPlaceholder.classList.add('hidden');
        viewerContent.classList.add('hidden');
        
        const [login, domain] = currentEmail.split('@');
        try {
            const response = await fetch(`${API_BASE_URL}?action=readMessage&login=${login}&domain=${domain}&id=${id}`);
            if (!response.ok) throw new Error('Failed to fetch email content.');
            const emailData = await response.json();
            
            emailFromSpan.textContent = emailData.from;
            emailSubjectSpan.textContent = emailData.subject;
            emailDateSpan.textContent = emailData.date;
            // Use textContent for the body to prevent XSS from HTML emails
            emailBodyDiv.textContent = emailData.textBody;
            
            viewerContent.classList.remove('hidden');
        } catch (error) {
            console.error(error);
        }
    };

    const startCheckingInbox = () => {
        clearInterval(inboxInterval);
        clearInterval(countdownInterval);
        
        checkInbox(); // Check immediately
        inboxInterval = setInterval(checkInbox, 15000);
        
        countdownValue = 15;
        countdownSpan.textContent = `(${countdownValue})`;
        countdownInterval = setInterval(() => {
            countdownValue--;
            countdownSpan.textContent = `(${countdownValue})`;
            if (countdownValue <= 0) {
                countdownValue = 15;
            }
        }, 1000);
    };

    const resetState = () => {
        clearInterval(inboxInterval);
        clearInterval(countdownInterval);
        currentEmail = null;
        emailListUl.innerHTML = '<li class="placeholder">Waiting for emails...</li>';
        viewerContent.classList.add('hidden');
        viewerPlaceholder.classList.remove('hidden');
        countdownSpan.textContent = '(15)';
    };

    // Event Listeners
    copyButton.addEventListener('click', () => {
        if (!currentEmail) return;
        navigator.clipboard.writeText(currentEmail).then(() => {
            const originalText = copyButton.innerHTML;
            copyButton.innerHTML = 'Copied!';
            setTimeout(() => {
                copyButton.innerHTML = originalText;
            }, 1500);
        });
    });

    refreshButton.addEventListener('click', () => {
        if (!currentEmail) return;
        startCheckingInbox();
    });

    newAddressButton.addEventListener('click', generateNewAddress);

    // Initial Load
    generateNewAddress();
});
