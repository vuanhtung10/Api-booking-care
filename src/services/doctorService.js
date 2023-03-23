import db from "../models/index";
require("dotenv").config();
import _, { reject } from "lodash";

const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;

let getAllTopDoctorHome = (limitInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = await db.User.findAll({
                limit: limitInput,
                where: { roleId: "R2" },
                order: [["createdAt", "DESC"]],
                attributes: {
                    exclude: ["password"],
                },
                include: [
                    {
                        model: db.Allcode,
                        as: "positionData",
                        attributes: ["valueEn", "valueVi"],
                    },
                    {
                        model: db.Allcode,
                        as: "genderData",
                        attributes: ["valueEn", "valueVi"],
                    },
                ],
                raw: true,
                nest: true,
            });
            resolve({
                errCode: 0,
                data: users,
            });
        } catch (error) {
            reject(error);
        }
    });
};

// let getAllDoctors= () => {
//     return new Promise((resolve,reject) => {
//         try {

//         } catch (error) {
//             reject(error)
//         }
//     })
// }

let getAllDoctors = async () => {
    try {
        let doctors = await db.User.findAll({
            where: { roleId: "R2" },
            attributes: {
                exclude: ["password", "image"],
            },
        });
        return {
            errCode: 0,
            data: doctors,
        };
    } catch (error) {
        return error;
    }
};

let saveDetailInfoDoctor = async (inputData) => {
    try {
        if (
            !inputData.doctorId ||
            !inputData.contentHTML ||
            !inputData.contentMarkdown ||
            !inputData.action ||
            !inputData.selectedPrice ||
            !inputData.selectedPayment ||
            !inputData.selectedProvince ||
            !inputData.nameClinic ||
            !inputData.addressClinic ||
            !inputData.note
        ) {
            return {
                errCode: 1,
                errMessage: "Missing parameter",
            };
        } else {
            // upsert to markdown table
            if (inputData.action === "CREATE") {
                await db.Markdown.create({
                    contentHTML: inputData.contentHTML,
                    contentMarkdown: inputData.contentMarkdown,
                    description: inputData.description,
                    doctorId: inputData.doctorId,
                });
            } else if (inputData.action === "EDIT") {
                let doctorMarkdown = await db.Markdown.findOne({
                    where: { doctorId: inputData.doctorId },
                    raw: false,
                });

                if (doctorMarkdown) {
                    doctorMarkdown.contentHTML = inputData.contentHTML;
                    doctorMarkdown.contentMarkdown = inputData.contentMarkdown;
                    doctorMarkdown.description = inputData.description;
                    doctorMarkdown.updatedAt = new Date();
                    await doctorMarkdown.save();
                }
            }

            // upsert to doctor_infor table
            let doctorInfor = await db.Doctor_Infor.findOne({
                where: {
                    doctorId: inputData.doctorId,
                },
                raw: false,
            });
            if (doctorInfor) {
                //update
                doctorInfor.priceId = inputData.selectedPrice;
                doctorInfor.provinceId = inputData.selectedProvince;
                doctorInfor.paymentId = inputData.selectedPayment;
                doctorInfor.nameClinic = inputData.nameClinic;
                doctorInfor.addressClinic = inputData.addressClinic;
                doctorInfor.note = inputData.note;

                await doctorInfor.save();
            } else {
                //create
                await db.Doctor_Infor.create({
                    doctorId: inputData.doctorId,
                    priceId: inputData.selectedPrice,
                    provinceId: inputData.selectedProvince,
                    paymentId: inputData.selectedPayment,
                    nameClinic: inputData.nameClinic,
                    addressClinic: inputData.addressClinic,
                    note: inputData.note,
                });
            }
            return {
                errCode: 0,
                errMessage: "save infor doctor success!",
            };
        }
    } catch (error) {
        return error;
    }
};

let getDetailDoctorById = async (id) => {
    try {
        if (!id) {
            return {
                errCode: 1,
                errMessage: "missing required parameter !",
            };
        } else {
            let data = await db.User.findOne({
                where: {
                    id: id,
                },
                attributes: {
                    exclude: ["password"],
                },
                include: [
                    {
                        model: db.Markdown,
                        attributes: [
                            "description",
                            "contentHTML",
                            "contentMarkdown",
                        ],
                    },
                    {
                        model: db.Allcode,
                        as: "positionData",
                        attributes: ["valueEn", "valueVi"],
                    },
                    {
                        model: db.Doctor_Infor,
                        attributes: {
                            exclude: ["id", "doctorId"],
                        },
                        include: [
                            {
                                model: db.Allcode,
                                as: "priceTypeData",
                                attributes: ["valueEn", "valueVi"],
                            },
                            {
                                model: db.Allcode,
                                as: "provinceTypeData",
                                attributes: ["valueEn", "valueVi"],
                            },
                            {
                                model: db.Allcode,
                                as: "paymentTypeData",
                                attributes: ["valueEn", "valueVi"],
                            },
                        ],
                    },
                ],
                raw: false,
                nest: true,
            });

            if (data && data.image) {
                data.image = Buffer.from(data.image, "base64").toString(
                    "binary"
                );
            }

            if (!data) {
                data = {};
            }

            return {
                errCode: 0,
                data: data,
            };
        }
    } catch (error) {
        return error;
    }
};

