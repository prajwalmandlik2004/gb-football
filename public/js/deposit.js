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

    payNowBtn.addEventListener('click', () => {
        qrCode.style.display = 'block';
    });

    uploadScreenshotBtn.addEventListener('click', () => {
        uploadScreenshot.style.display = 'block';
    });

    submitScreenshotBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        const userid = useridInput.value;
        const userpassword = userpasswordInput.value;
        const amount = depositAmountInput.value;
        const file = screenshotInput.files[0];

        if (!username || !userid || !userpassword || !amount || !file) {
            alert('Please fill out all fields and upload a screenshot.');
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
                alert('Deposit request submitted successfully.');
                location.reload();
            } else {
                alert('Failed to submit deposit request.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred.');
        }
    });
});


