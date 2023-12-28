const db = require("../config/connection");
const otpgen = require("otp-generator");
const crud = require("../helper/crudquery");
const TRANS = require("../config/transaction");
const bcrypt = require("bcryptjs");

const OTP = {};

OTP.createOTP = async params => {
    const user_id = params.user_id;
    let date = new Date();
    date.setMinutes(date.getMinutes() + 5);
    const otpCode = otpgen.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
    const salt = bcrypt.genSaltSync(10);
    const encodeOtp = bcrypt.hashSync(otpCode, salt);
    const client = await db.connect();
    const data_otp = {
        user_id: user_id,
        otp_code: encodeOtp,
        otp_timelimit: date,
    };
    await client.query(TRANS.BEGIN);
    try {
        //delete last created OTP ;
        const deleteOTP = await client.query(
            `delete from otp_transaction where user_id = '${user_id}'`
        );
        const [que, val] = crud.insertItem(
            "otp_transaction",
            data_otp,
            "otp_code"
        );
        const insertItem = await client.query(que, val);
        await client.query(TRANS.COMMIT);
        return otpCode;
    } catch (error) {
        console.log(error);
        await client.query(TRANS.ROLLBACK);
        throw error.message;
    } finally {
        client.release();
    }
};

module.exports = OTP;
