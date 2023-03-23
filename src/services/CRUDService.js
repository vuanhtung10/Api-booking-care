import bcrypt from 'bcryptjs';
import db from '../models/index';

const salt = bcrypt.genSaltSync(10);


let createNewUser = async (data) => {
    return new Promise(async(resolve,reject) => {
        try {
            let hashPasswordFromBcrypt = await hashUserPassword(data.password);
            await db.User.create({
                email: data.email,
                password: hashPasswordFromBcrypt,
                firstName: data.firstName,
                lastName: data.lastName,
                address: data.address,
                phonenumber: data.phonenumber,
                gender: data.gender === '1' ? true : false,
                roleId: data.roleId,
            })
            console.log(data)
            console.log(hashPasswordFromBcrypt)
            resolve('ok create a new user success')
        } catch (error) {
            reject(error)
        }
    })
}

let hashUserPassword = (password) => {
    return new Promise(async(resolve, reject) => {
       try {
            let hashPassword =await bcrypt.hashSync(password, salt);
            resolve(hashPassword);
       }catch (e) {
            reject(e);
       }

    })

}

let getAllUser = () => {
    return new Promise( async (resolve, reject) => {
        try {
            let users = db.User.findAll({
                raw:true,
            });
            resolve(users)
        } catch (error) {
            reject(error)
        }
    })

}

let getUserInfoById = (userId) => {
    return new Promise(async(resolve,reject) => {
        try {
            let user = await db.User.findOne({
                where: { id: userId },
                raw: true,
            })
            if(user) {
                resolve(user)
            }
            else {
                resolve([])
            }
        } catch (error) {
            reject(error)
        }
    })
}

let updateUserData = async(data) => {
    
   try {
        let user =await db.User.findOne({
            where: { id: data.id}
        })
        if(user) {
            user.firstName = data.firstName;
            user.lastName = data.lastName;
            user.address = data.address;

            await user.save();
            let allUsers = await db.User.findAll();
            return allUsers
        }else {
            return
        }
   } catch (error) {
    console.log(error)
   }
}

let deleteUserById = (userId) => {
    return new Promise(async(resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: {id: userId}
            })
            if(user) {
                await user.destroy();
            }
            resolve(); // return;
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = {
    createNewUser: createNewUser,
    getAllUser:getAllUser,
    getUserInfoById: getUserInfoById,
    updateUserData:updateUserData,
    deleteUserById: deleteUserById
}