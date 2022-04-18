import mongoose from 'mongoose';

const appDB = mongoose.connection.useDb('polymap');

const SharedRoute = new mongoose.Schema({
    from: String,
    to: String,
    codeType: {
        type: String,
        enum: ['qr', 'appclip'],
        default: 'appclip'
    },
    helloText: String,
    appClipURL: String,
})

appDB.model("sharedRoute", SharedRoute);

export default appDB
