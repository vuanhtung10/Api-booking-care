import db from "../models/index";
import bcrypt from "bcryptjs";

const salt = bcrypt.genSaltSync(10);

let hashUserPassword = (password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let hashPassword = await bcrypt.hashSync(password, salt);
            resolve(hashPassword);
        } catch (e) {
            reject(e);
        }
    });
};

let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            let isExist = await checkUserEmail(email);
            if (isExist) {
                //user already exist
                let user = await db.User.findOne({
                    attributes: [
                        "email",
                        "roleId",
                        "password",
                        "firstName",
                        "lastName",
                    ],
                    where: { email: email },
                    raw: true,
                });
                if (user) {
                    //compare password
                    let check = await bcrypt.compareSync(
                        password,
                        user.password
                    );
                    if (check) {
                        userData.errCode = 0;
                        userData.errMessage = "ok";

                        delete user.password;
                        userData.user = user;
                    } else {
                        userData.errCode = 3;
                        userData.errMessage = "wrong password";
                    }
                } else {
                    userData.errCode = 3;
                    userData.errMessage = `user's not found~`;
                }
            } else {
                userData.errCode = 1;
                userData.errMessage = `your's email isn't exist in your system ,pls try other email`;
            }

            resolve(userData);
        } catch (error) {
            reject(error);
        }
    });
};

let checkUserEmail = (email) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { email: email },
            });
            if (user) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch (error) {
            reject(error);
        }
    });
};

let getAllUsers = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = "";
            if (userId === "ALL") {
                users = db.User.findAll({
                    attributes: {
                        exclude: ["password"],
                    },
                });
            }
            if (userId && userId !== "ALL") {
                users = await db.User.findOne({
                    where: { id: userId },
                    attributes: {
                        exclude: ["password"],
                    },
                });
            }
            resolve(users);
        } catch (error) {
            reject(error);
        }
    });
};

let createNewUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Check email is exitst ???
            let check = await checkUserEmail(data.email);
            if (check === true) {
                resolve({
                    errCode: 1,
                    errMessage:
                        "your email is already in used , pls try another email!!",
                });
            } else {
                let hashPasswordFromBcrypt = await hashUserPassword(
                    data.password
                );
                await db.User.create({
                    email: data.email,
                    password: hashPasswordFromBcrypt,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    address: data.address,
                    phonenumber: data.phonenumber,
                    gender: data.gender,
                    roleId: data.roleId,
                    positionId: data.positionId,
                    image: data.avatar,
                });
                console.log(data);
                console.log(hashPasswordFromBcrypt);
                resolve({
                    errCode: 0,
                    message: "ok",
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

let deleteUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { id: userId },
            });
            if (!user) {
                resolve({
                    errCode: 2,
                    errMessage: `The user isn't exist`,
                });
            }

            //    await user.destroy();
            await db.User.destroy({
                where: { id: userId },
            });
            resolve({
                errCode: 0,
                massage: `The user is deleted`,
            });
        } catch (error) {}
    });
};

let editUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(data);
            if (!data.id || !data.roleId || !data.positionId || !data.gender) {
                resolve({
                    errCode: 2,
                    errMessage: "missing required parameter !!",
                });
            } else {
                let user = await db.User.findOne({
                    where: { id: data.id },
                    raw: false,
                });
                console.log("---------------", user);
                if (user) {
                    user.firstName = data.firstName;
                    user.lastName = data.lastName;
                    user.address = data.address;
                    user.roleId = data.roleId;
                    user.positionId = data.positionId;
                    user.gender = data.gender;
                    user.phonenumber = data.phonenumber;
                    if (data.avatar) {
                        user.image = data.avatar;
                    }

                    await user.save();
                    // await db.User.save({
                    //     firstName:data.firstName,
                    //     lastName: data.lastName,
                    //     address: data.address
                    // });
                    resolve({
                        errCode: 0,
                        message: "update user success",
                    });
                } else {
                    resolve({
                        errCode: 1,
                        message: "user not found !!",
                    });
                }
            }
        } catch (error) {
            reject(error);
        }
    });
};

let getAllCodeService = (typeInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!typeInput) {
                resolve({
                    errCode: 1,
                    errMessage: "missing required parameters !!",
                });
            } else {
                let res = {};
                let allcode = await db.Allcode.findAll({
                    where: { type: typeInput },
                });
                res.errCode = 0;
                res.data = allcode;
                resolve(res);
            }
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    handleUserLogin: handleUserLogin,
    checkUserEmail: checkUserEmail,
    getAllUsers: getAllUsers,
    createNewUser: createNewUser,
    editUser: editUser,
    deleteUser: deleteUser,
    getAllCodeService: getAllCodeService,
};
