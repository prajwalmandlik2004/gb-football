document.addEventListener('DOMContentLoaded', () => {
    const payNowBtn = document.getElementById('payNowBtn');
    const qrCode = document.getElementById('qrCode');
    const uploadScreenshotBtn = document.getElementById('uploadScreenshotBtn');
    const uploadScreenshot = document.getElementById('uploadScreenshot');
    const submitScreenshotBtn = document.getElementById('submitScreenshotBtn');
    const useridInput = document.getElementById('userid');
    const userpasswordInput = document.getElementById('userpassword');
    const depositAmountInput = document.getElementById('depositAmount');
    const screenshotInput = document.getElementById('screenshot');
    const amountButtons = document.querySelectorAll('.amount-btn');


    const validateDepositAmount = (amount) => {
        const parsedAmount = parseFloat(amount);
        return !isNaN(parsedAmount) && parsedAmount >= 300 && parsedAmount <= 1000000;
    };

    amountButtons.forEach(button => {
        button.addEventListener('click', function () {
            const amount = this.getAttribute('data-amount');
            depositAmountInput.value = amount;

            
            amountButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    payNowBtn.addEventListener('click', () => {
        if (!depositAmountInput.value) {
            alert('Please select an amount to deposit.');
            return;
        }
        qrCode.style.display = 'block';
    });


    uploadScreenshotBtn.addEventListener('click', () => {
        uploadScreenshot.style.display = 'block';
    });

    submitScreenshotBtn.addEventListener('click', async () => {
        const userid = useridInput.value.trim();
        const userpassword = userpasswordInput.value.trim();
        const amount = depositAmountInput.value.trim();
        const file = screenshotInput.files[0];

   
        if (!userid || !userpassword || !amount || !file) {
            alert('Please fill out all fields and upload a screenshot.');
            return;
        }

        if (!validateDepositAmount(amount)) {
            alert('Deposit amount must be between 300 and 1,000,000 INR.');
            return;
        }

        const formData = new FormData();
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



