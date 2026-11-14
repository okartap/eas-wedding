/* Configuración de la sincronización (Firebase). Se rellena una sola vez al crear el proyecto de Firebase.
   Mientras apiKey esté vacío, la app funciona solo en el dispositivo, sin sincronizar. */
window.EAS_FIREBASE = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  /* correo de cada usuario -> nombre que aparece en el historial */
  users: {
    // 'andrea@correo.com': 'Andrea',
    // 'martin@correo.com': 'Martin'
  }
};
