import specialtyService from "../services/specialtyService";

let createSpecialty = async (req, res) => {
    try {
        let infor = await specialtyService.getProfileDoctorById(req.body);
        return res.status(200).json(infor);
    } catch (error) {
        return res.status(200).json({
            errCode: -1,
            message: "Error from server...",
        });
    }
};

let getAllSpecialty = async (req, res) => {
    try {
        let infor = await specialtyService.getAllSpecialty();
        return res.status(200).json(infor);
    } catch (error) {
        return res.status(200).json({
            errCode: -1,
            message: "Error from server...",
        });
    }
};

module.exports = {
    createSpecialty,
    getAllSpecialty,
};
