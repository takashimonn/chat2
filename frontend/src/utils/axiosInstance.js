import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000/api', // Aquí está el puerto 4000 correcto
  headers: {
    'Content-Type': 'application/json'
  }
});

export default axiosInstance; 