require("dotenv").config();
import nodemailer from "nodemailer";

let sendSimpleEmail = async (dataSend) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_APP, // generated ethereal user
            pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Tung" <vuanhtung10@gmail.com>', // sender address
        to: dataSend.reciverEmail, // list of receivers
        subject: "Thông tin đặt lịch khám bệnh ✔", // Subject line
        // text: "Hello world?",
        html: getBodyHTMLEmail(dataSend),
    });
};

let getBodyHTMLEmail = (dataSend) => {
    let result = "";
    if (dataSend.language === "vi") {
        result = `
        <h3> Xin chào ${dataSend.patientName}! </h3>
        <p>Bạn nhận được email này vì đã đặt lịch khám bệnh online</p>
        <p>Thông tin đặt lịch khám bệnh</p>
        <div><b>Thời gian: ${dataSend.time}</b></div>
        <div><b>Bác sĩ: ${dataSend.doctorName}</b></div>

        <p>Nếu các thông tin trên la đúng sự thật xin vui lòng xác nhận vào đường link bên dưới</p>
        <div> <a href=${dataSend.redirectLink} target="_blank">Click here</a></div>
        `;
    }
    if (dataSend.language === "en") {
        result = `
        <h3> Dear ${dataSend.patientName}! </h3>
        <p>You received this email because you booked an online medical appointment</p>
        <p>Information to book a medical appointment
        </p>
        <div><b>Time: ${dataSend.time}</b></div>
        <div><b>Doctor: ${dataSend.doctorName}</b></div>

        <p>
        If the above information is true, please confirm by clicking the link below</p>
        <div> <a href=${dataSend.redirectLink} target="_blank">Click here</a></div>
        `;
    }
    return result;
};

// async..await is not allowed in global scope, must use a wrapper
async function main() {}

module.exports = {
    sendSimpleEmail: sendSimpleEmail,
};
