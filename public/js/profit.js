document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const dayNumber = today.getDay();
    const profitParagraphs = document.querySelectorAll('.profit-button');

    let profitMessage;

    switch (dayNumber) {
        case 0:
            profitMessage = "2.10 %";
            break;
        case 1:
            profitMessage = "2.10 %";
            break;
        case 2:
            profitMessage = "2.20 %";
            break;
        case 3:
            profitMessage = "2.05 %";
            break;
        case 4:
            profitMessage = "2.05 %";
            break;
        case 5:
            profitMessage = "2.10 %";
            break;
        case 6:
            profitMessage = "2.05 %";
            break;
        default:
            profitMessage = "OFF";
    }

    profitParagraphs.forEach(paragraph => {
        paragraph.textContent = profitMessage;
    });
});

