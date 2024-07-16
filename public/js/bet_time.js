document.addEventListener('DOMContentLoaded', () => {
    const americaBetButton = document.querySelector('.america-bet');
    const indiaBetButton = document.querySelector('.india-bet');
    const japanBetButton = document.querySelector('.japan-bet');

    const now = new Date();
    const currentDay = now.getDay(); // 0 - Sunday, 1 - Monday, ..., 6 - Saturday
    const currentHour = now.getHours();

    const isBettingTime = (currentHour >= 10 && currentHour < 14) || (currentHour >= 18 && currentHour < 19);

    if (!isBettingTime) {
        disableBetButton(americaBetButton);
        disableBetButton(indiaBetButton);
        disableBetButton(japanBetButton);
    } else {
        switch (currentDay) {
            case 0: // Sunday
                disableBetButton(americaBetButton);
                disableBetButton(indiaBetButton);
                disableBetButton(japanBetButton);
                break;
            case 1: // Monday
                enableBetButton(americaBetButton);
                disableBetButton(indiaBetButton);
                disableBetButton(japanBetButton);
                break;
            case 2: // Tuesday
                disableBetButton(americaBetButton);
                enableBetButton(indiaBetButton);
                disableBetButton(japanBetButton);
                break;
            case 3: // Wednesday
                disableBetButton(americaBetButton);
                disableBetButton(indiaBetButton);
                enableBetButton(japanBetButton);
                break;
            case 4: // Thursday
                enableBetButton(americaBetButton);
                disableBetButton(indiaBetButton);
                disableBetButton(japanBetButton);
                break;
            case 5: // Friday
                disableBetButton(americaBetButton);
                enableBetButton(indiaBetButton);
                disableBetButton(japanBetButton);
                break;
            case 6: // Saturday
                disableBetButton(americaBetButton);
                disableBetButton(indiaBetButton);
                enableBetButton(japanBetButton);
                break;
        }
    }

    function disableBetButton(button) {
        if (button) {
            button.style.backgroundColor = 'red';
            button.style.pointerEvents = 'auto';
            button.addEventListener('click', (event) => {
                event.preventDefault();
                alert('Betting is off 🚫');
            });
        }
    }

    function enableBetButton(button) {
        if (button) {
            button.style.backgroundColor = 'rgb(8, 193, 8)';
            button.style.pointerEvents = 'auto';
            button.addEventListener('click', (event) => {
                event.preventDefault();
                window.location.href = '/bet';
                // Here, you might want to redirect to a betting page or handle the form submission.
            });
        }
    }
});


