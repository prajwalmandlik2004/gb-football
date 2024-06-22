document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const dayNumber = today.getDay();
    const dailyImage = document.querySelector('.daily-image-japan');

    let imagePath;

    switch (dayNumber) {
        case 1: // Monday
            imagePath = './images/5.png';
            break;
        case 2: // Tuesday
            imagePath = './images/6.png';
            break;
        case 3: // Wednesday
            imagePath = './images/4.png';
            break;
        case 4: // Thursday
            imagePath = './images/8.png';
            break;
        case 5: // Friday
            imagePath = './images/match_three.png';
            break;
        case 6: // Saturday
            imagePath = './images/match_two.png';
            break;
        case 0: // Sunday
            imagePath = './images/default.png';
            break;
        default:
            imagePath = './images/default.png';
    }

    if (dailyImage) {
        dailyImage.src = imagePath;
    }
});


