const User = require('../models/User');
const Subject = require('../models/Subject');

// @desc    Asignar una materia a un estudiante
// @route   POST /api/student-subjects/assign
// @access  Private
const assignSubjectToStudent = async (req, res) => {
    try {
        const { studentId, subjectId } = req.body;

        // Verificar que el estudiante existe
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }

        // Verificar que la materia existe
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Materia no encontrada' });
        }

        // Verificar si la materia ya está asignada
        if (student.subjects.includes(subjectId)) {
            return res.status(400).json({ message: 'La materia ya está asignada a este estudiante' });
        }

        // Asignar la materia al estudiante
        student.subjects.push(subjectId);
        await student.save();

        res.status(200).json({ message: 'Materia asignada exitosamente', student });
    } catch (error) {
        console.error('Error al asignar materia:', error);
        res.status(500).json({ message: 'Error al asignar la materia', error: error.message });
    }
};

// @desc    Obtener materias de un estudiante
// @route   GET /api/student-subjects/:studentId
// @access  Private
const getStudentSubjects = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await User.findById(studentId).populate('subjects');
        if (!student) {
            return res.status(404).json({ message: 'Estudiante no encontrado' });
        }

        res.status(200).json(student.subjects);
    } catch (error) {
        console.error('Error al obtener materias:', error);
        res.status(500).json({ message: 'Error al obtener las materias', error: error.message });
    }
};

module.exports = {
    assignSubjectToStudent,
    getStudentSubjects
}; 