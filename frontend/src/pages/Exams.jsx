import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosConfig";
import Swal from "sweetalert2";
import "../styles/Exams.css";
import { FaEdit, FaTrash } from "react-icons/fa";

const Exams = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [submittedExams, setSubmittedExams] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    subject: "",
    questionText: "",
    correctAnswer: "",
    score: 10,
  });
  const [questionsList, setQuestionsList] = useState([]);
  const [examConfig, setExamConfig] = useState({
    timeLimit: 30,
    hasTimeLimit: false,
  });
  const [showQuestionSelection, setShowQuestionSelection] = useState(false);
  const [examToReview, setExamToReview] = useState(null);
  const [examAnswers, setExamAnswers] = useState([]);
  const [showBankModal, setShowBankModal] = useState(false);
  const [teacherQuestionsBank, setTeacherQuestionsBank] = useState([]);
  const [selectedBankSubject, setSelectedBankSubject] = useState("");
  const [filteredBankQuestions, setFilteredBankQuestions] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axiosInstance.get("/subjects/teacher");
        console.log("Materias cargadas:", response.data);
        setSubjects(response.data);
      } catch (error) {
        console.error("Error al obtener materias:", error);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedSubject) {
        try {
          console.log(
            "Obteniendo estudiantes para la materia:",
            selectedSubject
          );
          const response = await axiosInstance.get(
            `subjects/${selectedSubject}/students`
          );
          console.log("Respuesta:", response.data);
          setStudents(response.data);
        } catch (error) {
          console.error("Error al obtener alumnos:", error);
        }
      }
    };
    fetchStudents();
  }, [selectedSubject]);

  // Añadir useEffect para cargar preguntas cuando se crea un examen
  useEffect(() => {
    const loadQuestions = async () => {
      if (selectedSubject) {
        try {
          const response = await axiosInstance.get(
            `/questions/subject/${selectedSubject}`
          );
          console.log("Preguntas disponibles:", response.data);
          setQuestions(response.data);
        } catch (error) {
          console.error("Error al cargar preguntas:", error);
        }
      }
    };

    loadQuestions();
  }, [selectedSubject]);

  useEffect(() => {
    const fetchSubmittedExams = async () => {
      try {
        const response = await axiosInstance.get("/exams/teacher/all");
        // Filtramos solo los exámenes que han sido completados
        const completedExams = response.data.filter(
          (exam) => exam.status === "completed"
        );
        console.log("Exámenes completados:", completedExams);
        setSubmittedExams(completedExams);
      } catch (error) {
        console.error("Error al obtener exámenes:", error);
      }
    };

    fetchSubmittedExams();
  }, []);

  // Función para obtener las materias del maestro
  useEffect(() => {
    const fetchTeacherSubjects = async () => {
      try {
        const response = await axiosInstance.get("/subjects/teacher");
        console.log("Materias del profesor:", response.data);
        setTeacherSubjects(response.data);
      } catch (error) {
        console.error("Error al obtener materias:", error);
      }
    };

    fetchTeacherSubjects();
  }, []);

  // Cuando cambia la materia seleccionada en el banco, filtra las preguntas
  useEffect(() => {
    if (selectedBankSubject && teacherQuestionsBank.length > 0) {
      setFilteredBankQuestions(
        teacherQuestionsBank.filter(q => q.subject && (q.subject._id === selectedBankSubject || q.subject === selectedBankSubject))
      );
    } else {
      setFilteredBankQuestions([]);
    }
  }, [selectedBankSubject, teacherQuestionsBank]);

  const handleCreateExam = async () => {
    try {
      // Mostrar loading mientras se crea el examen
      Swal.fire({
        title: "Creando examen",
        text: "Por favor espere...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await axiosInstance.post("/exams/create", {
        studentId: selectedStudents[0],
        subjectId: selectedSubject,
        timeLimit: examConfig.hasTimeLimit ? examConfig.timeLimit : null,
      });

      // Obtenemos los datos del estudiante y la materia para mostrarlos
      const student = students.find((s) => s._id === selectedStudents[0]);
      const subject = subjects.find((s) => s.id === selectedSubject);

      // Mostramos el mensaje de éxito con detalles
      await Swal.fire({
        title: "¡Examen Creado Exitosamente!",
        icon: "success",
        html: `
          <div style="text-align: left; padding: 10px;">
            <div style="margin: 20px 0;">
              <h4 style="color: #4CAF50; margin-bottom: 15px;">Detalles del Examen:</h4>
              <p><b>📚 Materia:</b> ${subject?.name || "No disponible"}</p>
              <p><b>👤 Estudiante:</b> ${
                student?.username || "No disponible"
              }</p>
              <p><b>🆔 ID del Examen:</b> ${response.data._id}</p>
              ${
                examConfig.hasTimeLimit
                  ? `<p><b>⏱️ Tiempo límite:</b> ${examConfig.timeLimit} minutos</p>`
                  : "<p><b>⏱️ Tiempo:</b> Sin límite</p>"
              }
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <p style="color: #666; margin: 0;">
                <i>Ahora puedes proceder a asignar las preguntas al examen.</i>
              </p>
            </div>
          </div>
        `,
        confirmButtonColor: "#4CAF50",
        confirmButtonText: "Continuar",
        showCancelButton: true,
        cancelButtonText: "Cerrar",
        cancelButtonColor: "#d33",
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          // Si el usuario hace clic en continuar, procedemos con el examen
          setCurrentExam(response.data);
        } else {
          // Si el usuario cancela, limpiamos la selección
          setSelectedStudents([]);
          setSelectedSubject("");
          setExamConfig({ timeLimit: 30, hasTimeLimit: false });
        }
      });
    } catch (error) {
      console.error("Error al crear examen:", error);

      await Swal.fire({
        title: "Error",
        text: "No se pudo crear el examen. Por favor, intente nuevamente.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleAssignQuestions = async () => {
    try {
      if (selectedQuestions.length < 3) {
        await Swal.fire({
          title: "¡Atención!",
          text: "Debes seleccionar al menos 3 preguntas",
          icon: "warning",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      // Mostrar loading
      Swal.fire({
        title: "Creando exámenes",
        text: "Por favor espere...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Crear exámenes para cada estudiante seleccionado
      const creationPromises = selectedStudents.map((studentId) =>
        axiosInstance.post("/exams/create", {
          studentId,
          subjectId: selectedSubject,
          timeLimit: examConfig.hasTimeLimit ? examConfig.timeLimit : null,
        })
      );

      const examResponses = await Promise.all(creationPromises);

      // Asignar preguntas a cada examen creado
      const assignmentPromises = examResponses.map((response) =>
        axiosInstance.post("/exams/assign-questions", {
          examId: response.data._id,
          questionIds: selectedQuestions,
        })
      );

      await Promise.all(assignmentPromises);

      await Swal.fire({
        title: "¡Éxito!",
        text: `Se han creado ${selectedStudents.length} exámenes exitosamente`,
        icon: "success",
        confirmButtonColor: "#4CAF50",
      });

      // Limpiar estados
      setSelectedQuestions([]);
      setShowQuestionSelection(false);
      setSelectedStudents([]);
      setSelectedSubject("");
      setExamConfig({ timeLimit: 30, hasTimeLimit: false });
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudieron crear los exámenes",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  // Función para manejar la creación de preguntas
  const handleCreateQuestion = async (e) => {
    e.preventDefault();

    const newQuestionData = {
      subject: newQuestion.subject,
      question: newQuestion.questionText,
      correctAnswer: newQuestion.correctAnswer,
      score: parseInt(newQuestion.score) || 10,
    };

    // Validación de campos
    if (
      !newQuestionData.subject ||
      !newQuestionData.question ||
      !newQuestionData.correctAnswer
    ) {
      await Swal.fire({
        title: "Campos incompletos",
        text: "Por favor completa todos los campos requeridos",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    setQuestionsList([...questionsList, newQuestionData]);

    // Toast de confirmación
    await Swal.fire({
      position: "top-end",
      icon: "success",
      title: "Pregunta agregada a la lista",
      showConfirmButton: false,
      timer: 1500,
      toast: true,
    });

    // Limpiamos el formulario pero mantenemos la materia seleccionada
    setNewQuestion({
      subject: newQuestion.subject,
      questionText: "",
      correctAnswer: "",
      score: 10,
    });
  };

  // Modificamos el handleSaveQuestions para asegurar el formato correcto
  const handleSaveQuestions = async () => {
    try {
      if (questionsList.length === 0) {
        await Swal.fire({
          title: "¡Atención!",
          text: "Agregue al menos una pregunta",
          icon: "warning",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      // Verificamos que todas las preguntas tengan los campos necesarios
      const hasInvalidQuestions = questionsList.some(
        (q) => !q.subject || !q.question || !q.correctAnswer || !q.score
      );

      if (hasInvalidQuestions) {
        await Swal.fire({
          title: "Error de validación",
          text: "Todas las preguntas deben tener todos los campos completos",
          icon: "error",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      // Mostrar loading mientras se guardan las preguntas
      Swal.fire({
        title: "Guardando preguntas",
        text: "Por favor espere...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await axiosInstance.post("/questions/create", {
        questions: questionsList.map((q) => ({
          subject: q.subject,
          question: q.question,
          correctAnswer: q.correctAnswer,
          score: parseInt(q.score) || 10,
        })),
      });

      await Swal.fire({
        title: "¡Éxito!",
        text: `${questionsList.length} pregunta(s) creada(s) exitosamente`,
        icon: "success",
        confirmButtonColor: "#3085d6",
      });

      // Limpiar el formulario y la lista
      setQuestionsList([]);
      setShowQuestionModal(false);

      // Actualizar la lista de preguntas si hay una materia seleccionada
      if (selectedSubject) {
        try {
          const questionsResponse = await axiosInstance.get(
            `/questions/subject/${selectedSubject}`
          );
          console.log("Preguntas actualizadas:", questionsResponse.data);
          setQuestions(questionsResponse.data);
        } catch (error) {
          console.error("Error al actualizar preguntas:", error);
        }
      }
    } catch (error) {
      console.error("Error completo:", error);
      console.error("Datos del error:", error.response?.data);

      await Swal.fire({
        title: "Error",
        text: "Error al guardar las preguntas. Por favor verifica todos los campos.",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  // Función para eliminar una pregunta de la lista temporal
  const handleRemoveQuestion = async (index) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas eliminar esta pregunta de la lista?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      setQuestionsList(questionsList.filter((_, i) => i !== index));
      await Swal.fire({
        title: "¡Eliminada!",
        text: "La pregunta ha sido eliminada de la lista",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleCloseModal = async () => {
    if (questionsList.length > 0) {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Hay preguntas sin guardar. ¿Deseas cerrar de todos modos?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, cerrar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        setShowQuestionModal(false);
        setQuestionsList([]);
      }
    } else {
      setShowQuestionModal(false);
    }
  };

  const renderQuestionSelection = () => {
    if (!currentExam) return null;

    return (
      <div className="section">
        <h2>Seleccionar Preguntas</h2>
        <div className="questions-list">
          {questions.map((questionItem) => (
            <div key={questionItem._id} className="question-item">
              <input
                type="checkbox"
                id={questionItem._id}
                checked={selectedQuestions.includes(questionItem._id)}
                onChange={() => {
                  const newSelected = selectedQuestions.includes(
                    questionItem._id
                  )
                    ? selectedQuestions.filter((id) => id !== questionItem._id)
                    : [...selectedQuestions, questionItem._id];
                  setSelectedQuestions(newSelected);
                }}
              />
              <label htmlFor={questionItem._id}>{questionItem.question}</label>
            </div>
          ))}
        </div>
        {questions.length > 0 && (
          <button onClick={handleAssignQuestions} className="assign-button">
            Asignar Preguntas
          </button>
        )}
      </div>
    );
  };

  const TeacherExamList = () => {
    const handleReviewExam = async (examId) => {
      try {
        const response = await axiosInstance.get(`/exams/${examId}/answers`);
        console.log("Respuestas obtenidas:", response.data);

        // Asegurarnos de que cada respuesta tenga un valor isCorrect definido
        const formattedAnswers = response.data.answers.map((answer) => ({
          ...answer,
          isCorrect: answer.isCorrect === true, // Convertir explícitamente a booleano
        }));

        setExamAnswers(formattedAnswers);
        setExamToReview(examId);
      } catch (error) {
        console.error("Error al obtener respuestas:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las respuestas del examen",
        });
      }
    };

    const handleUpdateAnswer = async (answerId, isCorrect) => {
      try {
        Swal.fire({
          title: "Actualizando...",
          text: "Por favor espere",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Actualizar primero el estado local para feedback inmediato
        setExamAnswers((prevAnswers) =>
          prevAnswers.map((answer) =>
            answer._id === answerId ? { ...answer, isCorrect } : answer
          )
        );

        const response = await axiosInstance.patch(
          `/exams/${examToReview}/answers/${answerId}`,
          {
            isCorrect,
          }
        );

        // Actualizar la lista de exámenes
        const updatedExamsResponse = await axiosInstance.get(
          "/exams/teacher/all"
        );
        const completedExams = updatedExamsResponse.data.filter(
          (exam) => exam.status === "completed"
        );
        setSubmittedExams(completedExams);

        Swal.fire({
          icon: "success",
          title: "Calificación Actualizada",
          html: `
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px;
              background: #f8f9fa;
              border-radius: 8px;
              margin: 10px 0;
              font-size: 14px;
            ">
              <span style="color: #28a745">
                <i class="fas fa-check-circle"></i> Correctas: ${response.data.stats.correctAnswers}
              </span>
              <span style="color: #dc3545">
                <i class="fas fa-times-circle"></i> Incorrectas: ${response.data.stats.incorrectAnswers}
              </span>
              <span style="color: #17a2b8">
                <i class="fas fa-star"></i> Calificación: ${response.data.stats.calification}%
              </span>
            </div>
          `,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: "#fff",
          padding: "1em",
          customClass: {
            popup: "animated slideInRight",
            title: "swal2-title-custom",
          },
        });
      } catch (error) {
        console.error("Error al actualizar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar la respuesta",
        });
      }
    };

    return (
      <div className="submitted-exams-section">
        <h2>Exámenes Entregados</h2>
        {submittedExams.length === 0 ? (
          <p>No hay exámenes entregados aún</p>
        ) : (
          <table className="exams-table">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Materia</th>
                <th>Correctas</th>
                <th>Incorrectas</th>
                <th>Calificación</th>
              </tr>
            </thead>
            <tbody>
              {submittedExams.map(
                (exam) =>
                  exam.status === "completed" && (
                    <tr
                      key={exam._id}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleReviewExam(exam._id)}
                    >
                      <td>
                        {exam.student?.email?.split("@")[0] || "No disponible"}
                      </td>
                      <td>{exam.subject?.name || "No disponible"}</td>
                      <td>{exam.correctAnswers}</td>
                      <td>{exam.incorrectAnswers}</td>
                      <td>{exam.calification}</td>
                    </tr>
                  )
              )}
            </tbody>
          </table>
        )}

        {/* Modal de revisión */}
        {examToReview && (
          <div className="modal-overlay">
            <div className="modal-content review-modal">
              <div className="review-header">
                <h2>Revisión de Examen</h2>
                <button
                  className="close-button"
                  onClick={() => {
                    setExamToReview(null);
                    setExamAnswers([]);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="answers-list">
                {examAnswers.map((answer, index) => (
                  <div key={answer._id} className="answer-review-item">
                    <div className="question-header">
                      <h3>Pregunta {index + 1}</h3>
                      <span
                        className={`status-badge ${
                          answer.isCorrect ? "correct" : "incorrect"
                        }`}
                      >
                        {answer.isCorrect ? "Correcta" : "Incorrecta"}
                      </span>
                    </div>

                    <div className="answer-content">
                      <div className="content-row">
                        <span className="label">Pregunta:</span>
                        <span className="value">{answer.question}</span>
                      </div>

                      <div className="content-row">
                        <span className="label">Respuesta del alumno:</span>
                        <span className="value">{answer.studentAnswer}</span>
                      </div>

                      <div className="content-row">
                        <span className="label">Respuesta correcta:</span>
                        <span className="value">{answer.correctAnswer}</span>
                      </div>

                      <div className="evaluation-buttons">
                        <button
                          className={`eval-button ${
                            answer.isCorrect ? "active" : ""
                          }`}
                          onClick={() => handleUpdateAnswer(answer._id, true)}
                        >
                          Correcta
                        </button>
                        <button
                          className={`eval-button ${
                            !answer.isCorrect ? "active" : ""
                          }`}
                          onClick={() => handleUpdateAnswer(answer._id, false)}
                        >
                          Incorrecta
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Función para abrir el banco de preguntas
  const handleOpenBankModal = async () => {
    try {
      // Puedes ajustar la ruta según tu backend
      const response = await axiosInstance.get("/questions/teacher");
      setTeacherQuestionsBank(response.data);
      setShowBankModal(true);
    } catch (error) {
      console.error("Error al obtener el banco de preguntas:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar el banco de preguntas",
      });
    }
  };

  const getBankQuestionsToShow = () => {
    if (selectedSubject) {
      return questions;
    } else if (selectedBankSubject) {
      return filteredBankQuestions;
    } else {
      return [];
    }
  };

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setShowActionModal(true);
  };

  const handleCloseActionModal = () => {
    setSelectedQuestion(null);
    setShowActionModal(false);
  };

  const handleEditQuestion = async () => {
    try {
      const result = await Swal.fire({
        title: 'Editar Pregunta',
        html: `
          <div class="edit-question-form">
            <textarea id="questionText" class="swal2-textarea" placeholder="Pregunta">${selectedQuestion.question}</textarea>
            <textarea id="answerText" class="swal2-textarea" placeholder="Respuesta correcta">${selectedQuestion.correctAnswer}</textarea>
            <input type="number" id="scoreInput" class="swal2-input" value="${selectedQuestion.score || 10}" min="1">
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const questionText = document.getElementById('questionText').value;
          const answerText = document.getElementById('answerText').value;
          const score = parseInt(document.getElementById('scoreInput').value) || 10;

          if (!questionText || !answerText) {
            Swal.showValidationMessage('Por favor completa todos los campos');
            return false;
          }

          if (score < 1) {
            Swal.showValidationMessage('El puntaje debe ser mayor a 0');
            return false;
          }

          return { questionText, answerText, score };
        }
      });

      if (result.isConfirmed) {
        // Mostrar loading mientras se procesa
        Swal.fire({
          title: 'Actualizando pregunta...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const { questionText, answerText, score } = result.value;
        
        const response = await axiosInstance.put(`/questions/${selectedQuestion._id}`, {
          question: questionText,
          correctAnswer: answerText,
          score: score
        });

        if (response.data) {
          // Actualizar la lista de preguntas
          const questionsResponse = await axiosInstance.get("/questions/teacher");
          setTeacherQuestionsBank(questionsResponse.data);

          handleCloseActionModal();

          await Swal.fire({
            icon: 'success',
            title: '¡Pregunta actualizada!',
            text: 'Los cambios se guardaron correctamente',
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    } catch (error) {
      console.error('Error al editar la pregunta:', error);
      let errorMessage = 'No se pudo actualizar la pregunta.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'La pregunta no fue encontrada. Es posible que haya sido eliminada.';
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      }

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleDeleteQuestion = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        // Mostrar loading mientras se procesa
        Swal.fire({
          title: 'Eliminando pregunta...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await axiosInstance.delete(`/questions/${selectedQuestion._id}`);

        if (response.data) {
          // Actualizar la lista de preguntas
          const questionsResponse = await axiosInstance.get("/questions/teacher");
          setTeacherQuestionsBank(questionsResponse.data);

          handleCloseActionModal();

          await Swal.fire({
            icon: 'success',
            title: '¡Pregunta eliminada!',
            text: 'La pregunta se eliminó correctamente',
            showConfirmButton: false,
            timer: 1500
          });
        }
      }
    } catch (error) {
      console.error('Error al eliminar la pregunta:', error);
      let errorMessage = 'No se pudo eliminar la pregunta.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'La pregunta no fue encontrada. Es posible que haya sido eliminada.';
        } else if (error.response.status === 400 && error.response.data.examCount) {
          errorMessage = `No se puede eliminar la pregunta porque está siendo usada en ${error.response.data.examCount} examen(es).`;
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      }

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#3085d6'
      });
    }
  };

  return (
    <div className="contenedor-principal">
      <div className="contenedor">
        <div className="exams-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1>Asignación de Exámenes</h1>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="add-question-button"
                onClick={() => setShowQuestionModal(true)}
              >
                Agregar Nueva Pregunta
              </button>
              <button
                className="add-question-button"
                style={{ background: "#2196f3" }}
                onClick={handleOpenBankModal}
              >
                Ver banco de preguntas
              </button>
            </div>
          </div>

          {/* Selector de materia */}
          <div>
            <h2>Seleccionar Materia</h2>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedStudents([]); // Limpiar estudiantes seleccionados
              }}
            >
              <option value="">Seleccione una materia</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de estudiantes (solo se muestra si hay una materia seleccionada) */}
          {selectedSubject && (
            <div>
              <h2>Seleccionar Estudiantes</h2>
              <div className="students-selection">
                {students.map((student) => (
                  <div key={student._id} className="student-checkbox">
                    <input
                      type="checkbox"
                      id={`student-${student._id}`}
                      checked={selectedStudents.includes(student._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents((prev) => [...prev, student._id]);
                        } else {
                          setSelectedStudents((prev) =>
                            prev.filter((id) => id !== student._id)
                          );
                        }
                      }}
                    />
                    <label htmlFor={`student-${student._id}`}>
                      {student.username}
                    </label>
                  </div>
                ))}
              </div>
              {selectedStudents.length > 0 && (
                <div className="time-limit-section">
                  <h2>Configuración de Tiempo</h2>
                  <div className="time-limit-controls">
                    <label className="time-limit-switch">
                      <input
                        type="checkbox"
                        checked={examConfig.hasTimeLimit}
                        onChange={(e) =>
                          setExamConfig((prev) => ({
                            ...prev,
                            hasTimeLimit: e.target.checked,
                          }))
                        }
                      />
                      <span className="switch-slider"></span>
                      Establecer límite de tiempo
                    </label>

                    {examConfig.hasTimeLimit && (
                      <div className="time-input">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={examConfig.timeLimit}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            setExamConfig((prev) => ({
                              ...prev,
                              timeLimit: Math.max(1, value),
                            }));
                          }}
                          onKeyDown={(e) => {
                            // Permitir solo números, backspace, delete, y teclas de navegación
                            if (
                              !/[\d\b]/.test(e.key) &&
                              ![
                                "Backspace",
                                "Delete",
                                "ArrowLeft",
                                "ArrowRight",
                                "Tab",
                              ].includes(e.key)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          style={{
                            width: "80px",
                            padding: "8px",
                            fontSize: "14px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                          }}
                        />
                        <span>minutos</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedStudents.length > 0 && (
                <div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await axiosInstance.get(
                          `/questions/subject/${selectedSubject}`
                        );
                        const availableQuestions = response.data;

                        if (availableQuestions.length < 3) {
                          await Swal.fire({
                            title: "No hay suficientes preguntas",
                            text: "Debe haber al menos 3 preguntas disponibles para crear un examen",
                            icon: "warning",
                            confirmButtonColor: "#3085d6",
                          });
                          return;
                        }

                        setQuestions(availableQuestions);
                        setShowQuestionSelection(true);
                      } catch (error) {
                        console.error("Error al obtener preguntas:", error);
                        Swal.fire({
                          icon: "error",
                          title: "Error",
                          text: "Error al cargar las preguntas disponibles",
                        });
                      }
                    }}
                    className="next-step-button"
                  >
                    Siguiente: Seleccionar Preguntas ({selectedStudents.length}{" "}
                    estudiantes seleccionados)
                  </button>
                </div>
              )}
            </div>
          )}

          {showQuestionSelection && (
            <div className="question-selection-section">
              <h2>Seleccionar Preguntas</h2>
              <p>Selecciona al menos 3 preguntas para el examen</p>
              <div className="questions-list">
                {questions.map((questionItem) => (
                  <div key={questionItem._id} className="question-item">
                    <input
                      type="checkbox"
                      id={questionItem._id}
                      checked={selectedQuestions.includes(questionItem._id)}
                      onChange={() => {
                        const newSelected = selectedQuestions.includes(
                          questionItem._id
                        )
                          ? selectedQuestions.filter(
                              (id) => id !== questionItem._id
                            )
                          : [...selectedQuestions, questionItem._id];
                        setSelectedQuestions(newSelected);
                      }}
                    />
                    <label htmlFor={questionItem._id}>
                      {questionItem.question}
                    </label>
                  </div>
                ))}
              </div>
              <div className="buttons-container">
                <button
                  onClick={() => setShowQuestionSelection(false)}
                  className="cancel-button"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignQuestions}
                  className="create-exam-button"
                  disabled={selectedQuestions.length < 3}
                >
                  Crear Examen
                </button>
              </div>
            </div>
          )}

          {/* Modal para crear preguntas */}
          {showQuestionModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Crear Nuevas Preguntas</h2>
                <form onSubmit={handleCreateQuestion}>
                  <div className="form-group">
                    <label>Materia:</label>
                    <select
                      value={newQuestion.subject}
                      onChange={(e) => {
                        console.log(
                          "ID de materia seleccionada:",
                          e.target.value
                        );
                        setNewQuestion({
                          ...newQuestion,
                          subject: e.target.value,
                        });
                      }}
                      required
                    >
                      <option value="">Seleccione una materia</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Pregunta:</label>
                    <textarea
                      value={newQuestion.questionText}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          questionText: e.target.value,
                        })
                      }
                      required
                      placeholder="Escribe la pregunta aquí"
                    />
                  </div>

                  <div className="form-group">
                    <label>Respuesta Correcta:</label>
                    <textarea
                      value={newQuestion.correctAnswer}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          correctAnswer: e.target.value,
                        })
                      }
                      required
                      placeholder="Escribe la respuesta correcta aquí"
                    />
                  </div>

                  <div className="form-group">
                    <label>Puntaje:</label>
                    <input
                      type="number"
                      value={newQuestion.score}
                      onChange={(e) => {
                        const value =
                          e.target.value === "" ? "" : parseInt(e.target.value);
                        setNewQuestion({
                          ...newQuestion,
                          score: value,
                        });
                      }}
                      onBlur={(e) => {
                        // Aplicar valor mínimo de 1 cuando pierde el foco
                        const value =
                          e.target.value === "" ? 1 : parseInt(e.target.value);
                        setNewQuestion({
                          ...newQuestion,
                          score: Math.max(1, value),
                        });
                      }}
                      style={{
                        width: "80px",
                        padding: "8px",
                        fontSize: "14px",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                      }}
                      required
                    />
                  </div>

                  <div className="modal-buttons">
                    <button type="submit">Agregar a la lista</button>
                    <button type="button" onClick={handleCloseModal}>
                      Cancelar
                    </button>
                  </div>
                </form>

                {/* Lista de preguntas agregadas */}
                {questionsList.length > 0 && (
                  <div className="questions-preview">
                    <h3>Preguntas por guardar ({questionsList.length})</h3>
                    <div className="questions-list">
                      {questionsList.map((q, index) => (
                        <div key={index} className="question-preview-item">
                          <div>
                            <strong>Pregunta {index + 1}:</strong> {q.question}
                            <br />
                            <small>
                              Respuesta: {q.correctAnswer} | Puntaje: {q.score}
                            </small>
                          </div>
                          <button
                            onClick={() => handleRemoveQuestion(index)}
                            className="remove-question-btn"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleSaveQuestions}
                      className="save-all-btn"
                    >
                      Guardar todas las preguntas
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal para banco de preguntas */}
          {showBankModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>Banco de Preguntas del Maestro</h2>
                  <button 
                    className="modal-close-btn" 
                    onClick={() => { 
                      setShowBankModal(false); 
                      setSelectedBankSubject(""); 
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="form-group">
                  <label>Materia:</label>
                  <select
                    value={selectedSubject || selectedBankSubject}
                    onChange={e => {
                      if (selectedSubject) return;
                      setSelectedBankSubject(e.target.value);
                    }}
                    disabled={!!selectedSubject}
                  >
                    <option value="">Seleccione una materia</option>
                    {teacherSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
                <div className="questions-list">
                  {(selectedSubject || selectedBankSubject) && getBankQuestionsToShow().length === 0 && (
                    <p>No hay preguntas registradas para esta materia.</p>
                  )}
                  {getBankQuestionsToShow().map((q, idx) => (
                    <div 
                      key={q._id || idx} 
                      className="question-item bank-question"
                      onClick={() => handleQuestionClick(q)}
                    >
                      <div className="question-content">
                        <div>
                          <b>Pregunta:</b> {q.question}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal de acciones para editar/eliminar pregunta */}
          {showActionModal && selectedQuestion && (
            <div className="modal-overlay">
              <div className="modal-content action-modal">
                <div className="modal-header">
                  <h3>Acciones de Pregunta</h3>
                  <button className="modal-close-btn" onClick={handleCloseActionModal}>×</button>
                </div>
                <div className="modal-content">
                  <div className="selected-question">
                    <p><b>Pregunta:</b> {selectedQuestion.question}</p>
                    <p><b>Respuesta:</b> {selectedQuestion.correctAnswer}</p>
                    <p><b>Puntaje:</b> {selectedQuestion.score}</p>
                  </div>
                  <div className="action-buttons">
                    <button className="action-btn edit" onClick={handleEditQuestion}>
                      <FaEdit /> Editar
                    </button>
                    <button className="action-btn delete" onClick={handleDeleteQuestion}>
                      <FaTrash /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <TeacherExamList />
        </div>
      </div>
    </div>
  );
};

export default Exams;
