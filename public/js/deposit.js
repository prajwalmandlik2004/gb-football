document.addEventListener('DOMContentLoaded', () => {
    const payNowBtn = document.getElementById('payNowBtn');
    const qrCode = document.getElementById('qrCode');
    const uploadScreenshotBtn = document.getElementById('uploadScreenshotBtn');
    const uploadScreenshot = document.getElementById('uploadScreenshot');
    const submitScreenshotBtn = document.getElementById('submitScreenshotBtn');
    const usernameInput = document.getElementById('username');
    const useridInput = document.getElementById('userid');
    const userpasswordInput = document.getElementById('userpassword');
    const depositAmountInput = document.getElementById('depositAmount');
    const screenshotInput = document.getElementById('screenshot');
    const bonusDisplay = document.getElementById('bonusDisplay'); // Added for bonus display

    // Function to update deposit status
    const updateDepositStatus = async (depositId, status) => {
        try {
            const response = await fetch('/updateDepositStatus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ depositId, status })
            });

            if (response.ok) {
                alert('Deposit status updated successfully');
                location.reload();
            } else {
                alert('Failed to update deposit status');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred.');
        }
    };

    // Function to validate deposit amount
    const validateDepositAmount = (amount) => {
        const parsedAmount = parseFloat(amount);
        return !isNaN(parsedAmount) && parsedAmount >= 100 && parsedAmount <= 1000000;
    };

    // Function to calculate and display bonus
    const calculateBonus = (amount) => {
        let bonus = 0;
        if (amount >= 1000 && amount < 2000) {
            bonus = 50;
        } else if (amount >= 2000 && amount < 5000) {
            bonus = 100;
        } else if (amount >= 5000 && amount < 10000) {
            bonus = 250;
        } else if (amount >= 10000 && amount < 20000) {
            bonus = 500;
        } else if (amount >= 20000 && amount < 30000) {
            bonus = 1000;
        } else if (amount >= 30000 && amount <= 50000) {
            bonus = 2000;
        }
        return bonus;
    };

    // Event listener for deposit amount input
    depositAmountInput.addEventListener('input', () => {
        const amount = parseFloat(depositAmountInput.value.trim());
        if (validateDepositAmount(amount)) {
            const bonusAmount = calculateBonus(amount);
            bonusDisplay.innerText = `Bonus: ₹${bonusAmount.toFixed(2)}`;
        } else {
            bonusDisplay.innerText = 'Invalid amount for bonus calculation';
        }
    });

    // Event listener for Pay Now button
    payNowBtn.addEventListener('click', () => {
        qrCode.style.display = 'block';
    });

    // Event listener for Upload Screenshot button
    uploadScreenshotBtn.addEventListener('click', () => {
        uploadScreenshot.style.display = 'block';
    });

    // Event listener for Submit Screenshot button
    submitScreenshotBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const userid = useridInput.value.trim();
        const userpassword = userpasswordInput.value.trim();
        const amount = depositAmountInput.value.trim();
        const file = screenshotInput.files[0];

        // Validate form inputs
        if (!username || !userid || !userpassword || !amount || !file) {
            alert('Please fill out all fields and upload a screenshot.');
            return;
        }

        // Validate deposit amount range
        if (!validateDepositAmount(amount)) {
            alert('Deposit amount must be between 100 and 1,000,000 INR.');
            return;
        }

        const formData = new FormData();
        formData.append('username', username);
        formData.append('userid', userid);
        formData.append('userpassword', userpassword);
        formData.append('amount', amount);
        formData.append('screenshot', file);

        try {
            const response = await fetch('/deposit', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Deposit request submitted successfully.✅');
                location.reload();
            } else {
                alert('Failed to submit deposit request.❌');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred.');
        }
    });
});