let bulkCreateSchedule = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("data", data);

            if (!data.arrSchedule | !data.doctorId || !data.fomatedDate) {
                resolve({
                    errCode: -1,
                    errMessage: " missing required param !",
                });
            } else {
                let schedule = data.arrSchedule;
                if (schedule && schedule.length > 0) {
                    schedule = schedule.map((item) => {
                        item.maxNumber = MAX_NUMBER_SCHEDULE;
                        return item;
                    });
                }

                //get all exitsting data
                let exitsting = await db.Schedule.findAll({
                    where: { doctorId: data.doctorId, date: data.fomatedDate },
                    attributes: ["timeType", "date", "doctorId", "maxNumber"],
                    raw: true,
                });

                //covert date
                // if (exitsting && exitsting.length > 0) {
                //     exitsting = exitsting.map((item) => {
                //         item.date = new Date(item.date).getTime();
                //         return item;
                //     });
                // }

                // compare difference
                let toCreate = _.differenceWith(schedule, exitsting, (a, b) => {
                    return a.timeType === b.timeType && +a.date === +b.date;
                });
                // let toCreate = _.differenceBy(schedule, exitsting, "timeType");
                console.log("differnt", toCreate);
                //create data
                if (toCreate && toCreate.length > 0) {
                    await db.Schedule.bulkCreate(toCreate);
                }

                resolve({
                    errCode: 0,
                    errMessage: "ok",
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

let getScheduleDoctorByDate = (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId || !date) {
                resolve({
                    errCode: 1,
                    errMessage: "missing parameter",
                });
            } else {
                let dataSchedule = await db.Schedule.findAll({
                    where: {
                        doctorId: doctorId,
                        date: date,
                    },

                    include: [
                        {
                            model: db.Allcode,
                            as: "timeTypeData",
                            attributes: ["valueEn", "valueVi"],
                        },
                        {
                            model: db.User,
                            as: "doctorData",
                            attributes: ["firstName", "lastName"],
                        },
                    ],
                    raw: false,
                    nest: true,
                });
                if (!dataSchedule) return (dataSchedule = []);

                resolve({
                    errCode: 0,
                    data: dataSchedule,
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

let getExtraInforDoctorById = (idInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!idInput) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing required parameters",
                });
            } else {
                let data = await db.Doctor_Infor.findOne({
                    where: {
                        doctorId: idInput,
                    },
                    attributes: {
                        exclude: ["id", "doctorId"],
                    },
                    include: [
                        {
                            model: db.Allcode,
                            as: "priceTypeData",
                            attributes: ["valueEn", "valueVi"],
                        },
                        {
                            model: db.Allcode,
                            as: "provinceTypeData",
                            attributes: ["valueEn", "valueVi"],
                        },
                        {
                            model: db.Allcode,
                            as: "paymentTypeData",
                            attributes: ["valueEn", "valueVi"],
                        },
                    ],
                    raw: false,
                    nest: true,
                });
                if (!data) data = {};
                console.log(data);
                resolve({
                    errCode: 0,
                    data: data,
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

let getProfileDoctorById = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: "missing required parameters",
                });
            } else {
                let data = await db.User.findOne({
                    where: {
                        id: inputId,
                    },
                    attributes: {
                        exclude: ["password"],
                    },
                    include: [
                        {
                            model: db.Markdown,
                            attributes: [
                                "description",
                                "contentHTML",
                                "contentMarkdown",
                            ],
                        },
                        {
                            model: db.Allcode,
                            as: "positionData",
                            attributes: ["valueEn", "valueVi"],
                        },
                        {
                            model: db.Doctor_Infor,
                            attributes: {
                                exclude: ["id", "doctorId"],
                            },
                            include: [
                                {
                                    model: db.Allcode,
                                    as: "priceTypeData",
                                    attributes: ["valueEn", "valueVi"],
                                },
                                {
                                    model: db.Allcode,
                                    as: "provinceTypeData",
                                    attributes: ["valueEn", "valueVi"],
                                },
                                {
                                    model: db.Allcode,
                                    as: "paymentTypeData",
                                    attributes: ["valueEn", "valueVi"],
                                },
                            ],
                        },
                    ],
                    raw: false,
                    nest: true,
                });

                if (data && data.image) {
                    data.image = Buffer.from(data.image, "base64").toString(
                        "binary"
                    );
                }

                if (!data) {
                    data = {};
                }

                resolve({
                    errCode: 0,
                    data: data,
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    getAllTopDoctorHome: getAllTopDoctorHome,
    getAllDoctors: getAllDoctors,
    saveDetailInfoDoctor: saveDetailInfoDoctor,
    getDetailDoctorById: getDetailDoctorById,
    bulkCreateSchedule: bulkCreateSchedule,
    getScheduleDoctorByDate: getScheduleDoctorByDate,
    getExtraInforDoctorById: getExtraInforDoctorById,
    getProfileDoctorById: getProfileDoctorById,
};
