document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const dayNumber = today.getDay();
    const profitParagraphs = document.querySelectorAll('.profit-button');

    let profitMessage;

    switch (dayNumber) {
        case 0:
            profitMessage = "OFF";
            break;
        case 1:
            profitMessage = "3.30 %";
            break;
        case 2:
            profitMessage = "3.50 %";
            break;
        case 3:
            profitMessage = "4.10 %";
            break;
        case 4:
            profitMessage = "4.20 %";
            break;
        case 5:
            profitMessage = "4.05 %";
            break;
        case 6:
            profitMessage = "3.75 %";
            break;
        default:
            profitMessage = "OFF";
    }

    profitParagraphs.forEach(paragraph => {
        paragraph.textContent = profitMessage;
    });
});

