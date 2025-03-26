import axiosInstance from './axiosConfig';

export const logout = async () => {
  try {
    console.log('Iniciando proceso de logout');
    // Llamar al endpoint de logout
    const response = await axiosInstance.post('/auth/logout');
    console.log('Respuesta del servidor:', response.data);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  } finally {
    console.log('Limpiando localStorage');
    // Limpiar localStorage incluso si falla la petición
    localStorage.clear(); // Usar clear en lugar de removeItem individual
  }
}; 