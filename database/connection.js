const mongoose = require('mongoose');


mongoose.connect(process.env.CONNECTION_MONGO, { autoIndex: false })
    .then(() => console.log("Connected Successfully !!"))
    .catch((error) => console.log(error));


