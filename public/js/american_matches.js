document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const dayNumber = today.getDay();
    const dailyImage = document.querySelector('.daily-image-america');

    let imagePath;

    switch (dayNumber) {
        case 1: // Monday
            imagePath = './images/match_one.png';
            break;
        case 2: // Tuesday
            imagePath = './images/match_two.png';
            break;
        case 3: // Wednesday
            imagePath = './images/match_three.png';
            break;
        case 4: // Thursday
            imagePath = './images/4.png';
            break;
        case 5: // Friday
            imagePath = './images/5.png';
            break;
        case 6: // Saturday
            imagePath = './images/6.png';
            break;
        case 0: // Sunday
            imagePath = './images/8.png';
            break;
        default:
            imagePath = './images/default.png';
    }

    if (dailyImage) {
        dailyImage.src = imagePath;
    }
});


